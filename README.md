# Morning Rebel storefront

Headless Shopify storefront for **MORNING REBEL**, a premium mushroom coffee brand with two roasts (Medium and Dark) and **The Rebel Duo**. Built with Shopify Hydrogen and React Router, server-rendered on Shopify Oxygen, with checkout handled entirely by Shopify.

- Hydrogen 2026.4 · React Router 7.18 · React 18 · TypeScript (strict) · Tailwind CSS v4 · Vite 8
- Storefront API cart (`CartForm` + optimistic UI), Shopify-hosted checkout
- Consent-aware analytics (GA4, Google Ads, Meta, TikTok) through Hydrogen's analytics bus
- Unit tests (Vitest) and end-to-end tests (Playwright, desktop and mobile)

## Quick start

Requirements: Node.js 22 or 24 (the `engines` field in `package.json`).

```bash
npm install
cp .env.example .env
```

Then choose one:

**A. Run against your Shopify store (recommended)**

```bash
npx shopify hydrogen link      # pick the Hydrogen storefront for this project
npx shopify hydrogen env pull  # writes the store's variables into .env
npm run dev                    # http://localhost:3000
```

Add `SESSION_SECRET` (32+ random characters) to `.env` if `env pull` did not provide one.

**B. Run without a store (development fixtures)**

Set these two values in `.env`:

```bash
SESSION_SECRET="<at least 32 random characters>"
MR_DEV_FIXTURES="true"
```

`npm run dev` now serves two placeholder roasts and a session-backed cart so the whole flow (add, update, remove, cross-sell, Duo, checkout hand-off) can be exercised. Fixture mode:

- shows a "Development fixtures" notice on every page,
- prints **"Price from Shopify"** instead of any price and **"Awaiting verified supplier data"** instead of any product fact,
- marks every page `noindex` and disables the privacy banner and analytics,
- only works on `localhost` / `127.0.0.1`. It is ignored on any other host, so it cannot switch on in production.

Nothing in the fixtures is real product data. Prices, facts and images all come from Shopify once a store is connected.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server in the Oxygen worker runtime, with GraphQL codegen |
| `npm run build` | Production build (with codegen) into `dist/` |
| `npm run preview` | Builds, then serves the production bundle locally |
| `npm run typecheck` | React Router typegen + `tsc --noEmit` (strict) |
| `npm run lint` | ESLint (includes `jsx-a11y`) |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright). Starts the dev server on port 3000 if nothing is running there. Needs `MR_DEV_FIXTURES="true"` in `.env`. |
| `npm run audit:deps` | `npm audit` of production dependencies |
| `npm run codegen` | Regenerate Storefront API types |

First Playwright run on a new machine: `npx playwright install chromium`.

## Environment variables

All variables are documented in [`.env.example`](.env.example). In short:

| Variable | Where | Required |
| --- | --- | --- |
| `SESSION_SECRET` | server | yes (32+ chars) |
| `PUBLIC_STORE_DOMAIN`, `PUBLIC_STOREFRONT_API_TOKEN`, `PRIVATE_STOREFRONT_API_TOKEN`, `PUBLIC_STOREFRONT_ID`, `PUBLIC_CHECKOUT_DOMAIN` | injected by Oxygen when linked | yes |
| `MEDIUM_ROAST_HANDLE`, `DARK_ROAST_HANDLE` | server | no (default `medium-roast`, `dark-roast`) |
| `DUO_PRODUCT_HANDLE` | server | no |
| `PUBLIC_SITE_URL` | public | recommended (canonical URLs, sitemap) |
| `PUBLIC_PRIVACY_BANNER` | public | no (default on) |
| `PUBLIC_GA4_MEASUREMENT_ID`, `PUBLIC_GOOGLE_ADS_ID`, `PUBLIC_GOOGLE_ADS_ADD_TO_CART_LABEL`, `PUBLIC_META_PIXEL_ID`, `PUBLIC_TIKTOK_PIXEL_ID` | public | no |
| `MR_DEV_FIXTURES` | local only | no |

Never commit `.env`. It is git-ignored.

## Documentation

| Guide | Covers |
| --- | --- |
| [docs/SHOPIFY_SETUP.md](docs/SHOPIFY_SETUP.md) | Products, handles, metafields, FAQ metaobjects, reviews, policies, the Duo, Dripshipper |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploying to Oxygen, environments, domains, rollback |
| [docs/ANALYTICS.md](docs/ANALYTICS.md) | Pixels, consent, event map, purchase tracking without duplicates |
| [docs/SECURITY.md](docs/SECURITY.md) | Security review and controls |
| [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) | WCAG 2.2 AA review |
| [docs/PERFORMANCE.md](docs/PERFORMANCE.md) | Performance budget, measurements, how to run Lighthouse |
| [docs/DESIGN.md](docs/DESIGN.md) | Art direction, design system, motion, critique log |

## Project structure

```
app/
  routes/                 Pages: home, products/:handle, cart, policies, pages, sitemap, robots
  components/
    home/                 Homepage sections (Hero → Final purchase)
    product/              Roast panel, gallery, variant picker, facts
    cart/                 Cart drawer, line items, add-to-cart, cart UI context
    layout/               Header, mobile navigation, footer, dev banner
    analytics/            Consent-gated third-party pixels
  lib/
    catalog/              Storefront API queries, normalisation, fixtures
    cart/                 Server-side validation, cart fragment, cross-sell, fixture cart
    context.ts            Per-request Hydrogen context
    security.ts           CSRF check, security headers, CSP sources
    seo.ts                Meta tags and JSON-LD
  styles/tailwind.css     Design tokens and components
server.ts                 Oxygen worker entry
tests/unit, tests/e2e     Vitest and Playwright suites
```

## Content rules

The storefront never invents prices, reviews, ratings, product facts, health claims, certifications or shipping times. Every one of these comes from Shopify (product data, metafields, metaobjects, policies or a reviews app). When a value is missing in production, the element is hidden rather than filled with placeholder copy.
