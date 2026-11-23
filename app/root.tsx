import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
  Link,
} from 'react-router';
import type {Route} from './+types/root';
import favicon from '~/assets/favicon.svg';
import displayFont from '~/assets/fonts/bodoni-moda-latin-standard-normal.woff2?url';
import bodyFont from '~/assets/fonts/manrope-latin-wght-normal.woff2?url';
import tailwindCss from './styles/tailwind.css?url';
import {PageLayout} from './components/layout/PageLayout';
import {getStorefrontData} from '~/lib/catalog/catalog.server';
import {
  ThirdPartyPixels,
  sanitizePixelConfig,
} from '~/components/analytics/ThirdPartyPixels';

export type RootLoader = typeof loader;

/** Root data is reused across navigations; any cart mutation revalidates it. */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  if (formMethod && formMethod !== 'GET') return true;
  if (currentUrl.toString() === nextUrl.toString()) return true;
  return false;
};

export function links() {
  return [
    {rel: 'preconnect', href: 'https://cdn.shopify.com'},
    {rel: 'preload', href: displayFont, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous'},
    {rel: 'preload', href: bodyFont, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous'},
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
}

export async function loader({context, request}: Route.LoaderArgs) {
  const {storefront, env, commerce} = context;
  const storefrontData = await getStorefrontData({storefront, env, request});

  const isFixture = storefrontData.isFixture;
  return {
    storefront: storefrontData,
    cart: commerce.cart.get(),
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shop: isFixture
      ? Promise.resolve(null)
      : getShopAnalytics({storefront, publicStorefrontId: env.PUBLIC_STOREFRONT_ID}),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      // Shopify's own consent banner; region rules are set in Shopify admin
      // (Settings > Customer privacy).
      withPrivacyBanner: !isFixture && env.PUBLIC_PRIVACY_BANNER !== 'false',
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
    pixels: sanitizePixelConfig({
      ga4: env.PUBLIC_GA4_MEASUREMENT_ID,
      googleAds: env.PUBLIC_GOOGLE_ADS_ID,
      googleAdsAddToCartLabel: env.PUBLIC_GOOGLE_ADS_ADD_TO_CART_LABEL,
      meta: env.PUBLIC_META_PIXEL_ID,
      tiktok: env.PUBLIC_TIKTOK_PIXEL_ID,
    }),
    siteUrl: env.PUBLIC_SITE_URL ?? new URL(request.url).origin,
  };
}

export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
        <meta name="theme-color" content="#0b0b0d" />
        <script
          nonce={nonce}
          suppressHydrationWarning
          // Marks JS availability so reveal effects never hide content without JS.
          dangerouslySetInnerHTML={{__html: "document.documentElement.classList.add('js')"}}
        />
        <link rel="stylesheet" href={tailwindCss}></link>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');
  if (!data) return <Outlet />;

  return (
    <Analytics.Provider
      cart={data.cart as unknown as React.ComponentProps<typeof Analytics.Provider>['cart']}
      shop={data.shop}
      consent={data.consent}
    >
      <PageLayout cart={data.cart} isFixture={data.storefront.isFixture}>
        <Outlet />
      </PageLayout>
      <ThirdPartyPixels config={data.pixels} />
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const notFound = status === 404;
  return (
    <main
      id="main"
      className="wrap grid min-h-[100svh] content-center gap-6 py-24"
    >
      <h1 className="display-xl max-w-[12ch]">
        {notFound ? 'Off the map.' : 'Something broke.'}
      </h1>
      <p className="lead">
        {notFound
          ? 'That page does not exist. The coffee does.'
          : 'We could not load this page. Please try again in a moment.'}
      </p>
      <p>
        <Link to="/" className="btn">
          Back to the roasts
        </Link>
      </p>
    </main>
  );
}
