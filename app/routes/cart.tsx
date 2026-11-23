import {Analytics, CartForm} from '@shopify/hydrogen';
import {data, Link, useLoaderData, type HeadersFunction} from 'react-router';
import type {Route} from './+types/cart';
import {CartContents} from '~/components/cart/CartDrawer';
import type {CartActionResult} from '~/lib/cart/cart-types';
import {
  CartInputError,
  sanitizeAttribution,
  validateAddLines,
  validateLineIds,
  validateUpdateLines,
} from '~/lib/cart/validation';

export const meta: Route.MetaFunction = () => [
  {title: 'Your cart | Morning Rebel'},
  {name: 'robots', content: 'noindex'},
];

export const headers: HeadersFunction = ({actionHeaders}) => actionHeaders;

function friendlyErrors(result: CartActionResult): string[] {
  const raw = [
    ...(result.userErrors ?? []),
    ...(result.errors ?? []),
    // e.g. MERCHANDISE_NOT_ENOUGH_STOCK: Shopify adjusted or refused the quantity
    ...(result.warnings ?? []),
  ];
  if (raw.length === 0) return [];
  // Shopify's messages are customer-safe (e.g. "The product is sold out").
  // Anything unexpected collapses to a generic message.
  return raw.map((e) =>
    typeof e?.message === 'string' && e.message.length < 200
      ? e.message
      : 'Your cart could not be updated.',
  );
}

function parseAttribution(raw: FormDataEntryValue | null) {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 2000) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== 'object') return [];
    return sanitizeAttribution(value as Record<string, unknown>);
  } catch {
    return [];
  }
}

export async function action({request, context}: Route.ActionArgs) {
  const cart = context.commerce.cart;
  const formData = await request.formData();

  let result: CartActionResult;
  try {
    const {action, inputs} = CartForm.getFormInput(formData);
    switch (action) {
      case CartForm.ACTIONS.LinesAdd: {
        result = await cart.addLines(validateAddLines(inputs.lines));
        const attributes = parseAttribution(formData.get('attribution'));
        const alreadyTagged = result.cart?.attributes?.some((a) =>
          a.key.startsWith('_utm_'),
        );
        if (result.cart && attributes.length > 0 && !alreadyTagged) {
          await cart.updateAttributes(attributes);
        }
        break;
      }
      case CartForm.ACTIONS.LinesUpdate:
        result = await cart.updateLines(validateUpdateLines(inputs.lines));
        break;
      case CartForm.ACTIONS.LinesRemove:
        result = await cart.removeLines(validateLineIds(inputs.lineIds));
        break;
      default:
        return data({ok: false, errors: ['That cart action is not supported.']}, {status: 400});
    }
  } catch (error) {
    if (error instanceof CartInputError) {
      return data({ok: false, errors: [error.message]}, {status: 400});
    }
    console.error(
      '[morning-rebel] cart action failed',
      error instanceof Error ? error.message : 'unknown',
    );
    return data(
      {ok: false, errors: ['Your cart could not be updated. Please try again.']},
      {status: 502},
    );
  }

  const errors = friendlyErrors(result);
  const cartId = result.cart?.id;
  const headers = cartId ? cart.setCartId(cartId) : new Headers();

  return data(
    {
      ok: errors.length === 0,
      errors,
      cart: result.cart,
      analytics: {cartId},
    },
    {status: 200, headers},
  );
}

export async function loader({context}: Route.LoaderArgs) {
  return {cart: await context.commerce.cart.get()};
}

export default function CartPage() {
  const {cart} = useLoaderData<typeof loader>();
  return (
    <main id="main" className="wrap pb-24" style={{paddingTop: 'calc(var(--header-h) + 3rem)'}}>
      <h1 className="display-l mb-10">Your cart</h1>
      <div className="max-w-2xl">
        <CartContents cart={cart} layout="page" />
      </div>
      <p className="mt-10">
        <Link to="/#roasts" className="text-link">
          Continue shopping
        </Link>
      </p>
      <Analytics.CartView />
    </main>
  );
}
