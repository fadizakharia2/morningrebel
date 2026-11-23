import {useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';
import type {StorefrontData} from '~/lib/catalog/types';

const EMPTY: StorefrontData = {
  shopName: 'Morning Rebel',
  medium: null,
  dark: null,
  duo: null,
  faqs: [],
  policies: [],
  isFixture: false,
};

/** Catalog data loaded once by the root loader and shared by every route. */
export function useStorefront(): StorefrontData {
  const data = useRouteLoaderData<RootLoader>('root');
  return data?.storefront ?? EMPTY;
}

export function useIsFixture() {
  return useStorefront().isFixture;
}
