import {Link} from 'react-router';
import type {Route} from './+types/dev.checkout';
import {fixturesEnabled} from '~/lib/catalog/catalog.server';

export const meta: Route.MetaFunction = () => [
  {title: 'Development checkout stand-in'},
  {name: 'robots', content: 'noindex'},
];

/**
 * Exists only with development fixtures. In production the cart's checkout
 * button goes straight to Shopify's hosted checkout (cart.checkoutUrl).
 */
export function loader({context, request}: Route.LoaderArgs) {
  if (!fixturesEnabled(context.env, request)) throw new Response('Not found', {status: 404});
  return null;
}

export default function DevCheckout() {
  return (
    <main id="main" className="wrap pb-24" style={{paddingTop: 'calc(var(--header-h) + 3rem)'}}>
      <h1 className="display-l mb-6">Checkout hand-off</h1>
      <p className="lead" data-testid="dev-checkout">
        With a connected store, this button opens Shopify&rsquo;s hosted checkout at the cart&rsquo;s
        checkoutUrl. No payment details are ever collected by this storefront.
      </p>
      <p className="mt-8">
        <Link to="/" className="btn">Back to the roasts</Link>
      </p>
    </main>
  );
}
