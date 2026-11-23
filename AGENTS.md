# Shopify Hydrogen development

This storefront is scaffolded from Shopify's Hydrogen skeleton template. See the README for framework-specific details.

Use the [Shopify AI Toolkit](https://shopify.dev/docs/apps/build/ai-toolkit) for all Shopify API and platform work. If missing, install it in the agent host per that page (or `npx skills add Shopify/shopify-ai-toolkit --list` for skill-compatible hosts).

# Morning Rebel conventions

- Two products only (Medium Roast, Dark Roast) plus the optional Duo bundle. Handles come from `MEDIUM_ROAST_HANDLE` / `DARK_ROAST_HANDLE` / `DUO_PRODUCT_HANDLE`.
- Never hardcode or invent prices, reviews, ratings, product facts, health claims, certifications or shipping times. Facts come from `morning_rebel.*` metafields (see docs/SHOPIFY_SETUP.md). Missing data is hidden in production and shown as "Awaiting verified supplier data" only in fixture mode.
- Local development without a store: `MR_DEV_FIXTURES="true"` in `.env` (localhost only).
- All cart mutations go through `app/routes/cart.tsx` and the validators in `app/lib/cart/validation.ts`. Keep CSRF, CSP and header logic in `app/lib/security.ts` / `app/entry.server.tsx`.
- New third-party scripts need a consent gate (`ThirdPartyPixels.tsx`) and a CSP entry (`analyticsCspSources`).
- Before pushing: `npm run typecheck && npm run lint && npm test && npm run test:e2e` (e2e includes axe WCAG 2.2 AA checks).
- `package.json` overrides React Router to a patched version because Hydrogen 2026.4 pins a vulnerable one. Drop the overrides when upgrading Hydrogen.
