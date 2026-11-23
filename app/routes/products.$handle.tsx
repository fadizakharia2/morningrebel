import {Analytics, useAnalytics} from '@shopify/hydrogen';
import {useEffect, useRef, useState} from 'react';
import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/products.$handle';
import {getStorefrontData} from '~/lib/catalog/catalog.server';
import type {Product, Variant} from '~/lib/catalog/types';
import {ROAST_COPY} from '~/lib/brand';
import {absoluteUrl, breadcrumbJsonLd, pageMeta, productJsonLd, SITE_NAME} from '~/lib/seo';
import {canPurchase, useVariantSelection} from '~/lib/variants';
import {useStorefront} from '~/lib/use-storefront';
import {AddToCartButton} from '~/components/cart/AddToCartButton';
import {Price} from '~/components/Price';
import {ProductImage} from '~/components/ProductImage';
import {ProductGallery} from '~/components/product/ProductGallery';
import {QuantityStepper} from '~/components/product/QuantityStepper';
import {VariantPicker} from '~/components/product/VariantPicker';
import {Availability, ROAST_FIELD} from '~/components/product/RoastPanel';
import {Pending, TastingNotes} from '~/components/product/Facts';
import {FactList} from '~/components/home/IngredientTransparency';
import {DiscoveryDuo} from '~/components/home/DiscoveryDuo';

export async function loader({context, params, request}: Route.LoaderArgs) {
  const handle = params.handle ?? '';
  const data = await getStorefrontData({
    storefront: context.storefront,
    env: context.env,
    request,
  });
  const product = [data.medium, data.dark].find((p) => p?.handle === handle);
  if (!product) throw new Response('Not found', {status: 404});

  const url = new URL(request.url);
  const variantParam = url.searchParams.get('variant');
  const initialVariantId =
    variantParam && /^\d{1,20}$/.test(variantParam)
      ? `gid://shopify/ProductVariant/${variantParam}`
      : null;

  const siteUrl = context.env.PUBLIC_SITE_URL ?? url.origin;
  return {
    handle: product.handle,
    initialVariantId,
    canonical: absoluteUrl(siteUrl, `/products/${product.handle}`),
    home: absoluteUrl(siteUrl, '/'),
    // Only the data meta() needs; components read the shared root catalog.
    seo: {
      title: product.seo.title || `${product.title} | Mushroom Coffee | ${SITE_NAME}`,
      description:
        product.seo.description ||
        product.description ||
        `${ROAST_COPY[product.key === 'dark' ? 'dark' : 'medium'].line} Premium mushroom coffee from ${SITE_NAME}.`,
      image: product.featuredImage?.url ?? null,
      jsonLd: data.isFixture ? null : productJsonLd(product, absoluteUrl(siteUrl, `/products/${product.handle}`), product.variants),
      name: ROAST_COPY[product.key === 'dark' ? 'dark' : 'medium'].name,
      isFixture: data.isFixture,
    },
  };
}

export const meta: Route.MetaFunction = ({data}) => {
  if (!data) return [{title: `Not found | ${SITE_NAME}`}];
  const {seo, canonical, home} = data;
  const tags = pageMeta({
    title: seo.title,
    description: seo.description.slice(0, 160),
    url: canonical,
    image: seo.image?.startsWith('https://') ? seo.image : null,
    type: 'product',
    noindex: seo.isFixture,
  });
  if (seo.jsonLd) tags.push({'script:ld+json': seo.jsonLd});
  tags.push({
    'script:ld+json': breadcrumbJsonLd([
      {name: SITE_NAME, url: home},
      {name: 'Roasts', url: `${home}#roasts`},
      {name: seo.name, url: canonical},
    ]),
  });
  return tags;
};

export default function ProductPage() {
  const {handle, initialVariantId} = useLoaderData<typeof loader>();
  const {medium, dark, duo, policies} = useStorefront();
  const product = [medium, dark].find((p) => p?.handle === handle);
  if (!product) return null;
  // Remount on product change so selection state resets.
  return (
    <ProductView
      key={product.handle}
      product={product}
      other={product.key === 'dark' ? medium : dark}
      initialVariantId={initialVariantId}
      medium={medium}
      dark={dark}
      duo={duo}
      policies={policies}
    />
  );
}

function ProductView({
  product,
  other,
  initialVariantId,
  medium,
  dark,
  duo,
  policies,
}: {
  product: Product;
  other: Product | null;
  initialVariantId: string | null;
  medium: Product | null;
  dark: Product | null;
  duo: Product | null;
  policies: ReturnType<typeof useStorefront>['policies'];
}) {
  const key = product.key === 'dark' ? 'dark' : 'medium';
  const copy = ROAST_COPY[key];
  const {selected, select, variant} = useVariantSelection(product, initialVariantId);
  const [quantity, setQuantity] = useState(1);
  const purchasable = canPurchase(variant);
  const {publish, shop} = useAnalytics();
  const ctaRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);

  // Keep the URL shareable for the selected variant without a navigation.
  useEffect(() => {
    if (!variant) return;
    const url = new URL(window.location.href);
    const id = variant.id.split('/').pop();
    if (id && url.searchParams.get('variant') !== id && product.variants.length > 1) {
      url.searchParams.set('variant', id);
      window.history.replaceState(window.history.state, '', url);
    }
  }, [variant, product.variants.length]);

  // Mobile sticky bar appears only once the main button scrolls away.
  useEffect(() => {
    const node = ctaRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => {
      setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const shipping = policies.find((p) => p.handle === 'shipping-policy');
  const refund = policies.find((p) => p.handle === 'refund-policy');

  return (
    <main id="main" style={{paddingTop: 'calc(var(--header-h) + 1.5rem)'}}>
      <div className="wrap">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--text-soft)]">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/" className="text-link">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/#roasts" className="text-link">Roasts</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[var(--text-muted)]">{copy.name}</li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <ProductGallery
              images={product.images}
              activeImage={variant?.image}
              title={product.title}
              field={ROAST_FIELD[key]}
            />
          </div>

          <div className="lg:col-span-5">
            <div className="flex flex-col gap-6 lg:sticky" style={{top: 'calc(var(--header-h) + 1.5rem)'}}>
              <div>
                <h1 className="display-l">
                  <span className="sr-only">Morning Rebel </span>
                  {copy.name}
                </h1>
                <p className="mt-4 text-lg text-[var(--text-muted)]">{product.description || copy.line}</p>
                {product.facts.roastSummary ? (
                  <p className="mt-3 max-w-[48ch] text-[var(--text-muted)]" data-testid="roast-summary">
                    {product.facts.roastSummary}
                  </p>
                ) : null}
              </div>
              <TastingNotes notes={product.facts.tastingNotes} />

              <div className="flex items-center justify-between gap-4 border-y hairline py-4">
                <p className="text-3xl font-bold" data-testid="pdp-price">
                  <Price money={variant?.price} compareAt={variant?.compareAtPrice} />
                </p>
                <Availability available={purchasable} />
              </div>

              <VariantPicker
                product={product}
                selected={selected}
                onSelect={(name, value) => {
                  select(name, value);
                  publish('custom_select_item', {shop, product: {id: product.id, option: name, value}});
                }}
              />

              <div ref={ctaRef} className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <QuantityStepper value={quantity} onChange={setQuantity} label={`Quantity of ${copy.name}`} />
                <div className="flex-1">
                  <AddToCartButton
                    lines={variant && purchasable ? [{variant, quantity}] : []}
                    disabled={!purchasable}
                    className="btn btn--block"
                    context={purchasable ? `${quantity} × ${copy.name}` : copy.name}
                    testId="pdp-add"
                  >
                    {purchasable ? 'Add to cart' : 'Sold out'}
                  </AddToCartButton>
                </div>
              </div>
              <p className="text-sm text-[var(--text-soft)]">
                Secure checkout by Shopify. Shipping and taxes calculated at checkout.
              </p>

              <DiscoveryDuo medium={medium} dark={dark} duo={duo} variant="compact" />
            </div>
          </div>
        </div>
      </div>

      <div className="wrap mt-20 grid gap-10 pb-24 lg:mt-28 lg:grid-cols-12">
        <section aria-labelledby="pdp-ingredients" className="lg:col-span-7">
          <h2 id="pdp-ingredients" className="display-m mb-6">Nothing to hide.</h2>
          <div className="rounded-[1.25rem] bg-[var(--color-charcoal)] p-6 sm:p-8">
            <FactList product={product} />
            {!product.facts.ingredients && product.facts.mushrooms.length === 0 ? (
              <ProductionNoFacts />
            ) : null}
          </div>
        </section>

        <div className="flex flex-col gap-10 lg:col-span-5">
          <section aria-labelledby="pdp-brew">
            <h2 id="pdp-brew" className="display-m mb-6">The ritual.</h2>
            {product.facts.brewingSteps.length > 0 ? (
              <ol className="flex flex-col gap-4">
                {product.facts.brewingSteps.map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <span aria-hidden="true" className="font-display text-xl italic text-[var(--text-soft)]">{['i.', 'ii.', 'iii.', 'iv.', 'v.'][i] ?? `${i + 1}.`}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <BrewFallback />
            )}
          </section>

          <section aria-labelledby="pdp-shipping">
            <h2 id="pdp-shipping" className="display-m mb-6">Shipping &amp; returns.</h2>
            <p className="text-[var(--text-muted)]">
              Shipping options and costs are shown at checkout before you pay.
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {shipping ? (
                <li><Link to={`/policies/${shipping.handle}`} className="text-link">{shipping.title}</Link></li>
              ) : null}
              {refund ? (
                <li><Link to={`/policies/${refund.handle}`} className="text-link">{refund.title}</Link></li>
              ) : null}
              {!shipping && !refund ? (
                <li><Pending label="Store policies: publish them in Shopify admin" /></li>
              ) : null}
            </ul>
          </section>
        </div>
      </div>

      {other ? <CrossSellBand product={other} /> : null}

      <StickyPurchaseBar
        visible={showBar}
        name={copy.name}
        variant={variant}
        quantity={quantity}
        purchasable={purchasable}
      />

      {variant ? (
        <Analytics.ProductView
          data={{
            products: [
              {
                id: product.id,
                title: product.title,
                price: variant.price.amount,
                vendor: product.vendor,
                variantId: variant.id,
                variantTitle: variant.title,
                quantity: 1,
              },
            ],
          }}
        />
      ) : null}
    </main>
  );
}

function ProductionNoFacts() {
  const {isFixture} = useStorefront();
  if (isFixture) return null;
  return (
    <p className="text-[var(--text-muted)]">
      Full ingredient details are printed on the bag.
    </p>
  );
}

function BrewFallback() {
  const {isFixture} = useStorefront();
  return isFixture ? (
    <Pending label="Brewing instructions: awaiting verified supplier data" />
  ) : (
    <p className="text-[var(--text-muted)]">Brewing instructions are printed on the bag.</p>
  );
}

function CrossSellBand({product}: {product: Product}) {
  const key = product.key === 'dark' ? 'dark' : 'medium';
  const copy = ROAST_COPY[key];
  return (
    <section aria-labelledby="other-roast" className="relative overflow-hidden" style={{background: ROAST_FIELD[key]}}>
      <div className="wrap grid items-center gap-8 py-16 sm:grid-cols-[auto_1fr_auto] sm:py-20">
        <Link to={`/products/${product.handle}`} className="pouch mx-auto w-36 sm:w-40" tabIndex={-1} aria-hidden="true">
          <ProductImage image={product.featuredImage} sizes="10rem" alt="" />
        </Link>
        <div>
          <h2 id="other-roast" className="display-m">The other side: {copy.name}.</h2>
          <p className="mt-3 text-[var(--text-muted)]">{copy.character}</p>
        </div>
        <Link to={`/products/${product.handle}`} className="btn btn--ghost">
          View {copy.name}
        </Link>
      </div>
    </section>
  );
}

function StickyPurchaseBar({
  visible,
  name,
  variant,
  quantity,
  purchasable,
}: {
  visible: boolean;
  name: string;
  variant?: Variant;
  quantity: number;
  purchasable: boolean;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Hidden bar must not be reachable by keyboard or screen readers.
    if (barRef.current) barRef.current.inert = !visible;
  }, [visible]);
  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 bottom-0 z-30 border-t hairline bg-[color-mix(in_oklab,var(--color-charcoal)_92%,transparent)] backdrop-blur-md transition-transform duration-300 ease-[var(--ease-out)] lg:hidden"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(110%)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-hidden={!visible}
      data-testid="sticky-bar"
    >
      <div className="wrap flex items-center gap-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg leading-tight">{name}</p>
          <p className="text-sm text-[var(--text-muted)]">
            <Price money={variant?.price} />
          </p>
        </div>
        <AddToCartButton
          lines={variant && purchasable ? [{variant, quantity}] : []}
          disabled={!purchasable}
          className="btn btn--sm"
          context={name}
        >
          {purchasable ? 'Add to cart' : 'Sold out'}
        </AddToCartButton>
      </div>
    </div>
  );
}
