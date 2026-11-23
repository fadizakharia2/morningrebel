/**
 * Keeps campaign parameters (utm_*, gclid, fbclid, ttclid) from the landing
 * URL for the rest of the visit, so the server can attach them to the cart as
 * attributes and they flow through to the Shopify order. sessionStorage only:
 * nothing personal, cleared when the tab closes.
 */
import {ATTRIBUTION_KEYS} from '~/lib/cart/validation';

const STORAGE_KEY = 'mr_attribution';

export function captureAttribution(search: string) {
  try {
    const params = new URLSearchParams(search);
    const found: Record<string, string> = {};
    for (const key of ATTRIBUTION_KEYS) {
      const value = params.get(key);
      if (value) found[key] = value.slice(0, 150);
    }
    if (Object.keys(found).length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    }
  } catch {
    // Storage can be unavailable (private mode); attribution is optional.
  }
}

export function readAttribution(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}
