/**
 * Request and response hardening applied in server.ts to every response.
 */

/**
 * CSRF defence for state-changing requests (cart mutations are the only ones).
 * Browsers always send Origin on cross-site POSTs; we require it to match the
 * request's own origin. Sec-Fetch-Site is checked too when present.
 * Session and cart cookies are additionally SameSite=Lax.
 */
export function isSameOriginMutation(request: Request): boolean {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') {
    return false;
  }

  const origin = request.headers.get('origin');
  if (!origin) {
    // Non-browser clients (no Origin) must at least present a same-origin Referer.
    const referer = request.headers.get('referer');
    if (!referer) return false;
    try {
      return new URL(referer).origin === new URL(request.url).origin;
    } catch {
      return false;
    }
  }
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

/** Headers added to every response. CSP is set per document in entry.server. */
export function applySecurityHeaders(original: Response, request: Request) {
  // Re-wrap so headers are mutable (Response.redirect() headers are immutable).
  const response = new Response(original.body, original);
  const headers = response.headers;
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  );
  if (new URL(request.url).protocol === 'https:') {
    headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  }
  headers.delete('powered-by');
  return response;
}

/** Third-party origins allowed by CSP only when their ID is configured. */
export function analyticsCspSources(env: Env) {
  const script: string[] = [];
  const connect: string[] = [];
  const img: string[] = [];
  const frame: string[] = [];
  if (env.PUBLIC_GA4_MEASUREMENT_ID || env.PUBLIC_GOOGLE_ADS_ID) {
    script.push('https://www.googletagmanager.com');
    connect.push(
      'https://www.google-analytics.com',
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://www.googletagmanager.com',
    );
    img.push('https://www.google-analytics.com', 'https://www.googletagmanager.com');
  }
  if (env.PUBLIC_GOOGLE_ADS_ID) {
    script.push('https://www.googleadservices.com', 'https://googleads.g.doubleclick.net');
    connect.push('https://www.google.com', 'https://googleads.g.doubleclick.net');
    img.push('https://www.google.com', 'https://googleads.g.doubleclick.net');
    frame.push('https://td.doubleclick.net');
  }
  if (env.PUBLIC_META_PIXEL_ID) {
    script.push('https://connect.facebook.net');
    connect.push('https://www.facebook.com', 'https://connect.facebook.net');
    img.push('https://www.facebook.com');
  }
  if (env.PUBLIC_TIKTOK_PIXEL_ID) {
    script.push('https://analytics.tiktok.com');
    connect.push('https://analytics.tiktok.com');
    img.push('https://analytics.tiktok.com');
  }
  return {script, connect, img, frame};
}
