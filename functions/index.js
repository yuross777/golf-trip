const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const https = require("https");

const googlePlacesApiKey = defineSecret("GOOGLE_PLACES_API_KEY");

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