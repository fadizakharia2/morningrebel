/**
 * DEVELOPMENT-ONLY cart used when fixtures are active (no Shopify network
 * access). It mirrors the subset of Hydrogen's cart handler that the
 * storefront uses so the drawer, quantity updates, removal, sold-out errors
 * and the checkout hand-off can be developed and tested end to end.
 * It is never constructed unless `fixturesEnabled()` is true.
 */
import type {HydrogenSession} from '@shopify/hydrogen';
import {getFixtureStorefront} from '~/lib/catalog/catalog.server';
import type {Variant} from '~/lib/catalog/types';
import {multiplyMoney, sumMoney} from '~/lib/money';
import type {Cart, CartActionResult, CartLine} from './cart-types';
import type {AddLineInput, UpdateLineInput} from './validation';
import {MAX_LINE_QUANTITY} from './validation';

const SESSION_KEY = 'mr_fixture_cart';

interface StoredLine {
  variantId: string;
  quantity: number;
}

function allVariants(): Variant[] {
  const data = getFixtureStorefront();
  return [...(data.medium?.variants ?? []), ...(data.dark?.variants ?? [])];
}

function lineIdFor(variantId: string) {
  return `gid://shopify/CartLine/fx-${variantId.split('/').pop()}`;
}

export function createFixtureCart(session: HydrogenSession) {
  const read = (): StoredLine[] => {
    const raw = session.get(SESSION_KEY) as unknown;
    return Array.isArray(raw) ? (raw as StoredLine[]) : [];
  };
  const write = (lines: StoredLine[]) => session.set(SESSION_KEY, lines);

  const build = (stored: StoredLine[]): Cart | null => {
    if (stored.length === 0) return null;
    const variants = allVariants();
    const lines: CartLine[] = [];
    for (const entry of stored) {
      const v = variants.find((variant) => variant.id === entry.variantId);
      if (!v) continue;
      lines.push({
        id: lineIdFor(v.id),
        quantity: entry.quantity,
        cost: {
          amountPerQuantity: v.price,
          totalAmount: multiplyMoney(v.price, entry.quantity) ?? v.price,
        },
        merchandise: {
          id: v.id,
          title: v.title,
          availableForSale: v.availableForSale,
          price: v.price,
          image: v.image,
          selectedOptions: v.selectedOptions,
          product: {handle: v.product.handle, title: v.product.title},
        },
      });
    }
    const subtotal =
      sumMoney(lines.map((line) => line.cost.totalAmount)) ??
      {amount: '0.00', currencyCode: 'USD'};
    return {
      id: 'gid://shopify/Cart/fixture',
      checkoutUrl: '/dev/checkout',
      totalQuantity: lines.reduce((total, line) => total + line.quantity, 0),
      lines: {nodes: lines},
      cost: {subtotalAmount: subtotal, totalAmount: subtotal},
    };
  };

  const result = (
    stored: StoredLine[],
    userErrors: Array<{message: string}> = [],
  ): CartActionResult => ({cart: build(stored), userErrors});

  return {
    isFixture: true as const,
    get: async () => build(read()),
    addLines: async (lines: AddLineInput[]) => {
      const stored = read();
      const variants = allVariants();
      const errors: Array<{message: string}> = [];
      for (const line of lines) {
        const variant = variants.find((v) => v.id === line.merchandiseId);
        if (!variant) {
          errors.push({message: 'That product option no longer exists.'});
          continue;
        }
        if (!variant.availableForSale) {
          errors.push({message: `${variant.product.title} (${variant.title}) is sold out.`});
          continue;
        }
        const existing = stored.find((s) => s.variantId === variant.id);
        if (existing) {
          existing.quantity = Math.min(existing.quantity + line.quantity, MAX_LINE_QUANTITY);
        } else {
          stored.push({variantId: variant.id, quantity: line.quantity});
        }
      }
      write(stored);
      return result(stored, errors);
    },
    updateLines: async (lines: UpdateLineInput[]) => {
      let stored = read();
      for (const line of lines) {
        stored = stored
          .map((s) =>
            lineIdFor(s.variantId) === line.id ? {...s, quantity: line.quantity} : s,
          )
          .filter((s) => s.quantity > 0);
      }
      write(stored);
      return result(stored);
    },
    removeLines: async (lineIds: string[]) => {
      const stored = read().filter((s) => !lineIds.includes(lineIdFor(s.variantId)));
      write(stored);
      return result(stored);
    },
    updateAttributes: async () => result(read()),
    setCartId: () => new Headers(),
  };
}

export type FixtureCart = ReturnType<typeof createFixtureCart>;
