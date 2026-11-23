/**
 * Server-side validation for every cart mutation. The browser can send
 * anything, so we only forward well-formed Shopify IDs and bounded integer
 * quantities. Prices are never accepted from the client: Shopify computes
 * every amount on its side.
 */

export const MAX_LINE_QUANTITY = 10;
export const MAX_LINES_PER_REQUEST = 4;

const VARIANT_ID = /^gid:\/\/shopify\/ProductVariant\/\d{1,20}$/;
const CART_LINE_ID = /^gid:\/\/shopify\/CartLine\/[A-Za-z0-9-]{1,100}(\?cart=[A-Za-z0-9-]{1,100})?$/;

export class CartInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CartInputError';
  }
}

export function isVariantId(value: unknown): value is string {
  return typeof value === 'string' && VARIANT_ID.test(value);
}

export function isCartLineId(value: unknown): value is string {
  return typeof value === 'string' && CART_LINE_ID.test(value);
}

export function parseQuantity(value: unknown, {allowZero = false} = {}) {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isInteger(n)) {
    throw new CartInputError('Quantity must be a whole number.');
  }
  const min = allowZero ? 0 : 1;
  if (n < min || n > MAX_LINE_QUANTITY) {
    throw new CartInputError(
      `Quantity must be between ${min} and ${MAX_LINE_QUANTITY}.`,
    );
  }
  return n;
}

export interface AddLineInput {
  merchandiseId: string;
  quantity: number;
}

export interface UpdateLineInput {
  id: string;
  quantity: number;
}

function asArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new CartInputError('Lines are required.');
  if (value.length === 0 || value.length > MAX_LINES_PER_REQUEST) {
    throw new CartInputError('Too many or too few cart lines.');
  }
  return value;
}

export function validateAddLines(lines: unknown): AddLineInput[] {
  return asArray(lines).map((line) => {
    const record = (line ?? {}) as Record<string, unknown>;
    if (!isVariantId(record.merchandiseId)) {
      throw new CartInputError('That product option is not valid.');
    }
    return {
      merchandiseId: record.merchandiseId,
      quantity: parseQuantity(record.quantity ?? 1),
    };
  });
}

export function validateUpdateLines(lines: unknown): UpdateLineInput[] {
  return asArray(lines).map((line) => {
    const record = (line ?? {}) as Record<string, unknown>;
    if (!isCartLineId(record.id)) {
      throw new CartInputError('That cart item is not valid.');
    }
    return {id: record.id, quantity: parseQuantity(record.quantity, {allowZero: true})};
  });
}

export function validateLineIds(ids: unknown): string[] {
  return asArray(ids).map((id) => {
    if (!isCartLineId(id)) throw new CartInputError('That cart item is not valid.');
    return id;
  });
}

/** UTM and click-id parameters we keep as cart attributes for attribution. */
export const ATTRIBUTION_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'ttclid',
] as const;

const ATTRIBUTION_VALUE = /^[A-Za-z0-9._~\-+ ]{1,150}$/;

export function sanitizeAttribution(
  input: Record<string, unknown>,
): Array<{key: string; value: string}> {
  const out: Array<{key: string; value: string}> = [];
  for (const key of ATTRIBUTION_KEYS) {
    const value = input[key];
    if (typeof value === 'string' && ATTRIBUTION_VALUE.test(value)) {
      out.push({key: `_${key}`, value});
    }
  }
  return out;
}

/**
 * Only same-site relative paths are accepted as a post-action redirect.
 * Rejects protocol-relative (//evil.com), backslash tricks and absolute URLs.
 */
function hasControlChars(value: string) {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

export function safeRedirectPath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (value.includes('\\') || hasControlChars(value)) return fallback;
  try {
    const url = new URL(value, 'https://placeholder.invalid');
    if (url.origin !== 'https://placeholder.invalid') return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
