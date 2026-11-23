import type {Product} from '~/lib/catalog/types';
import type {CartLine} from './cart-types';

/**
 * Medium in the cart → suggest Dark. Dark in the cart → suggest Medium.
 * Both (or neither) → no suggestion. Suggestions never add anything on their
 * own: the customer has to press the button.
 */
export function getCrossSell(
  lines: Pick<CartLine, 'merchandise'>[],
  medium: Product | null,
  dark: Product | null,
): Product | null {
  if (!medium || !dark || lines.length === 0) return null;
  const handles = new Set(lines.map((line) => line.merchandise.product.handle));
  const hasMedium = handles.has(medium.handle);
  const hasDark = handles.has(dark.handle);
  if (hasMedium && !hasDark) return dark;
  if (hasDark && !hasMedium) return medium;
  return null;
}
