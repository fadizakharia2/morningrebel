import type {Storefront} from '@shopify/hydrogen';
import {FIXTURE_DARK, FIXTURE_MEDIUM} from './fixtures';
import {normalizeFaqs, normalizeProduct, type RawProduct} from './normalize';
import {STOREFRONT_QUERY} from './queries';
import type {PolicyLink, StorefrontData} from './types';

export const DEFAULT_MEDIUM_HANDLE = 'medium-roast';
export const DEFAULT_DARK_HANDLE = 'dark-roast';

const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]{0,254}$/;

export function sanitizeHandle(value: string | undefined, fallback: string) {
  const handle = (value ?? '').trim().toLowerCase();
  return HANDLE_PATTERN.test(handle) ? handle : fallback;
}

export interface CatalogConfig {
  mediumHandle: string;
  darkHandle: string;
  duoHandle: string | null;
}

export function getCatalogConfig(env: Env): CatalogConfig {
  const duo = env.DUO_PRODUCT_HANDLE?.trim();
  return {
    mediumHandle: sanitizeHandle(env.MEDIUM_ROAST_HANDLE, DEFAULT_MEDIUM_HANDLE),
    darkHandle: sanitizeHandle(env.DARK_ROAST_HANDLE, DEFAULT_DARK_HANDLE),
    duoHandle: duo ? sanitizeHandle(duo, '') || null : null,
  };
}

/**
 * Fixtures may only ever run on a local host. Even if MR_DEV_FIXTURES were set
 * on Oxygen by mistake, a public hostname keeps real Shopify data.
 */
export function fixturesEnabled(env: Env, request: Request): boolean {
  if (env.MR_DEV_FIXTURES !== 'true') return false;
  const {hostname} = new URL(request.url);
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function getFixtureStorefront(): StorefrontData {
  return {
    shopName: 'Morning Rebel',
    medium: normalizeProduct(FIXTURE_MEDIUM, 'medium', true),
    dark: normalizeProduct(FIXTURE_DARK, 'dark', true),
    duo: null,
    faqs: [],
    policies: [],
    isFixture: true,
  };
}

interface RawStorefrontResult {
  shop: {
    name: string;
    privacyPolicy?: PolicyLink | null;
    refundPolicy?: PolicyLink | null;
    shippingPolicy?: PolicyLink | null;
    termsOfService?: PolicyLink | null;
  };
  medium?: RawProduct | null;
  dark?: RawProduct | null;
  duo?: RawProduct | null;
  faqs?: {
    nodes: Array<{
      id: string;
      fields: Array<{key: string; value?: string | null}>;
    }>;
  } | null;
}

export async function getStorefrontData({
  storefront,
  env,
  request,
}: {
  storefront: Storefront;
  env: Env;
  request: Request;
}): Promise<StorefrontData> {
  if (fixturesEnabled(env, request)) return getFixtureStorefront();

  const config = getCatalogConfig(env);
  const result = (await storefront.query(STOREFRONT_QUERY, {
    cache: storefront.CacheShort(),
    variables: {
      mediumHandle: config.mediumHandle,
      darkHandle: config.darkHandle,
      duoHandle: config.duoHandle ?? '',
      includeDuo: Boolean(config.duoHandle),
    },
  })) as unknown as RawStorefrontResult;

  const {shop} = result;
  const policies = [
    shop.shippingPolicy,
    shop.refundPolicy,
    shop.privacyPolicy,
    shop.termsOfService,
  ].filter((policy): policy is PolicyLink => Boolean(policy?.handle));

  return {
    shopName: shop.name,
    medium: normalizeProduct(result.medium, 'medium'),
    dark: normalizeProduct(result.dark, 'dark'),
    duo: normalizeProduct(result.duo, 'duo'),
    faqs: normalizeFaqs(result.faqs?.nodes ?? []),
    policies,
    isFixture: false,
  };
}
