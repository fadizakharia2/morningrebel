# Security review

Scope: this repository (Hydrogen storefront running on Oxygen). Shopify checkout, payments, customer accounts and the Shopify admin are operated by Shopify and are out of scope.

Status: no known open issues. `npm audit --omit=dev` reports 0 vulnerabilities (see "Dependencies").

## Secrets and configuration

| Control | Where |
| --- | --- |
| No credentials in the repository. `.env` and `.env.*` are git-ignored; only `.env.example` (placeholders) is committed. | `.gitignore`, `.env.example` |
| `PRIVATE_STOREFRONT_API_TOKEN` and `SESSION_SECRET` are read only in server code (`app/lib/context.ts`, `server.ts`) and never serialised into loader data. | `app/root.tsx` returns only public values |
| `SESSION_SECRET` shorter than 32 characters stops the app at startup. | `app/lib/context.ts` |
| Production secrets live in Oxygen environment variables (mark `SESSION_SECRET` as secret). | [DEPLOYMENT.md](DEPLOYMENT.md) |
| Fixture mode needs both `MR_DEV_FIXTURES="true"` and a `localhost` / `127.0.0.1` host, so a stray variable cannot switch it on in production. | `app/lib/catalog/catalog.server.ts` |
| No Admin API access exists in the app at all. | |

## Cookies and sessions

- Session cookie: `HttpOnly`, `Secure` on https, `SameSite=Lax`, 30-day max age, signed with `SESSION_SECRET`. On https it uses the `__Host-` prefix, which forbids a `Domain` attribute and requires `Path=/` and `Secure`.
- Cart cookie (Hydrogen `cart`): `HttpOnly`, `Secure` on https, `SameSite=Lax`, 14 days.
- No custom login or password handling. Customer accounts stay on Shopify.
- Nothing sensitive is kept in browser storage. `sessionStorage` holds only UTM / click-id parameters from the landing URL.

## Cart and input validation (server-side)

All cart mutations go through `app/routes/cart.tsx`, which validates every input before calling Shopify (`app/lib/cart/validation.ts`):

- Variant IDs must match `gid://shopify/ProductVariant/<digits>`; line IDs must match the cart line GID format.
- Quantities must be integers from 1 to 10 for adds (0 to 10 for updates, where 0 removes). At most 4 lines per request.
- Only `LinesAdd`, `LinesUpdate` and `LinesRemove` are accepted. Anything else returns 400.
- Prices are never sent from the browser. The cart only sends variant IDs and quantities, and Shopify computes every price, tax and total.
- Sold-out or invalid variants are rejected by Shopify and the error is shown to the shopper.
- Attribution attributes are restricted to an allowlist of keys and a strict character set and length.
- Unexpected errors return a generic 502 message. Stack traces and Shopify responses are never sent to the browser.

## CSRF

- Every non-GET request must be same-origin: `Sec-Fetch-Site` must be `same-origin` (when sent) and `Origin` (or `Referer` when `Origin` is missing) must match the request origin. Anything else gets 403 before any route code runs (`isSameOriginMutation` in `app/lib/security.ts`, called first in `server.ts`).
- `SameSite=Lax` cookies add a second layer.
- Covered by unit tests and an end-to-end test that posts cross-site.

## XSS and content

- React escapes all text output.
- Product descriptions use Shopify's plain-text `description`, never `descriptionHtml`.
- The only rich HTML rendered is Shopify policy and page bodies, sanitised with an allowlist (`xss` / `FilterXSS`, `app/lib/sanitize.server.ts`): no scripts, event handlers, `style`, iframes or `javascript:` URLs.
- The one inline script (adds a `js` class for progressive enhancement) is static and carries the CSP nonce.
- Merchant URLs (lab report links) are accepted only as `https:` URLs.
- JSON-LD is serialised by React Router's `meta` export, which escapes it.

## Content Security Policy and headers

Set per document in `app/entry.server.tsx` via Hydrogen's `createContentSecurityPolicy` (nonce-based):

- `default-src 'self'` plus Shopify CDN; `script-src 'self'` + Shopify CDN + per-request nonce; `img-src 'self' data:` + Shopify CDN; `font-src 'self'`; `object-src 'none'`; `base-uri 'self'`; `frame-ancestors 'none'`; `form-action 'self'` + checkout domain; `upgrade-insecure-requests` on https.
- Analytics hosts are added only for platforms whose ID is configured (`analyticsCspSources`).
- `style-src` includes `'unsafe-inline'` (Hydrogen's default, needed for React `style` attributes). Accepted: inline styles cannot execute script.

Added to every response in `server.ts` (`applySecurityHeaders`):

`X-Content-Type-Options: nosniff` · `X-Frame-Options: DENY` · `Referrer-Policy: strict-origin-when-cross-origin` · `Cross-Origin-Opener-Policy: same-origin` · `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()` · `Strict-Transport-Security: max-age=63072000; includeSubDomains` (https only). The `powered-by` header is removed.

## Redirects

- The checkout button links only to the `checkoutUrl` that Shopify returns for the cart, and only when it parses as an `https:` URL (`isSafeCheckoutUrl`). The URL never comes from the browser.
- `safeRedirectPath` rejects absolute URLs, protocol-relative `//host`, backslashes and control characters.
- `/account/...` redirects go only to the configured `PUBLIC_STORE_DOMAIN`, never to a host taken from the request (unit-tested).

## Third-party scripts

Only Shopify's own scripts load by default. GA4, Google Ads, Meta and TikTok load only when their ID is configured, the ID matches its expected format, and the visitor consented ([ANALYTICS.md](ANALYTICS.md)).

## Logging

Server logs record only an error's name and message, never request bodies, cookies, cart contents or customer data.

## Checkout and payments

The storefront never sees card data. Checkout, payment and order processing happen on Shopify's hosted checkout.

## Dependencies

- `npm audit --omit=dev`: **0 vulnerabilities** at the time of this review.
- Hydrogen 2026.4.x pins React Router 7.16, which has published advisories (open redirect via backslash in `<Link>`, SSR error deserialisation, route-matching DoS). `package.json` overrides React Router to the patched 7.18.6 (and lodash / esbuild to patched versions). Remove these overrides once you upgrade to a Hydrogen release that ships a patched React Router.
- The full `npm audit` (including dev tooling) still lists advisories in Shopify's build tooling (GraphQL codegen, mini-oxygen / miniflare). These run only on developer machines and in CI, are not part of the deployed worker, and have no non-breaking fix yet. Re-check with `npm audit` when upgrading `@shopify/cli` and `@shopify/hydrogen-codegen`.

Run `npm run audit:deps` before each release.

## Residual risks and recommendations

- Turn on two-factor authentication for every Shopify staff account and the GitHub organisation.
- Keep `PUBLIC_*` variables free of anything secret: they are visible in the browser by design.
- If you add customer accounts later, use Hydrogen's Customer Account API integration rather than custom auth.
- Review new analytics or app scripts against the CSP before adding them.
