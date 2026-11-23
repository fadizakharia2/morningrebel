import {redirect} from 'react-router';

/**
 * This store sells two roasts from one page, so Shopify's standard
 * collection and search URLs (used by Shopify emails, apps and old links)
 * send visitors to the roasts instead of a 404.
 */
export function redirectToRoasts() {
  return redirect('/#roasts', {status: 302});
}

/**
 * Customer accounts are hosted by Shopify. Order-status and account links
 * land here and continue to the store's own Shopify domain, which hands
 * off to Shopify customer accounts. The target comes from server config,
 * never from the request, so this cannot become an open redirect.
 */
export function redirectToShopifyAccount(env: Env, request: Request) {
  const domain = env.PUBLIC_STORE_DOMAIN?.trim();
  if (!domain || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(domain)) {
    throw new Response('Not found', {status: 404});
  }
  const path = new URL(request.url).pathname;
  const safePath = /^\/account(\/[A-Za-z0-9/_-]*)?$/.test(path) ? path : '/account';
  return redirect(`https://${domain}${safePath}`, {status: 302});
}
