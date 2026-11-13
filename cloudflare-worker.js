const ALLOWED_ORIGINS = new Set([
  "https://wulanday9-a11y.github.io",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
]);

const CACHE_KEY = new Request("https://nexora-fx-cache.invalid/eur-usd");
const CACHE_TTL_SECONDS = 60;

function jsonResponse(body, status = 200, origin = null, cacheControl = "no-store") {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": cacheControl,
    "Vary": "Origin",
  });

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return new Response(JSON.stringify(body), { status, headers });
}

function corsResponse(response, origin) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Vary", "Origin");
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (!ALLOWED_ORIGINS.has(origin)) {
      return jsonResponse({ error: "Origin is not allowed." }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin",
        },
      });
    }

    if (request.method !== "GET" || pathname !== "/api/eur-usd") {
      return jsonResponse({ error: "Not found." }, 404, origin);
    }

    if (!env.TWELVE_DATA_API_KEY) {
      return jsonResponse({ error: "FX provider is not configured." }, 503, origin);
    }

    const cachedResponse = await caches.default.match(CACHE_KEY);
    if (cachedResponse) {
      return corsResponse(cachedResponse, origin);
    }

    const providerUrl = new URL("https://api.twelvedata.com/price");
    providerUrl.searchParams.set("symbol", "EUR/USD");
    providerUrl.searchParams.set("apikey", env.TWELVE_DATA_API_KEY);

    let providerResponse;
    try {
      providerResponse = await fetch(providerUrl);
    } catch {
      console.error("Twelve Data request failed.");
      return jsonResponse({ error: "FX provider is temporarily unavailable." }, 502, origin);
    }

    if (!providerResponse.ok) {
      console.error("Twelve Data returned HTTP status", providerResponse.status);
      return jsonResponse({ error: "FX provider is temporarily unavailable." }, 502, origin);
    }

    let quote;
    try {
      quote = await providerResponse.json();
    } catch {
      console.error("Twelve Data returned invalid JSON.");
      return jsonResponse({ error: "FX provider returned an invalid response." }, 502, origin);
    }

    const price = Number(quote.price);
    if (!Number.isFinite(price) || price <= 0) {
      console.error("Twelve Data response did not contain a valid EUR/USD price.");
      return jsonResponse({ error: "FX provider returned an invalid EUR/USD price." }, 502, origin);
    }

    const timestamp = new Date().toISOString();
    const response = jsonResponse(
      { symbol: "EUR/USD", price, timestamp },
      200,
      null,
      `public, max-age=${CACHE_TTL_SECONDS}`,
    );

    await caches.default.put(CACHE_KEY, response.clone());
    return corsResponse(response, origin);
  },
};
