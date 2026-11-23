import {useAnalytics, useNonce} from '@shopify/hydrogen';
import {useEffect, useRef} from 'react';

/**
 * Consent-aware bridge from Hydrogen's analytics bus to GA4, Google Ads,
 * Meta Pixel and TikTok Pixel.
 *
 * - IDs come from PUBLIC_* env vars; nothing loads when an ID is absent.
 * - GA4 loads only after analytics consent; Ads/Meta/TikTok only after
 *   marketing consent (Shopify Customer Privacy API).
 * - Storefront events: view_item, select_item, add_to_cart, view_cart,
 *   begin_checkout. `purchase` is deliberately NOT sent from here: it
 *   belongs to Shopify checkout (Customer Events / the platforms' Shopify
 *   apps), which prevents duplicate purchase tracking.
 */
export interface PixelConfig {
  ga4?: string;
  googleAds?: string;
  googleAdsAddToCartLabel?: string;
  meta?: string;
  tiktok?: string;
}

const ID_PATTERNS: Record<keyof PixelConfig, RegExp> = {
  ga4: /^G-[A-Z0-9]{4,20}$/,
  googleAds: /^AW-\d{5,20}$/,
  googleAdsAddToCartLabel: /^[A-Za-z0-9_-]{4,64}$/,
  meta: /^\d{5,20}$/,
  tiktok: /^[A-Z0-9]{10,30}$/,
};

export function sanitizePixelConfig(raw: PixelConfig): PixelConfig {
  const out: PixelConfig = {};
  for (const key of Object.keys(ID_PATTERNS) as Array<keyof PixelConfig>) {
    const value = raw[key]?.trim();
    if (value && ID_PATTERNS[key].test(value)) out[key] = value;
  }
  return out;
}

type W = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: ((...args: unknown[]) => void) & {queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...a: unknown[]) => void; push?: unknown};
  _fbq?: unknown;
  ttq?: {track: (...a: unknown[]) => void; page: () => void; load: (id: string) => void} & Record<string, unknown>;
  Shopify?: {customerPrivacy?: {analyticsProcessingAllowed?: () => boolean; marketingAllowed?: () => boolean}};
};

function inject(src: string, nonce?: string) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  if (nonce) s.nonce = nonce;
  document.head.appendChild(s);
}

interface ItemPayload {
  id: string;
  title: string;
  price: string;
  variantId: string;
  quantity: number;
}

function toItems(products: unknown): ItemPayload[] {
  if (!Array.isArray(products)) return [];
  return products
    .filter((p): p is ItemPayload => Boolean(p && typeof p === 'object' && 'id' in p))
    .map((p) => ({id: p.id, title: p.title, price: p.price, variantId: p.variantId, quantity: p.quantity ?? 1}));
}

export function ThirdPartyPixels({config, currency = 'USD'}: {config: PixelConfig; currency?: string}) {
  const {subscribe, register, customerPrivacy} = useAnalytics();
  const {ready} = register('Morning Rebel Pixels');
  const nonce = useNonce();
  const loaded = useRef({google: false, meta: false, tiktok: false});
  // Last URL each platform recorded a page view for, so a page is never counted twice.
  const viewed = useRef({ga4: '', meta: '', tiktok: ''});

  useEffect(() => {
    const w = window as W;
    const can = () => ({
      analytics: Boolean(w.Shopify?.customerPrivacy?.analyticsProcessingAllowed?.()),
      marketing: Boolean(w.Shopify?.customerPrivacy?.marketingAllowed?.()),
    });

    const ensure = () => {
      const {analytics, marketing} = can();
      if ((config.ga4 && analytics) || (config.googleAds && marketing)) {
        if (!loaded.current.google) {
          loaded.current.google = true;
          w.dataLayer = w.dataLayer || [];
          w.gtag = function gtag() {
            // eslint-disable-next-line prefer-rest-params
            w.dataLayer!.push(arguments);
          };
          w.gtag('js', new Date());
          inject(`https://www.googletagmanager.com/gtag/js?id=${config.ga4 ?? config.googleAds}`, nonce);
        }
        // Page views are sent explicitly (see pageView) so client-side navigations count once.
        if (config.ga4 && analytics) w.gtag?.('config', config.ga4, {send_page_view: false});
        if (config.googleAds && marketing) w.gtag?.('config', config.googleAds);
      }
      if (config.meta && marketing && !loaded.current.meta) {
        loaded.current.meta = true;
        const fbq = function (...args: unknown[]) {
          if (fbq.callMethod) fbq.callMethod(...args);
          else fbq.queue.push(args);
        } as unknown as NonNullable<W['fbq']> & {queue: unknown[]};
        fbq.queue = [];
        fbq.loaded = true;
        fbq.version = '2.0';
        fbq.push = fbq;
        w.fbq = fbq;
        w._fbq = fbq;
        inject('https://connect.facebook.net/en_US/fbevents.js', nonce);
        w.fbq('init', config.meta);
      }
      if (config.tiktok && marketing && !loaded.current.tiktok) {
        loaded.current.tiktok = true;
        // Mirrors TikTok's base code: a queue that events.js drains on load.
        const ttq = [] as unknown as Array<unknown> & Record<string, unknown>;
        const methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
        for (const m of methods) {
          ttq[m] = (...args: unknown[]) => ttq.push([m, ...args]);
        }
        const id = config.tiktok;
        ttq._i = {[id]: Object.assign([], {_u: 'https://analytics.tiktok.com/i18n/pixel/events.js'})};
        ttq._t = {[id]: Date.now()};
        ttq._o = {[id]: {}};
        (w as unknown as Record<string, unknown>).TiktokAnalyticsObject = 'ttq';
        w.ttq = ttq as unknown as NonNullable<W['ttq']>;
        inject(`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${id}&lib=ttq`, nonce);
      }
    };

    const pageView = () => {
      const {analytics, marketing} = can();
      const url = window.location.href;
      const seen = viewed.current;
      if (config.ga4 && analytics && loaded.current.google && seen.ga4 !== url) {
        seen.ga4 = url;
        w.gtag?.('event', 'page_view', {page_location: url, page_title: document.title});
      }
      if (config.meta && marketing && loaded.current.meta && seen.meta !== url) {
        seen.meta = url;
        w.fbq?.('track', 'PageView');
      }
      if (config.tiktok && marketing && loaded.current.tiktok && seen.tiktok !== url) {
        seen.tiktok = url;
        w.ttq?.page();
      }
    };

    // Consent can arrive after the first page_viewed event, so the current
    // page is recorded as soon as a platform loads.
    const onConsent = () => {
      ensure();
      pageView();
    };
    onConsent();
    document.addEventListener('visitorConsentCollected', onConsent);

    const send = (ga: string, meta: string | null, tiktok: string | null, items: ItemPayload[]) => {
      const {analytics, marketing} = can();
      const value = items.reduce((sum, i) => sum + Number(i.price) * (i.quantity || 1), 0);
      const gaItems = items.map((i) => ({item_id: i.variantId || i.id, item_name: i.title, price: Number(i.price), quantity: i.quantity}));
      if (config.ga4 && analytics) w.gtag?.('event', ga, {currency, value, items: gaItems});
      if (marketing) {
        if (config.googleAds && ga === 'add_to_cart' && config.googleAdsAddToCartLabel) {
          w.gtag?.('event', 'conversion', {send_to: `${config.googleAds}/${config.googleAdsAddToCartLabel}`, value, currency});
        }
        if (config.meta && meta) w.fbq?.('track', meta, {currency, value, content_type: 'product', content_ids: items.map((i) => i.variantId || i.id)});
        if (config.tiktok && tiktok) w.ttq?.track(tiktok, {currency, value, contents: items.map((i) => ({content_id: i.variantId || i.id, content_name: i.title, quantity: i.quantity, price: Number(i.price)}))});
      }
    };

    subscribe('page_viewed', () => pageView());
    subscribe('product_viewed', (data) => send('view_item', 'ViewContent', 'ViewContent', toItems(data.products)));
    subscribe('product_added_to_cart', (data) => {
      const line = data.currentLine;
      if (!line) return;
      send('add_to_cart', 'AddToCart', 'AddToCart', [
        {
          id: line.merchandise.product.id,
          title: line.merchandise.product.title,
          price: line.cost.amountPerQuantity.amount,
          variantId: line.merchandise.id,
          quantity: Math.max(1, line.quantity - (data.prevLine?.quantity ?? 0)),
        },
      ]);
    });
    subscribe('cart_viewed', () => send('view_cart', null, null, []));
    subscribe('custom_select_item', () => send('select_item', null, null, []));
    subscribe('custom_begin_checkout', () => send('begin_checkout', 'InitiateCheckout', 'InitiateCheckout', []));

    ready();
    return () => document.removeEventListener('visitorConsentCollected', onConsent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  void customerPrivacy;
  return null;
}
