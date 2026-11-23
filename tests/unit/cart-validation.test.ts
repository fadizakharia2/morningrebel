import {describe, expect, it} from 'vitest';
import {
  CartInputError,
  MAX_LINE_QUANTITY,
  safeRedirectPath,
  sanitizeAttribution,
  validateAddLines,
  validateLineIds,
  validateUpdateLines,
} from '~/lib/cart/validation';

const VARIANT = 'gid://shopify/ProductVariant/123456789';
const LINE = 'gid://shopify/CartLine/abc-123?cart=c1-xyz';

describe('validateAddLines', () => {
  it('accepts well-formed variant ids and quantities', () => {
    expect(validateAddLines([{merchandiseId: VARIANT, quantity: 2}])).toEqual([
      {merchandiseId: VARIANT, quantity: 2},
    ]);
  });

  it('defaults a missing quantity to 1', () => {
    expect(validateAddLines([{merchandiseId: VARIANT}])[0].quantity).toBe(1);
  });

  it('drops client-supplied prices and other fields', () => {
    const [line] = validateAddLines([
      {merchandiseId: VARIANT, quantity: 1, price: '0.01', cost: {amount: '0'}},
    ]);
    expect(Object.keys(line).sort()).toEqual(['merchandiseId', 'quantity']);
  });

  it.each([
    ['product id instead of variant', 'gid://shopify/Product/1'],
    ['script injection', '<script>alert(1)</script>'],
    ['non-numeric id', 'gid://shopify/ProductVariant/abc'],
    ['empty', ''],
  ])('rejects %s', (_label, merchandiseId) => {
    expect(() => validateAddLines([{merchandiseId, quantity: 1}])).toThrow(CartInputError);
  });

  it.each([0, -1, 1.5, MAX_LINE_QUANTITY + 1, Number.NaN, '3; DROP'])(
    'rejects quantity %s',
    (quantity) => {
      expect(() => validateAddLines([{merchandiseId: VARIANT, quantity}])).toThrow(CartInputError);
    },
  );

  it('rejects empty and oversized line arrays', () => {
    expect(() => validateAddLines([])).toThrow(CartInputError);
    expect(() => validateAddLines(Array(5).fill({merchandiseId: VARIANT, quantity: 1}))).toThrow();
    expect(() => validateAddLines('nope')).toThrow(CartInputError);
  });
});

describe('validateUpdateLines / validateLineIds', () => {
  it('allows quantity 0 on update (removal)', () => {
    expect(validateUpdateLines([{id: LINE, quantity: 0}])).toEqual([{id: LINE, quantity: 0}]);
  });
  it('rejects malformed line ids', () => {
    expect(() => validateUpdateLines([{id: 'gid://shopify/Cart/1', quantity: 1}])).toThrow();
    expect(() => validateLineIds(['../../etc'])).toThrow(CartInputError);
  });
  it('accepts valid line ids', () => {
    expect(validateLineIds([LINE])).toEqual([LINE]);
  });
});

describe('safeRedirectPath', () => {
  it.each([
    ['/cart', '/cart'],
    ['/products/dark-roast?variant=1#x', '/products/dark-roast?variant=1#x'],
  ])('keeps same-site path %s', (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });
  it.each(['https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)', '', 42, '/\n/evil'])(
    'blocks %s',
    (input) => {
      expect(safeRedirectPath(input)).toBe('/');
    },
  );
});

describe('sanitizeAttribution', () => {
  it('keeps allow-listed campaign keys with safe values', () => {
    expect(sanitizeAttribution({utm_source: 'meta', utm_campaign: 'launch-01', other: 'x'})).toEqual([
      {key: '_utm_source', value: 'meta'},
      {key: '_utm_campaign', value: 'launch-01'},
    ]);
  });
  it('drops unsafe values', () => {
    expect(sanitizeAttribution({utm_source: '<img src=x>'})).toEqual([]);
    expect(sanitizeAttribution({utm_source: 'a'.repeat(500)})).toEqual([]);
  });
});
