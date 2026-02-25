const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const https = require("https");
const admin = require("firebase-admin");

// Initialize Firebase Admin (guard against duplicate init)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const googlePlacesApiKey = defineSecret("GOOGLE_PLACES_API_KEY");
const kakaoRestApiKey = defineSecret("KAKAO_REST_API_KEY");
const kakaoClientSecret = defineSecret("KAKAO_CLIENT_SECRET");

/**
 * Proxies Google Places photo requests server-side so the API key is never
 * exposed to the browser. Handles the redirect that the Places API returns.
 *
 * Usage: GET /placePhoto?photoName=places/{id}/photos/{ref}&maxWidthPx=800
 */
exports.placePhoto = onRequest(
  {
    secrets: [googlePlacesApiKey],
    cors: true,
    region: "us-central1",
  },
  (req, res) => {
    const { photoName, maxWidthPx = "800" } = req.query;

    if (!photoName) {
      res.status(400).json({ error: "photoName is required" });
      return;
    }

    const apiUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${googlePlacesApiKey.value()}`;

    const fetchWithRedirect = (url, hops = 0) => {
      if (hops > 5) {
        res.status(500).json({ error: "Too many redirects" });
        return;
      }

      https
        .get(url, (upstream) => {
          if (upstream.statusCode === 301 || upstream.statusCode === 302) {
            upstream.resume();
            fetchWithRedirect(upstream.headers.location, hops + 1);
            return;
          }

          if (upstream.statusCode !== 200) {
            upstream.resume();
            res.status(upstream.statusCode).json({ error: "Upstream error" });
            return;
          }

          res.set("Content-Type", upstream.headers["content-type"] || "image/jpeg");
          res.set("Cache-Control", "public, max-age=86400");
          upstream.pipe(res);
        })
        .on("error", () => {
          res.status(500).json({ error: "Failed to fetch image" });
        });
    };

    fetchWithRedirect(apiUrl);
  }
);

/**
 * Exchanges a Kakao auth code for an access token, validates the user,
 * upserts their profile in Firestore, and returns a Firebase Custom Token.
 *
 * Usage: POST /kakaoAuth  Body: { "code": "<kakao_auth_code>", "redirectUri": "<origin>" }
 */
exports.kakaoAuth = onRequest(
  {
    cors: true,
    region: "us-central1",
    secrets: [kakaoRestApiKey, kakaoClientSecret],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { code, redirectUri } = req.body;
    if (!code || !redirectUri) {
      res.status(400).json({ error: "code and redirectUri are required" });
      return;
    }

    try {
      // 1. Exchange auth code for Kakao access token
      const clientId = kakaoRestApiKey.value();
      console.log("kakaoAuth debug — redirectUri:", redirectUri);
      console.log("kakaoAuth debug — client_id length:", clientId.length, "first4:", clientId.slice(0, 4));
      console.log("kakaoAuth debug — code length:", code.length);

      const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: kakaoRestApiKey.value(),
          client_secret: kakaoClientSecret.value(),
          redirect_uri: redirectUri,
          code,
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const err = await tokenResponse.json();
        console.error("Kakao token exchange failed:", err);
        res.status(401).json({ error: "Failed to exchange Kakao auth code" });
        return;
      }

      const { access_token: accessToken } = await tokenResponse.json();

      // 2. Get Kakao user info
      const kakaoResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!kakaoResponse.ok) {
        res.status(401).json({ error: "Failed to get Kakao user info" });
        return;
      }

      const kakaoUser = await kakaoResponse.json();
      const kakaoId = String(kakaoUser.id);
      const uid = `kakao:${kakaoId}`;

      // 3. Upsert user profile in Firestore
      const profile = {
        kakaoId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const kakaoAccount = kakaoUser.kakao_account || {};
      if (kakaoAccount.profile?.nickname) {
        profile.displayName = kakaoAccount.profile.nickname;
      }
      if (kakaoAccount.profile?.profile_image_url) {
        profile.photoURL = kakaoAccount.profile.profile_image_url;
      }
      if (kakaoAccount.email) {
        profile.email = kakaoAccount.email;
      }

      await admin.firestore().collection("users").doc(uid).set(profile, { merge: true });

      // 4. Issue Firebase Custom Token
      const customToken = await admin.auth().createCustomToken(uid);

      res.json({ customToken });
    } catch (err) {
      console.error("kakaoAuth error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
