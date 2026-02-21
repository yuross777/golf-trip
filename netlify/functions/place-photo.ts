import fetch from 'node-fetch';

// Netlify function to proxy Place Photo requests and attach server-side API key
// Configure the key in Netlify UI as GOOGLE_PLACES_API_KEY or set locally in .env during dev

export const handler = async (event: any) => {
  try {
    const { url } = event.queryStringParameters || {};
    if (!url) {
      return { statusCode: 400, body: 'Missing url query param' };
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: 'Server missing Places API key' };
    }

    // Reconstruct the Places Photo request by appending the key
    const photoUrl = `${url}${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(photoUrl);
    if (!res.ok) {
      const text = await res.text();
      return { statusCode: res.status, body: text };
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'application/octet-stream';

    return {
      statusCode: 200,
      headers: { 'Content-Type': contentType },
      body: Buffer.from(buffer).toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err: any) {
    return { statusCode: 500, body: String(err) };
  }
};
