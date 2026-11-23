import {describe, expect, it} from 'vitest';
import {
  fixturesEnabled,
  getCatalogConfig,
  getFixtureStorefront,
  sanitizeHandle,
} from '~/lib/catalog/catalog.server';
import {normalizeProduct, parseFacts, parseRating, safeHttpsUrl} from '~/lib/catalog/normalize';
import {FIXTURE_DARK} from '~/lib/catalog/fixtures';
import {canPurchase, defaultVariant, findVariant, optionValueState} from '~/lib/variants';

const env = (vars: Partial<Env>) => vars as Env;

describe('fixtures guard', () => {
  it('only enables fixtures on localhost with the flag set', () => {
    const local = new Request('http://localhost:3000/');
    const prod = new Request('https://morningrebel.example/');
    expect(fixturesEnabled(env({MR_DEV_FIXTURES: 'true'}), local)).toBe(true);
    expect(fixturesEnabled(env({MR_DEV_FIXTURES: 'true'}), prod)).toBe(false);
    expect(fixturesEnabled(env({}), local)).toBe(false);
  });
  it('fixture prices are zero placeholders and carry no product facts', () => {
    const data = getFixtureStorefront();
    for (const p of [data.medium!, data.dark!]) {
      expect(p.isFixture).toBe(true);
      expect(p.variants.every((v) => v.price.amount === '0.00')).toBe(true);
      expect(p.facts.tastingNotes).toEqual([]);
      expect(p.facts.mushrooms).toEqual([]);
      expect(p.facts.caffeine).toBeUndefined();
      expect(p.rating).toBeNull();
    }
  });
});

describe('catalog config', () => {
  it('sanitises handles from env', () => {
    expect(sanitizeHandle('Dark-Roast', 'x')).toBe('dark-roast');
    expect(sanitizeHandle('bad handle"', 'fallback')).toBe('fallback');
    expect(getCatalogConfig(env({})).mediumHandle).toBe('medium-roast');
  });
});

describe('metafield parsing', () => {
  it('reads verified facts exactly as supplied', () => {
    const facts = parseFacts([
      {namespace: 'morning_rebel', key: 'tasting_notes', type: 'list.single_line_text_field', value: '["Cocoa","Toasted nut"]'},
      {namespace: 'morning_rebel', key: 'mushroom_blend', type: 'json', value: '[{"name":"Example mushroom","amount":"100 mg"}]'},
      {namespace: 'morning_rebel', key: 'caffeine', type: 'single_line_text_field', value: 'Per supplier sheet'},
      {namespace: 'morning_rebel', key: 'lab_report_url', type: 'url', value: 'javascript:alert(1)'},
      null,
    ]);
    expect(facts.tastingNotes).toEqual(['Cocoa', 'Toasted nut']);
    expect(facts.mushrooms).toEqual([{name: 'Example mushroom', amount: '100 mg'}]);
    expect(facts.caffeine).toBe('Per supplier sheet');
    expect(facts.testingUrl).toBeUndefined();
  });
  it('tolerates malformed JSON', () => {
    expect(parseFacts([{namespace: 'morning_rebel', key: 'mushroom_blend', type: 'json', value: '{oops'}]).mushrooms).toEqual([]);
  });
  it('only exposes ratings with a real count', () => {
    const rating = {namespace: 'reviews', key: 'rating', type: 'rating', value: '{"value":"4.6","scale_min":"1.0","scale_max":"5.0"}'};
    expect(parseRating(rating, {namespace: 'reviews', key: 'rating_count', type: 'number_integer', value: '12'})).toEqual({value: 4.6, scaleMax: 5, count: 12});
    expect(parseRating(rating, {namespace: 'reviews', key: 'rating_count', type: 'number_integer', value: '0'})).toBeNull();
    expect(parseRating(rating, null)).toBeNull();
  });
  it('accepts only https documentation links', () => {
    expect(safeHttpsUrl('https://cdn.shopify.com/report.pdf')).toBe('https://cdn.shopify.com/report.pdf');
    expect(safeHttpsUrl('http://insecure.example')).toBeUndefined();
  });
});

describe('variant selection and sold-out behaviour', () => {
  const dark = normalizeProduct(FIXTURE_DARK, 'dark', true)!;
  it('defaults to the first purchasable variant', () => {
    expect(defaultVariant(dark)?.title).toBe('Standard');
  });
  it('finds variants by selected options', () => {
    expect(findVariant(dark, {Bag: 'Sold-out test variant'})?.availableForSale).toBe(false);
  });
  it('never allows purchase of an unavailable variant', () => {
    const soldOut = findVariant(dark, {Bag: 'Sold-out test variant'});
    expect(canPurchase(soldOut)).toBe(false);
    expect(canPurchase(undefined)).toBe(false);
    expect(optionValueState(dark, {Bag: 'Standard'}, 'Bag', 'Sold-out test variant')).toMatchObject({exists: true, available: false});
  });
});
