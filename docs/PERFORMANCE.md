# Performance review

Targets from the brief: Lighthouse Performance 90+ on mobile, 95+ on desktop; LCP < 2.5 s, CLS < 0.1, INP < 200 ms.

## Measured

Production build served locally by `npm run preview` (Oxygen worker runtime), in fixture mode, measured with Playwright in Chromium using the browser's own `largest-contentful-paint` and `layout-shift` entries.

| Page | Profile | LCP | CLS | Requests | Transfer |
| --- | --- | --- | --- | --- | --- |
| Home | Pixel 7, 4× CPU slowdown, 150 ms latency, ~1.6 Mbps | 784 ms | 0.000 | 19 | 268 KB |
| Product | same | 508 ms | 0.000 | 18 | 209 KB |
| Home | Desktop 1440 × 900, unthrottled | 308 ms | 0.000 | 19 | 267 KB |
| Product | same | 192 ms | 0.000 | 18 | 209 KB |

These are lab numbers on a local server with small SVG fixture images. Real product photography and real network distance will raise LCP, so re-measure on the deployed preview URL with real products before launch.

**Lighthouse was not run in this review:** the sandbox it was built in blocked downloading and running the Lighthouse CLI. To run it yourself:

```bash
npm run preview                               # http://localhost:3000
npx lighthouse http://localhost:3000 --view   # mobile
npx lighthouse http://localhost:3000 --preset=desktop --view
```

Or use PageSpeed Insights against the Oxygen preview URL.

## JavaScript and CSS budget

| Asset | Raw | Gzip |
| --- | --- | --- |
| `entry.client` (React, React DOM, React Router) | 137 KB | 44 KB |
| Shared router/Hydrogen chunk | 131 KB | 42 KB |
| Hydrogen production chunk | 29 KB | 10 KB |
| Home route | 19 KB | 6 KB |
| Root route | 12 KB | 5 KB |
| CSS (all of Tailwind output) | 45 KB | 10 KB |

No animation library, carousel, icon font or UI framework is shipped. All motion is CSS (transitions, keyframes, `@starting-style`) plus one small `IntersectionObserver` hook.

## What keeps it fast

- **Server-rendered** on Oxygen with streaming; the Storefront API query for both roasts, the optional Duo, FAQ and policies is one request cached with `CacheShort()`.
- **Hero image** is the LCP element: loaded `eager` with `fetchpriority="high"`, explicit `sizes`, and Shopify CDN responsive `srcset` through Hydrogen's `<Image>`. Below-the-fold images are `loading="lazy"`.
- **No layout shift:** every image has an aspect ratio; fonts are self-hosted WOFF2 with `font-display: swap`, and the two fonts above the fold (Bodoni Moda regular, Manrope variable) are preloaded. The italic face loads only where used.
- **Animations are composite-only** (`transform`, `opacity`, `clip-path`, `filter: blur` on small elements). No layout properties are animated. Scroll effects use `IntersectionObserver`, not scroll listeners.
- **INP:** buttons respond on press (CSS `:active` scale), cart updates are optimistic, and no long tasks run on interaction. The cart drawer is a native `<dialog>`.
- **Third-party scripts** load only after consent and only for configured platforms, asynchronously, after hydration.
- **Cart** is deferred in the root loader so the page streams before the cart resolves.

## Recommendations before launch

1. Upload product images at least 1600 px tall, WebP or PNG with transparency; Shopify's CDN serves resized WebP/AVIF automatically.
2. Run Lighthouse and PageSpeed Insights on the Oxygen preview with real data.
3. Watch real-user Core Web Vitals after launch in Google Search Console (Core Web Vitals report).
4. Re-check the budget above when adding apps or pixels.
