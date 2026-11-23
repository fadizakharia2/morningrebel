# Shopify configuration

Everything the storefront shows about the products (prices, variants, availability, images, facts, ratings, FAQ answers, policies) comes from Shopify. This guide lists what to set up in Shopify admin so every section has real data to show.

If something below is not configured, the storefront hides the affected element instead of inventing content.

## 1. Hydrogen sales channel and storefront

1. Install the **Hydrogen** sales channel from the Shopify App Store (free).
2. In **Sales channels > Hydrogen**, create a storefront (for example "Morning Rebel").
3. Link this project to it from the project folder:

   ```bash
   npx shopify hydrogen link
   npx shopify hydrogen env pull
   ```

   `env pull` writes `PUBLIC_STORE_DOMAIN`, `PUBLIC_STOREFRONT_API_TOKEN`, `PRIVATE_STOREFRONT_API_TOKEN`, `PUBLIC_STOREFRONT_ID` and `PUBLIC_CHECKOUT_DOMAIN` into `.env`. On Oxygen these are injected automatically.

## 2. Products

Create (or confirm) two products and **publish both to the Hydrogen sales channel**:

| Product | Default handle | Env override |
| --- | --- | --- |
| Medium Roast | `medium-roast` | `MEDIUM_ROAST_HANDLE` |
| Dark Roast | `dark-roast` | `DARK_ROAST_HANDLE` |

- **Price and compare-at price** are read per variant. A compare-at price higher than the price shows as a struck-through original price. No discount is ever calculated by the storefront.
- **Variants and options** (size, grind, etc.) appear as choice chips when an option has more than one value. Unavailable variants stay visible, are marked sold out and cannot be added.
- **Images**: the first image is the hero image. Variant images replace it when a variant is selected. Upload transparent or dark-background pouch shots for the best result. Alt text comes from the image alt text in Shopify.
- **Description**: the plain-text description is used under the product name. Keep it to one or two sentences.
- **SEO title and description** (product > Search engine listing) feed the product page meta tags.
- **Inventory**: availability comes from `availableForSale`, so whatever manages inventory in Shopify (including a fulfilment app) controls the "In stock" / "Sold out" state.

Other products in the store are not shown. Only the two roast handles (and the optional Duo) are loaded.

## 3. The Rebel Duo

Two supported setups:

**A. No bundle product (default).** Leave `DUO_PRODUCT_HANDLE` empty. "Add both to cart" adds one Medium and one Dark (default variants) as two normal cart lines. The total shown is the sum of the two Shopify prices. No saving is shown, because none exists.

**B. A bundle product.** Create a bundle in Shopify (for example with the Shopify Bundles app), publish it to the Hydrogen channel, and set `DUO_PRODUCT_HANDLE` to its handle. The Duo section then sells that product at its own Shopify price. If you set a compare-at price on the bundle, the saving is shown against it.

## 4. Metafields (product facts)

Create these product metafield definitions in **Settings > Custom data > Products > Add definition**. For every definition, turn on **Storefronts** access, or the Storefront API cannot read it.

Namespace for all of them: `morning_rebel`.

| Key | Type | Used for |
| --- | --- | --- |
| `tasting_notes` | List of single line text | Tasting note chips |
| `roast_summary` | Multi-line text | Roast summary under the description on the product page |
| `ingredients` | Multi-line text | Ingredients section |
| `mushroom_blend` | JSON | Mushroom list with amounts, format below |
| `caffeine` | Single line text | Caffeine row (e.g. the value from your supplier spec sheet) |
| `coffee_origin` | Single line text | Coffee origin row |
| `sourcing` | Multi-line text | Sourcing section |
| `lab_report_url` | URL (https only) | "View lab documentation" link |
| `brewing_steps` | List of single line text | Ritual section, product page and FAQ |
| `net_weight` | Single line text | Net weight row (e.g. "250 g") |

`mushroom_blend` format:

```json
[
  {"name": "Lion's Mane", "amount": "500 mg"},
  {"name": "Chaga", "amount": "250 mg"}
]
```

(The example values are format illustrations only. Enter the amounts from your supplier's specification.)

Only enter facts you can substantiate from your supplier's documentation. The storefront shows them exactly as entered and adds no claims of its own. Leave a field empty rather than estimating. Empty fields are hidden in production.

## 5. Ratings (reviews app)

The reviews section shows only the aggregate rating that a Shopify reviews app writes to the standard metafields:

- `reviews.rating` (type: Rating)
- `reviews.rating_count` (type: Integer)

Apps such as Shopify Product Reviews, Judge.me and others write these when "sync to metafields" is enabled. Turn on **Storefronts** access for both definitions in Settings > Custom data > Products.

Until at least one product has a rating, the section shows a launch state ("No reviews yet.") with no stars, quotes or counts. The storefront never shows sample or invented reviews.

## 6. FAQ (optional metaobjects)

By default the FAQ is built only from data you already have (product facts, policies). To write your own questions and answers:

1. **Settings > Custom data > Metaobjects > Add definition**
2. Type: `morning_rebel_faq`
3. Fields:
   - `question`: Single line text
   - `answer`: Multi-line text
4. Turn on **Storefronts** access.
5. Add entries under **Content > Metaobjects**.

When at least one entry exists, the FAQ shows those entries (up to 20) instead of the built-in list.

## 7. Policies

Add the policies in **Settings > Policies** (refund, shipping, privacy, terms of service, and contact information). They appear in the footer, at `/policies/<handle>`, and the shipping and refund policies are linked from the product page and FAQ. Policy text is sanitised before rendering.

## 8. Checkout, payments and fulfilment

- Checkout is Shopify's hosted checkout. The storefront only sends the shopper to the cart's `checkoutUrl`. Payments, taxes, shipping rates and discount codes are all configured in Shopify admin.
- Fulfilment apps (for example Dripshipper) work inside Shopify: they receive orders from Shopify after checkout. The storefront does not integrate with them directly. Make sure the products the app fulfils are the same products published to the Hydrogen channel.
- Shipping times are never stated on the storefront. Shipping rates and delivery estimates come from Shopify at checkout.

## 9. Privacy banner and consent

`withPrivacyBanner` is on by default (`PUBLIC_PRIVACY_BANNER`). Configure the banner in **Settings > Customer privacy**. Third-party pixels only load after the visitor consents. See [ANALYTICS.md](ANALYTICS.md).

## 10. Domain and URL redirects

- Connect your domain to the Hydrogen storefront in **Sales channels > Hydrogen > Storefront settings > Domains**, then set `PUBLIC_SITE_URL` to the canonical origin (for example `https://www.morningrebel.com`).
- URL redirects created in **Online Store > Navigation > URL redirects** (or the redirects admin) are honoured for any path that would otherwise 404.
- Shopify's standard `/collections`, `/collections/:handle` and `/search` URLs redirect to the roasts. `/account/...` URLs continue to the store's Shopify-hosted customer account pages.

## Checklist

- [ ] Hydrogen channel installed, storefront created, project linked
- [ ] Medium Roast and Dark Roast published to the Hydrogen channel with prices and images
- [ ] Handles match `MEDIUM_ROAST_HANDLE` / `DARK_ROAST_HANDLE`
- [ ] (Optional) Duo bundle published and `DUO_PRODUCT_HANDLE` set
- [ ] `morning_rebel` metafield definitions created with Storefronts access, values entered from supplier documentation
- [ ] Reviews app syncing `reviews.rating` / `reviews.rating_count` with Storefronts access
- [ ] Policies written
- [ ] Customer privacy banner configured
- [ ] `PUBLIC_SITE_URL` and `SESSION_SECRET` set in Oxygen
