import type {
  FaqEntry,
  ImageData,
  MushroomEntry,
  Product,
  Rating,
  RoastFacts,
  RoastKey,
  Variant,
} from './types';

/** The subset of the Storefront API product shape that we read. */
export interface RawProduct {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  description: string;
  seo: {title?: string | null; description?: string | null};
  featuredImage?: ImageData | null;
  images: {nodes: ImageData[]};
  options: Array<{name: string; optionValues: Array<{name: string}>}>;
  variants: {nodes: Variant[]};
  sellingPlanGroups?: {nodes: Array<{name: string}>} | null;
  metafields: Array<RawMetafield | null>;
}

export interface RawMetafield {
  namespace: string;
  key: string;
  type: string;
  value: string;
}

const MAX_TEXT = 2000;

function clean(value: unknown, max = MAX_TEXT): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

/** Parses list.* metafields (JSON arrays) and tolerates newline separated text. */
export function parseStringList(field?: RawMetafield | null): string[] {
  if (!field?.value) return [];
  const parsed = field.type.startsWith('list.') ? parseJson(field.value) : undefined;
  const list = Array.isArray(parsed)
    ? parsed
    : field.value.split(/\r?\n/);
  return list
    .map((entry) => clean(entry, 280))
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 12);
}

/**
 * `mushroom_blend` is a JSON metafield: [{"name": "...", "amount": "..."}].
 * Amounts are shown exactly as supplied. Nothing is derived or rounded.
 */
export function parseMushrooms(field?: RawMetafield | null): MushroomEntry[] {
  if (!field?.value) return [];
  const parsed = parseJson(field.value);
  if (!Array.isArray(parsed)) return [];
  const entries: MushroomEntry[] = [];
  for (const item of parsed.slice(0, 12)) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const name = clean(record.name, 120);
    if (!name) continue;
    entries.push({name, amount: clean(record.amount, 60)});
  }
  return entries;
}

/** Shopify `rating` metafields store {"value","scale_min","scale_max"}. */
export function parseRating(
  ratingField?: RawMetafield | null,
  countField?: RawMetafield | null,
): Rating | null {
  if (!ratingField?.value || !countField?.value) return null;
  const parsed = parseJson(ratingField.value) as
    | {value?: string; scale_max?: string}
    | undefined;
  const value = Number(parsed?.value);
  const scaleMax = Number(parsed?.scale_max ?? 5);
  const count = Number.parseInt(countField.value, 10);
  if (!Number.isFinite(value) || !Number.isFinite(scaleMax)) return null;
  if (!Number.isInteger(count) || count <= 0) return null;
  if (value < 0 || value > scaleMax) return null;
  return {value, scaleMax, count};
}

/** Only https links to Shopify's CDN or the merchant's own documents are kept. */
export function safeHttpsUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function parseFacts(metafields: Array<RawMetafield | null>): RoastFacts {
  const find = (namespace: string, key: string) =>
    metafields.find((m) => m?.namespace === namespace && m.key === key) ??
    null;
  const text = (key: string) => clean(find('morning_rebel', key)?.value);
  return {
    tastingNotes: parseStringList(find('morning_rebel', 'tasting_notes')),
    roastSummary: text('roast_summary'),
    ingredients: text('ingredients'),
    mushrooms: parseMushrooms(find('morning_rebel', 'mushroom_blend')),
    caffeine: text('caffeine'),
    coffeeOrigin: text('coffee_origin'),
    sourcing: text('sourcing'),
    testingUrl: safeHttpsUrl(text('lab_report_url')),
    brewingSteps: parseStringList(find('morning_rebel', 'brewing_steps')),
    netWeight: text('net_weight'),
  };
}

export function normalizeProduct(
  raw: RawProduct | null | undefined,
  key: RoastKey | 'duo',
  isFixture = false,
): Product | null {
  if (!raw?.id) return null;
  const metafields = raw.metafields ?? [];
  const find = (namespace: string, k: string) =>
    metafields.find((m) => m?.namespace === namespace && m.key === k) ?? null;
  return {
    id: raw.id,
    key,
    handle: raw.handle,
    title: raw.title,
    vendor: raw.vendor,
    description: clean(raw.description) ?? '',
    seo: raw.seo ?? {},
    featuredImage: raw.featuredImage ?? raw.images.nodes[0] ?? null,
    images: raw.images.nodes,
    options: raw.options.map((option) => ({
      name: option.name,
      values: option.optionValues.map((v) => v.name),
    })),
    variants: raw.variants.nodes,
    facts: parseFacts(metafields),
    rating: parseRating(find('reviews', 'rating'), find('reviews', 'rating_count')),
    hasSellingPlans: (raw.sellingPlanGroups?.nodes.length ?? 0) > 0,
    isFixture,
  };
}

export function normalizeFaqs(
  nodes: Array<{id: string; fields: Array<{key: string; value?: string | null}>}>,
): FaqEntry[] {
  const faqs: FaqEntry[] = [];
  for (const node of nodes) {
    const field = (key: string) =>
      clean(node.fields.find((f) => f.key === key)?.value ?? undefined);
    const question = field('question');
    const answer = field('answer');
    if (question && answer) faqs.push({id: node.id, question, answer});
  }
  return faqs;
}
