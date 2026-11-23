# Analytics and conversion tracking

## How it works

1. **Shopify analytics** is built in. Hydrogen's `<Analytics.Provider>` sends page, product, cart and checkout events to Shopify, which powers the Shopify admin reports. Nothing to configure.
2. **Third-party pixels** (GA4, Google Ads, Meta, TikTok) are loaded by `app/components/analytics/ThirdPartyPixels.tsx`, which listens to the same Hydrogen analytics bus. A pixel loads only when **both** its ID is configured **and** the visitor has given the matching consent.
3. **Purchases** are tracked by Shopify checkout, not by the storefront (see "Purchase events" below). This is how duplicate purchase events are avoided.

## Configuration

Set any of these as Oxygen environment variables (and in `.env` locally). Leave a variable empty to switch that platform off completely: no script, no CSP allowance, no request.

| Variable | Format (validated) | Example shape |
| --- | --- | --- |
| `PUBLIC_GA4_MEASUREMENT_ID` | `G-` followed by letters and digits | `G-XXXXXXXXXX` |
| `PUBLIC_GOOGLE_ADS_ID` | `AW-` followed by digits | `AW-123456789` |
| `PUBLIC_GOOGLE_ADS_ADD_TO_CART_LABEL` | conversion label from Google Ads | `AbCdEfGhIjK` |
| `PUBLIC_META_PIXEL_ID` | digits | `1234567890` |
| `PUBLIC_TIKTOK_PIXEL_ID` | capital letters and digits | `CXXXXXXXXXXXXXXXXXXX` |

Values that do not match the format are ignored. When an ID is set, its domains are added to the Content Security Policy automatically (`analyticsCspSources` in `app/lib/security.ts`).

## Consent

Consent comes from Shopify's Customer Privacy API (the privacy banner configured in **Settings > Customer privacy**).

| Platform | Needs |
| --- | --- |
| GA4 | analytics consent (`analyticsProcessingAllowed()`) |
| Google Ads | marketing consent (`marketingAllowed()`) |
| Meta Pixel | marketing consent |
| TikTok Pixel | marketing consent |

Before consent nothing is loaded. When the visitor accepts (`visitorConsentCollected`), the allowed pixels load immediately and record the current page. Declining loads nothing.

If you collect consent with another tool, set `PUBLIC_PRIVACY_BANNER="false"` **and** make sure that tool sets consent through Shopify's Customer Privacy API, otherwise no pixel will ever load.

## Event map

| Storefront moment | Hydrogen event | GA4 | Google Ads | Meta | TikTok |
| --- | --- | --- | --- | --- | --- |
| Any page view, including client-side navigation | `page_viewed` | `page_view` | | `PageView` | `page()` |
| Product page | `product_viewed` | `view_item` | | `ViewContent` | `ViewContent` |
| Item added (any add button, Duo, cross-sell) | `product_added_to_cart` | `add_to_cart` | `conversion` (if label set) | `AddToCart` | `AddToCart` |
| Cart page | `cart_viewed` | `view_cart` | | | |
| Roast selector choice or variant choice | `custom_select_item` | `select_item` | | | |
| "Checkout" pressed | `custom_begin_checkout` | `begin_checkout` | | `InitiateCheckout` | `InitiateCheckout` |
| Order placed | (Shopify checkout) | see below | see below | see below | see below |

Each platform records a page view at most once per URL, so a page is not counted twice when consent arrives after the page loaded.

**GA4 setting:** because page views are sent explicitly on every navigation, turn off **Admin > Data streams > (stream) > Enhanced measurement > Page views > "Page changes based on browser history events"**. Leaving it on double-counts client-side navigations.

## Purchase events (no duplicates)

The storefront never sends a purchase event. The order is completed on Shopify checkout, which is the only place that knows an order was actually paid. Track purchases there, once per platform:

- **Google & YouTube** app, **Facebook & Instagram** app and **TikTok** app from the Shopify App Store each send purchase (and checkout) events from Shopify checkout. Or
- A **custom pixel** in **Settings > Customer events**, subscribed to `checkout_completed`.

Pick one route per platform. If you install the Facebook & Instagram app, do not also add a custom pixel that sends `Purchase` to the same pixel ID.

If a platform app also offers to track storefront page views or add-to-cart, those events are not received from a Hydrogen storefront (apps only see Online Store themes and checkout), so there is no overlap with the storefront pixels above.

## Attribution

UTM parameters and `gclid` / `fbclid` / `ttclid` from the landing URL are kept for the browser session and attached to the cart as hidden cart attributes (prefixed with `_`, so customers never see them) whenever an item is added. They then appear on the order in Shopify admin. Values are length-limited and sanitised server-side.

## Verify after deploy

1. Open the site in a private window and accept the privacy banner.
2. GA4: **Admin > DebugView** (or the Tag Assistant extension). Navigate between pages and add an item; expect one `page_view` per page and one `add_to_cart`.
3. Meta: **Events Manager > Test events**.
4. TikTok: **Events Manager > Test events**.
5. Place a test order and confirm exactly one purchase per platform.
