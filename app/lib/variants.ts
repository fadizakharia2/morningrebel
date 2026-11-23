import {useCallback, useMemo, useState} from 'react';
import type {Product, SelectedOption, Variant} from '~/lib/catalog/types';

export function findVariant(
  product: Pick<Product, 'variants'>,
  selected: Record<string, string>,
): Variant | undefined {
  return product.variants.find((variant) =>
    variant.selectedOptions.every((opt) => selected[opt.name] === opt.value),
  );
}

/** First variant Shopify says can be bought, else the first variant (shown as sold out). */
export function defaultVariant(product: Pick<Product, 'variants'>): Variant | undefined {
  return product.variants.find((v) => v.availableForSale) ?? product.variants[0];
}

export function toSelection(options: SelectedOption[]): Record<string, string> {
  return Object.fromEntries(options.map((o) => [o.name, o.value]));
}

/**
 * Availability of each option value given the other current selections.
 * `exists` false means no such combination; `available` false means sold out.
 */
export function optionValueState(
  product: Pick<Product, 'variants'>,
  selected: Record<string, string>,
  optionName: string,
  value: string,
) {
  const variant = findVariant(product, {...selected, [optionName]: value});
  return {exists: Boolean(variant), available: Boolean(variant?.availableForSale), variant};
}

/** A purchase is allowed only for a resolved variant that Shopify marks availableForSale. */
export function canPurchase(variant: Variant | undefined | null): variant is Variant {
  return Boolean(variant?.availableForSale);
}

export function useVariantSelection(product: Product, initialVariantId?: string | null) {
  const initial = useMemo(() => {
    const fromId = initialVariantId
      ? product.variants.find((v) => v.id === initialVariantId)
      : undefined;
    return fromId ?? defaultVariant(product);
  }, [product, initialVariantId]);

  const [selected, setSelected] = useState<Record<string, string>>(() =>
    toSelection(initial?.selectedOptions ?? []),
  );

  const variant = findVariant(product, selected) ?? initial;

  const select = useCallback((name: string, value: string) => {
    setSelected((current) => ({...current, [name]: value}));
  }, []);

  return {selected, select, variant};
}

/** Only options with a real choice are rendered (hides "Title / Default Title"). */
export function visibleOptions(product: Pick<Product, 'options'>) {
  return product.options.filter((option) => option.values.length > 1);
}
