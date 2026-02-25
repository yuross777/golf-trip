/**
 * Firebase Storage Migration Script
 *
 * Scans mockData.ts for Course image fields that contain a Google Places
 * photo reference (pattern: "places/{id}/photos/{ref}") and:
 *   1. Downloads the image from Google Places API
 *   2. Uploads it to Firebase Storage (public)
 *   3. Replaces the photo reference with the permanent Storage URL
 *
 * Already-migrated entries (Storage URLs) are skipped automatically.
 *
 * Prerequisites:
 *   1. Download a service account key from Firebase Console:
 *      Project Settings → Service Accounts → Generate new private key
 *      Save as: service-account.json  (project root — already in .gitignore)
 *
 * Usage (PowerShell):
 *   $env:GOOGLE_PLACES_API_KEY="AIzaSy..."; node scripts/upload-mock-images.mjs
 *
 * Usage (bash/zsh):
 *   GOOGLE_PLACES_API_KEY=AIzaSy... node scripts/upload-mock-images.mjs
 *
 * Optional env vars:
 *   SERVICE_ACCOUNT   path to service account JSON  (default: ./service-account.json)
 *   STORAGE_BUCKET    Firebase Storage bucket name   (default: auto from .firebaserc)
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import https from "https";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Config ────────────────────────────────────────────────────────────────────

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SA_PATH = process.env.SERVICE_ACCOUNT ?? join(ROOT, "service-account.json");

const firebaserc = JSON.parse(readFileSync(join(ROOT, ".firebaserc"), "utf8"));
const PROJECT_ID = firebaserc.projects.default;
const BUCKET = process.env.STORAGE_BUCKET ?? `${PROJECT_ID}.firebasestorage.app`;

const MOCK_DATA_PATH = join(ROOT, "src/app/data/mockData.ts");

// ── Validation ────────────────────────────────────────────────────────────────

if (!PLACES_KEY) {
  console.error("❌  GOOGLE_PLACES_API_KEY is not set.");
  console.error(
    "\n  PowerShell:  $env:GOOGLE_PLACES_API_KEY=\"AIzaSy...\"; node scripts/upload-mock-images.mjs"
  );
  console.error(
    "  bash:        GOOGLE_PLACES_API_KEY=AIzaSy... node scripts/upload-mock-images.mjs\n"
  );
  process.exit(1);
}

if (!existsSync(SA_PATH)) {
  console.error(`❌  Service account key not found at: ${SA_PATH}`);
  console.error(
    "    Firebase Console → Project Settings → Service Accounts → Generate new private key"
  );
  process.exit(1);
}

// ── Firebase Admin ────────────────────────────────────────────────────────────

const serviceAccount = JSON.parse(readFileSync(SA_PATH, "utf8"));
initializeApp({ credential: cert(serviceAccount), storageBucket: BUCKET });
const bucket = getStorage().bucket();

// ── Helpers ───────────────────────────────────────────────────────────────────

function fetchImage(url, hops = 0) {
  return new Promise((resolve, reject) => {
    if (hops > 5) return reject(new Error("Too many redirects"));
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          res.resume();
          return resolve(fetchImage(res.headers.location, hops + 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            buffer: Buffer.concat(chunks),
            contentType: res.headers["content-type"] ?? "image/jpeg",
          })
        );
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

let mockData = readFileSync(MOCK_DATA_PATH, "utf8");

// Match both formats:
//   Format A (short):  "image": "places/{id}/photos/{ref}"
//   Format B (full):   "image": "https://places.googleapis.com/v1/places/{id}/photos/{ref}/media?..."
// Already-migrated Storage URLs are skipped automatically.
const SHORT_RE = /"image":\s*"(places\/[^/]+\/photos\/[A-Za-z0-9_-]+)"/g;
const FULL_RE  = /"image":\s*"https:\/\/places\.googleapis\.com\/v1\/(places\/[^/]+\/photos\/[A-Za-z0-9_-]+)\/media[^"]*"/g;

const matches = [
  ...[...mockData.matchAll(SHORT_RE)],
  ...[...mockData.matchAll(FULL_RE)],
];

if (matches.length === 0) {
  console.log('✅  No Google Places photo references found in mockData.ts.');
  console.log('    Add new courses with:  "image": "places/{id}/photos/{ref}"');
  process.exit(0);
}

console.log(`\n🚀  Migrating ${matches.length} image(s) → gs://${BUCKET}\n`);

let successCount = 0;
let failCount = 0;

for (let i = 0; i < matches.length; i++) {
  const match = matches[i];
  const photoName = match[1]; // "places/{id}/photos/{ref}"
  const placeId = photoName.split("/")[1];
  const storagePath = `course-images/${placeId}.jpg`;

  console.log(`[${i + 1}/${matches.length}] ${placeId}`);

  try {
    process.stdout.write("  ⬇  Downloading ... ");
    const placesUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&key=${PLACES_KEY}`;
    const { buffer, contentType } = await fetchImage(placesUrl);
    console.log(`${(buffer.length / 1024).toFixed(0)} KB`);

    process.stdout.write("  ⬆  Uploading     ... ");
    const file = bucket.file(storagePath);
    await file.save(buffer, { metadata: { contentType } });
    await file.makePublic();

    const storageUrl = `https://storage.googleapis.com/${BUCKET}/${storagePath}`;
    console.log("done");
    console.log(`  ✅  ${storageUrl}\n`);

    mockData = mockData.replace(match[0], `"image": "${storageUrl}"`);
    successCount++;
  } catch (err) {
    console.error(`  ❌  Failed: ${err.message}\n`);
    failCount++;
  }
}

// ── Save ──────────────────────────────────────────────────────────────────────

if (successCount > 0) {
  writeFileSync(MOCK_DATA_PATH, mockData, "utf8");
  console.log(`✅  mockData.ts updated — ${successCount} migrated, ${failCount} failed.`);
} else {
  console.log("⚠️   No images were migrated. mockData.ts was not changed.");
}
