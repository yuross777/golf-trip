export function stripApiKey(url: string) {
  // Remove any existing key parameter
  return url.replace(/[?&]key=[^&]*/g, '');
}

export function getProxiedPlacePhotoUrl(originalUrl: string) {
  if (!originalUrl) return originalUrl;
  try {
    const lower = originalUrl.toLowerCase();
    if (lower.includes('places.googleapis.com')) {
      const cleaned = stripApiKey(originalUrl);
      // Netlify function endpoint. It will append the real key server-side.
      return `/.netlify/functions/place-photo?url=${encodeURIComponent(cleaned)}`;
    }
  } catch (e) {
    // fallthrough
  }
  return originalUrl;
}
