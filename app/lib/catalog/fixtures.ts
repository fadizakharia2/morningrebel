/**
 * DEVELOPMENT FIXTURES — NOT PRODUCT DATA.
 *
 * Used only when MR_DEV_FIXTURES="true" (local development and automated
 * tests without Shopify credentials). Every value here is a placeholder:
 *
 * - prices are 0.00 and the UI renders them as "Price from Shopify";
 * - no tasting notes, ingredients, mushroom species, caffeine or brewing
 *   instructions are provided, so the UI shows "Awaiting verified supplier
 *   data" instead of inventing facts;
 * - the images are Morning Rebel concept renders, not packaging photos.
 *
 * The site shows a persistent banner whenever fixtures are active, and the
 * server refuses to enable them in production builds.
 */
import type {RawProduct} from './normalize';
import type {Variant} from './types';

const ZERO = {amount: '0.00', currencyCode: 'USD'} as const;

function variant(
  id: string,
  handle: string,
  title: string,
  optionValue: string,
  availableForSale: boolean,
  image: string,
): Variant {
  return {
    id: `gid://shopify/ProductVariant/${id}`,
    title: optionValue,
    availableForSale,
    sku: null,
    price: ZERO,
    compareAtPrice: null,
    selectedOptions: [{name: 'Bag', value: optionValue}],
    image: {url: image, altText: title, width: 1200, height: 1500},
    product: {handle, title},
  };
}

const MEDIUM_IMG = '/fixtures/medium-roast.svg';
const DARK_IMG = '/fixtures/dark-roast.svg';

export const FIXTURE_MEDIUM: RawProduct = {
  id: 'gid://shopify/Product/9000000001',
  handle: 'medium-roast',
  title: 'Morning Rebel — Medium Roast',
  vendor: 'Morning Rebel',
  description:
    'Balanced and approachable. The everyday ritual for people who like a medium roast.',
  seo: {title: null, description: null},
  featuredImage: {
    url: MEDIUM_IMG,
    altText: 'Morning Rebel Medium Roast pouch, concept render',
    width: 1200,
    height: 1500,
  },
  images: {
    nodes: [
      {
        url: MEDIUM_IMG,
        altText: 'Morning Rebel Medium Roast pouch, concept render',
        width: 1200,
        height: 1500,
      },
    ],
  },
  options: [{name: 'Bag', optionValues: [{name: 'Standard'}]}],
  variants: {
    nodes: [
      variant(
        '9100000001',
        'medium-roast',
        'Morning Rebel — Medium Roast',
        'Standard',
        true,
        MEDIUM_IMG,
      ),
    ],
  },
  sellingPlanGroups: {nodes: []},
  metafields: [],
};

export const FIXTURE_DARK: RawProduct = {
  id: 'gid://shopify/Product/9000000002',
  handle: 'dark-roast',
  title: 'Morning Rebel — Dark Roast',
  vendor: 'Morning Rebel',
  description:
    'Bold and rich. Our signature roast, for mornings that call for intensity.',
  seo: {title: null, description: null},
  featuredImage: {
    url: DARK_IMG,
    altText: 'Morning Rebel Dark Roast pouch, concept render',
    width: 1200,
    height: 1500,
  },
  images: {
    nodes: [
      {
        url: DARK_IMG,
        altText: 'Morning Rebel Dark Roast pouch, concept render',
        width: 1200,
        height: 1500,
      },
    ],
  },
  // Two variants so variant selection and sold-out handling can be exercised.
  options: [
    {
      name: 'Bag',
      optionValues: [{name: 'Standard'}, {name: 'Sold-out test variant'}],
    },
  ],
  variants: {
    nodes: [
      variant(
        '9100000002',
        'dark-roast',
        'Morning Rebel — Dark Roast',
        'Standard',
        true,
        DARK_IMG,
      ),
      variant(
        '9100000003',
        'dark-roast',
        'Morning Rebel — Dark Roast',
        'Sold-out test variant',
        false,
        DARK_IMG,
      ),
    ],
  },
  sellingPlanGroups: {nodes: []},
  metafields: [],
};

export const FIXTURE_PRODUCTS = [FIXTURE_MEDIUM, FIXTURE_DARK];
