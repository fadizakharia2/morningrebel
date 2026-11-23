/**
 * Normalised commerce types used by every component.
 *
 * Shopify (or, in local development only, the labelled fixtures) is the single
 * source of truth for everything in here. Components never invent prices,
 * availability, ingredients or claims: when a field is missing they hide the
 * row, or, in fixture mode, show a visible "awaiting verified data" marker.
 */

export type RoastKey = 'medium' | 'dark';

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface ImageData {
  id?: string | null;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface Variant {
  id: string;
  title: string;
  availableForSale: boolean;
  /** True when Shopify continues selling past zero stock is not knowable here; we trust availableForSale only. */
  quantityAvailable?: number | null;
  price: Money;
  compareAtPrice?: Money | null;
  selectedOptions: SelectedOption[];
  image?: ImageData | null;
  sku?: string | null;
  product: {handle: string; title: string};
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface MushroomEntry {
  name: string;
  amount?: string;
}

/** Facts that must come from verified supplier data via Shopify metafields. */
export interface RoastFacts {
  tastingNotes: string[];
  roastSummary?: string;
  ingredients?: string;
  mushrooms: MushroomEntry[];
  caffeine?: string;
  coffeeOrigin?: string;
  sourcing?: string;
  testingUrl?: string;
  brewingSteps: string[];
  netWeight?: string;
}

export interface Rating {
  value: number;
  scaleMax: number;
  count: number;
}

export interface Product {
  id: string;
  key: RoastKey | 'duo';
  handle: string;
  title: string;
  vendor: string;
  description: string;
  seo: {title?: string | null; description?: string | null};
  featuredImage?: ImageData | null;
  images: ImageData[];
  options: ProductOption[];
  variants: Variant[];
  facts: RoastFacts;
  rating?: Rating | null;
  hasSellingPlans: boolean;
  /** Present only when the data came from local development fixtures. */
  isFixture: boolean;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

export interface PolicyLink {
  handle: string;
  title: string;
}

export interface StorefrontData {
  shopName: string;
  medium: Product | null;
  dark: Product | null;
  /** Optional Shopify bundle product configured as the Duo. */
  duo: Product | null;
  faqs: FaqEntry[];
  policies: PolicyLink[];
  isFixture: boolean;
}
