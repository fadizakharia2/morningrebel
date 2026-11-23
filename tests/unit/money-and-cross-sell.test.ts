import {describe, expect, it} from 'vitest';
import {formatMoney, multiplyMoney, sumMoney, toMinorUnits} from '~/lib/money';
import {getCrossSell} from '~/lib/cart/cross-sell';
import {getFixtureStorefront} from '~/lib/catalog/catalog.server';

describe('money', () => {
  it('sums without floating point drift', () => {
    expect(sumMoney([{amount: '0.10', currencyCode: 'USD'}, {amount: '0.20', currencyCode: 'USD'}])).toEqual({
      amount: '0.30',
      currencyCode: 'USD',
    });
    expect(sumMoney([{amount: '24.99', currencyCode: 'USD'}, {amount: '27.5', currencyCode: 'USD'}])?.amount).toBe('52.49');
  });
  it('refuses to sum mixed currencies or malformed amounts', () => {
    expect(sumMoney([{amount: '1.00', currencyCode: 'USD'}, {amount: '1.00', currencyCode: 'CAD'}])).toBeNull();
    expect(sumMoney([{amount: 'abc', currencyCode: 'USD'}])).toBeNull();
    expect(sumMoney([])).toBeNull();
  });
  it('multiplies line totals exactly', () => {
    expect(multiplyMoney({amount: '19.99', currencyCode: 'USD'}, 3)?.amount).toBe('59.97');
    expect(toMinorUnits('7')).toBe(700);
  });
  it('formats with the Shopify currency code', () => {
    expect(formatMoney({amount: '24.00', currencyCode: 'USD'})).toBe('$24.00');
  });
});

describe('cart cross-sell', () => {
  const {medium, dark} = getFixtureStorefront();
  const line = (handle: string) => ({merchandise: {product: {handle}}}) as never;

  it('suggests Dark when only Medium is in the cart', () => {
    expect(getCrossSell([line('medium-roast')], medium, dark)?.key).toBe('dark');
  });
  it('suggests Medium when only Dark is in the cart', () => {
    expect(getCrossSell([line('dark-roast')], medium, dark)?.key).toBe('medium');
  });
  it('suggests nothing when both are present or the cart is empty', () => {
    expect(getCrossSell([line('medium-roast'), line('dark-roast')], medium, dark)).toBeNull();
    expect(getCrossSell([], medium, dark)).toBeNull();
  });
});
