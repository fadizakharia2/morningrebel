/**
 * Brand voice only. These lines describe positioning from the brand brief.
 * They are not product facts: tasting notes, ingredients, caffeine and
 * brewing come exclusively from Shopify metafields.
 */
import type {RoastKey} from '~/lib/catalog/types';

export const ROAST_COPY: Record<
  RoastKey,
  {name: string; line: string; choice: string; character: string}
> = {
  medium: {
    name: 'Medium Roast',
    line: 'Balanced and approachable. The everyday ritual.',
    choice: 'Balanced & Smooth',
    character: 'Warm, even, easy to love.',
  },
  dark: {
    name: 'Dark Roast',
    line: 'Bold and rich. Our signature roast.',
    choice: 'Bold & Intense',
    character: 'Deep, dramatic, built for intensity.',
  },
};

export const TAGLINE = 'For the ritual. Not the hype.';
