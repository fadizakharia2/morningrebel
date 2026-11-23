import {cartSetIdDefault, createHydrogenContext} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';
import {CART_QUERY_FRAGMENT} from '~/lib/cart/fragment';
import {fixturesEnabled} from '~/lib/catalog/catalog.server';
import {createFixtureCart} from '~/lib/cart/fixture-cart.server';
import type {Cart, CartActionResult} from '~/lib/cart/cart-types';
import type {AddLineInput, UpdateLineInput} from '~/lib/cart/validation';

/**
 * The one cart interface routes use. In production it is Hydrogen's official
 * Cart API handler; locally, with fixtures enabled, a session-backed stand-in.
 */
export interface CommerceCart {
  get(): Promise<Cart | null>;
  addLines(lines: AddLineInput[]): Promise<CartActionResult>;
  updateLines(lines: UpdateLineInput[]): Promise<CartActionResult>;
  removeLines(lineIds: string[]): Promise<CartActionResult>;
  updateAttributes(
    attributes: Array<{key: string; value: string}>,
  ): Promise<CartActionResult>;
  setCartId(cartId: string): Headers;
}

export interface Commerce {
  cart: CommerceCart;
  isFixture: boolean;
}

declare global {
  interface HydrogenAdditionalContext {
    commerce: Commerce;
  }
}

const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days, matching Shopify cart lifetime guidance

export async function createHydrogenRouterContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
  if (!env?.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    throw new Error(
      'SESSION_SECRET must be set to a random value of at least 32 characters',
    );
  }

  const isHttps = new URL(request.url).protocol === 'https:';
  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open('hydrogen'),
    AppSession.init(request, [env.SESSION_SECRET], {secure: isHttps}),
  ]);

  const useFixtures = fixturesEnabled(env, request);
  // Created per request (never module scope) so concurrent requests in the
  // same worker isolate can never see each other's cart.
  const commerce: Commerce = {
    isFixture: useFixtures,
    cart: null as unknown as CommerceCart,
  };

  // Fixture mode never queries Shopify, but Hydrogen's production client
  // refuses to start without a domain. `.invalid` is reserved and never resolves.
  const clientEnv =
    useFixtures && !env.PUBLIC_STORE_DOMAIN
      ? {
          ...env,
          PUBLIC_STORE_DOMAIN: 'fixtures.invalid',
          PUBLIC_STOREFRONT_API_TOKEN: env.PUBLIC_STOREFRONT_API_TOKEN || 'fixtures',
        }
      : env;

  const hydrogenContext = createHydrogenContext(
    {
      env: clientEnv,
      request,
      cache,
      waitUntil,
      session,
      i18n: {language: 'EN', country: 'US'},
      cart: {
        queryFragment: CART_QUERY_FRAGMENT,
        setId: cartSetIdDefault({
          maxage: CART_COOKIE_MAX_AGE,
          httponly: true,
          secure: isHttps,
          samesite: 'Lax',
          path: '/',
        }),
      },
    },
    {commerce},
  );

  commerce.cart = useFixtures
    ? createFixtureCart(session)
    : wrapHydrogenCart(hydrogenContext.cart);

  return hydrogenContext;
}

type HydrogenCart = ReturnType<typeof createHydrogenContext>['cart'];

function wrapHydrogenCart(cart: HydrogenCart): CommerceCart {
  const asResult = (value: unknown) => value as CartActionResult;
  return {
    get: async () => ((await cart.get()) as unknown as Cart | null) ?? null,
    addLines: async (lines) => asResult(await cart.addLines(lines)),
    updateLines: async (lines) => asResult(await cart.updateLines(lines)),
    removeLines: async (ids) => asResult(await cart.removeLines(ids)),
    updateAttributes: async (attributes) =>
      asResult(await cart.updateAttributes(attributes)),
    setCartId: (id) => cart.setCartId(id),
  };
}
