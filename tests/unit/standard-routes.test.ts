import {describe, expect, it} from 'vitest';
import {redirectToShopifyAccount, redirectToRoasts} from '~/lib/standard-routes.server';

const env = (domain?: string) => ({PUBLIC_STORE_DOMAIN: domain}) as unknown as Env;
const req = (path: string) => new Request(`https://example.com${path}`);

function statusOf(fn: () => Response) {
  try {
    return fn();
  } catch (e) {
    return e as Response;
  }
}

describe('standard Shopify routes', () => {
  it('sends collection and search URLs to the roasts', () => {
    const res = redirectToRoasts();
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/#roasts');
  });

  it('hands account paths to the configured Shopify domain', () => {
    const res = redirectToShopifyAccount(env('rebel.myshopify.com'), req('/account/orders/123'));
    expect(res.headers.get('Location')).toBe('https://rebel.myshopify.com/account/orders/123');
  });

  it('never lets the request choose the redirect host', () => {
    const res = redirectToShopifyAccount(env('rebel.myshopify.com'), req('/account/..%2f%2fevil.com'));
    expect(res.headers.get('Location')).toBe('https://rebel.myshopify.com/account');
  });

  it('404s when no store domain is configured or it is malformed', () => {
    expect(statusOf(() => redirectToShopifyAccount(env(undefined), req('/account'))).status).toBe(404);
    expect(statusOf(() => redirectToShopifyAccount(env('evil.com/@x'), req('/account'))).status).toBe(404);
  });
});
