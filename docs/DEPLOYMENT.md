# Deploying to Oxygen

Oxygen is Shopify's hosting for Hydrogen storefronts. It is included with the Hydrogen sales channel. Every command below is a real Shopify CLI command available through the `@shopify/cli` dev dependency in this repo (run `npx shopify hydrogen <command> --help` for all options).

## Before the first deploy

1. Complete [SHOPIFY_SETUP.md](SHOPIFY_SETUP.md) steps 1 and 2 (Hydrogen channel, storefront, products).
2. Log in and link the project:

   ```bash
   npx shopify hydrogen login --shop your-store.myshopify.com
   npx shopify hydrogen link
   ```

3. Set the environment variables that Oxygen does **not** inject for you. In Shopify admin, open **Sales channels > Hydrogen > (your storefront) > Storefront settings > Environments and variables** and add:

   | Variable | Value | Mark as secret |
   | --- | --- | --- |
   | `SESSION_SECRET` | 32+ random characters (`openssl rand -base64 48`) | **Yes** |
   | `PUBLIC_SITE_URL` | `https://www.yourdomain.com` | No |
   | `MEDIUM_ROAST_HANDLE`, `DARK_ROAST_HANDLE` | only if your handles differ from `medium-roast` / `dark-roast` | No |
   | `DUO_PRODUCT_HANDLE` | only if you sell the Duo as a bundle product | No |
   | Analytics IDs | see [ANALYTICS.md](ANALYTICS.md) | No |

   Do **not** set `MR_DEV_FIXTURES` in any Oxygen environment. (It is ignored on non-localhost hosts anyway.)

   You can also manage variables from the CLI. `npx shopify hydrogen env list` shows the environments, `npx shopify hydrogen env pull` copies an environment's variables into `.env`, and `npx shopify hydrogen env push` uploads variables from `.env`. Never push a `.env` that contains `MR_DEV_FIXTURES="true"` or local-only values.

## Deploy

Run the checks, then deploy:

```bash
npm run typecheck && npm run lint && npm test
npx shopify hydrogen deploy
```

`hydrogen deploy` builds the project and uploads it. Useful flags:

| Flag | Purpose |
| --- | --- |
| `--preview` | Deploy to the Preview environment instead of Production |
| `--env <handle>` / `--env-branch <branch>` | Deploy to a specific environment |
| `--auth-bypass-token` | Prints a token for running end-to-end tests against a protected preview deployment |
| `--metadata-description "<text>"` | Label the deployment in admin |

A deployment refuses to run with uncommitted changes unless you pass `--force`. Commit first.

## Continuous deployment from GitHub (recommended)

In **Sales channels > Hydrogen > (your storefront) > Storefront settings > Oxygen deployments**, connect the GitHub repository. Shopify then:

- adds a GitHub Actions workflow to the repo that runs `shopify hydrogen deploy` on every push,
- stores the deployment token as the `SHOPIFY_HYDROGEN_DEPLOYMENT_TOKEN` repository secret,
- deploys the production branch (usually `main`) to Production and other branches to preview URLs.

Review the generated workflow before merging it. It is safe to add `npm run typecheck`, `npm run lint` and `npm test` steps before the deploy step.

## Domains

Add your domain in **Storefront settings > Domains** and point DNS as instructed there. Then set `PUBLIC_SITE_URL` to the canonical origin so canonical tags, Open Graph URLs and the sitemap use it. Set the checkout domain in Shopify (**Settings > Domains**); Oxygen injects it as `PUBLIC_CHECKOUT_DOMAIN`.

## After each production deploy

- Open the homepage and a product page; confirm real prices and images (no "Price from Shopify" or dev notice).
- Add both roasts, change a quantity, remove a line, and continue to checkout. Confirm Shopify checkout opens with the same items.
- Check `https://<domain>/robots.txt` and `https://<domain>/sitemap.xml`.
- If analytics are configured, accept consent and confirm events in each platform's debug view ([ANALYTICS.md](ANALYTICS.md)).

## Rollback

Every deployment stays available in **Storefront settings > Oxygen deployments** (or the storefront's **Deployments** list). Choose an earlier deployment and promote / roll back to it. Environment variable changes apply to new deployments, so redeploy after changing them.
