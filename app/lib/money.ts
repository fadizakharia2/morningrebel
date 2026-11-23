import type {Money} from '~/lib/catalog/types';

/** Converts a Shopify decimal string to integer minor units without float drift. */
export function toMinorUnits(amount: string): number | null {
  const match = /^(-)?(\d+)(?:\.(\d{1,3}))?$/.exec(amount.trim());
  if (!match) return null;
  const [, sign, whole, fraction = ''] = match;
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
  return sign ? -cents : cents;
}

export function fromMinorUnits(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/**
 * Display-only sum of Shopify prices (e.g. the Duo's two bags).
 * Returns null when currencies differ or an amount is malformed, in which
 * case the UI omits the total rather than show a wrong number. Checkout
 * totals always come from Shopify.
 */
export function sumMoney(values: Money[]): Money | null {
  if (values.length === 0) return null;
  const currency = values[0].currencyCode;
  let total = 0;
  for (const value of values) {
    if (value.currencyCode !== currency) return null;
    const cents = toMinorUnits(value.amount);
    if (cents === null) return null;
    total += cents;
  }
  return {amount: fromMinorUnits(total), currencyCode: currency};
}

export function multiplyMoney(value: Money, quantity: number): Money | null {
  const cents = toMinorUnits(value.amount);
  if (cents === null) return null;
  return {amount: fromMinorUnits(cents * quantity), currencyCode: value.currencyCode};
}

export function formatMoney(value: Money, locale = 'en-US'): string {
  const amount = Number(value.amount);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: value.currencyCode,
    }).format(amount);
  } catch {
    return `${value.amount} ${value.currencyCode}`;
  }
}
