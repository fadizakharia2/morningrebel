import type {Product} from '~/lib/catalog/types';
import {sumMoney} from '~/lib/money';
import {canPurchase, defaultVariant} from '~/lib/variants';
import {AddToCartButton} from '~/components/cart/AddToCartButton';
import {Price} from '~/components/Price';
import {ProductImage} from '~/components/ProductImage';

/**
 * THE REBEL DUO. If a Shopify bundle product is configured (DUO_PRODUCT_HANDLE)
 * it is sold as that product at its Shopify price. Otherwise "Add both" adds
 * one Medium and one Dark as two ordinary cart lines. Savings are shown only
 * when Shopify supplies a compare-at price; none are invented.
 */
export function DiscoveryDuo({
  medium,
  dark,
  duo,
  variant = 'section',
}: {
  medium: Product | null;
  dark: Product | null;
  duo: Product | null;
  variant?: 'section' | 'compact';
}) {
  if (!medium || !dark) return null;
  const mv = defaultVariant(medium);
  const dv = defaultVariant(dark);
  const duoVariant = duo ? defaultVariant(duo) : undefined;

  const bothAvailable = canPurchase(mv) && canPurchase(dv);
  const useBundle = Boolean(duoVariant);
  const purchasable = useBundle ? canPurchase(duoVariant) : bothAvailable;
  const total = useBundle
    ? duoVariant?.price
    : mv && dv
      ? sumMoney([mv.price, dv.price])
      : null;
  const compareAt = useBundle ? duoVariant?.compareAtPrice : null;

  const lines = useBundle
    ? duoVariant && purchasable
      ? [{variant: duoVariant, quantity: 1}]
      : []
    : mv && dv && purchasable
      ? [
          {variant: mv, quantity: 1},
          {variant: dv, quantity: 1},
        ]
      : [];

  const soldOutNote = !purchasable
    ? !canPurchase(mv)
      ? 'Medium Roast is sold out right now.'
      : !canPurchase(dv)
        ? 'Dark Roast is sold out right now.'
        : 'The Duo is sold out right now.'
    : null;

  const button = (
    <AddToCartButton
      lines={lines}
      disabled={!purchasable}
      className={variant === 'compact' ? 'btn btn--ghost btn--block' : 'btn btn--block sm:w-auto'}
      context="one Medium Roast and one Dark Roast"
      testId="duo-add"
    >
      {purchasable ? 'Add both to cart' : 'Duo unavailable'}
    </AddToCartButton>
  );

  if (variant === 'compact') {
    return (
      <aside
        aria-labelledby="duo-compact-title"
        className="rounded-2xl border hairline p-5"
        data-testid="duo-compact"
      >
        <div className="flex items-center gap-4">
          <div className="flex w-20 flex-none -space-x-6">
            <ProductImage image={medium.featuredImage} sizes="48px" alt="" className="w-12" />
            <ProductImage image={dark.featuredImage} sizes="48px" alt="" className="w-12" />
          </div>
          <div className="min-w-0">
            <h3 id="duo-compact-title" className="font-display text-xl leading-tight">
              Can’t choose? Take the Duo.
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              One Medium, one Dark{total ? <> · <Price money={total} compareAt={compareAt} /></> : null}
            </p>
          </div>
        </div>
        <div className="mt-4">{button}</div>
        {soldOutNote ? <p className="mt-2 text-sm text-[var(--text-soft)]">{soldOutNote}</p> : null}
      </aside>
    );
  }

  return (
    <section id="duo" aria-labelledby="duo-title" className="relative isolate overflow-hidden py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(70% 80% at 70% 50%, rgb(150 40 60 / 0.55), transparent 70%), linear-gradient(120deg, #3d101a 0%, #691e2b 55%, #3d101a 100%)',
        }}
      />
      <div className="wrap grid items-center gap-12 lg:grid-cols-12">
        <div className="relative order-2 mx-auto flex w-full max-w-[34rem] items-end justify-center lg:order-1 lg:col-span-6">
          <div className="pouch pouch--reflect relative z-10 w-[48%] -rotate-[4deg] translate-x-[6%]">
            <ProductImage image={medium.featuredImage} sizes="(min-width: 1024px) 16rem, 44vw" alt={medium.featuredImage?.altText ?? medium.title} />
          </div>
          <div className="pouch pouch--reflect relative z-20 w-[52%] rotate-[3deg] -translate-x-[6%]">
            <ProductImage image={dark.featuredImage} sizes="(min-width: 1024px) 17rem, 48vw" alt={dark.featuredImage?.altText ?? dark.title} />
          </div>
        </div>
        <div className="order-1 lg:order-2 lg:col-span-5 lg:col-start-8">
          <h2 id="duo-title" className="display-l">
            Why choose a side?
          </h2>
          <p className="lead mt-5 text-[#e3d6d2]">
            The Rebel Duo: one Medium Roast and one Dark Roast. The simplest way to learn which one owns your morning.
          </p>
          <dl className="mt-8 flex flex-col gap-2 text-[0.95rem]">
            {!useBundle ? (
              <>
                <div className="flex justify-between gap-6">
                  <dt>Medium Roast</dt>
                  <dd className="tabular font-semibold"><Price money={mv?.price} /></dd>
                </div>
                <div className="flex justify-between gap-6">
                  <dt>Dark Roast</dt>
                  <dd className="tabular font-semibold"><Price money={dv?.price} /></dd>
                </div>
              </>
            ) : null}
            {total ? (
              <div className="mt-2 flex items-baseline justify-between gap-6 border-t border-[rgb(238_233_223/0.25)] pt-4">
                <dt className="font-semibold">{useBundle ? 'The Duo' : 'Both together'}</dt>
                <dd className="text-2xl font-bold" data-testid="duo-total">
                  <Price money={total} compareAt={compareAt} />
                </dd>
              </div>
            ) : null}
          </dl>
          <div className="mt-8">{button}</div>
          {soldOutNote ? <p className="mt-3 text-sm">{soldOutNote}</p> : null}
        </div>
      </div>
    </section>
  );
}
