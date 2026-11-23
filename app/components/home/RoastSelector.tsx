import {useAnalytics} from '@shopify/hydrogen';
import {useState} from 'react';
import {Link} from 'react-router';
import type {Product} from '~/lib/catalog/types';
import {ROAST_COPY} from '~/lib/brand';
import {canPurchase, defaultVariant} from '~/lib/variants';
import {AddToCartButton} from '~/components/cart/AddToCartButton';
import {Price} from '~/components/Price';
import {ProductImage} from '~/components/ProductImage';
import {ROAST_FIELD} from '~/components/product/RoastPanel';

type Choice = 'medium' | 'dark';

/** One question, two answers, an instant recommendation with a direct add. */
export function RoastSelector({medium, dark}: {medium: Product | null; dark: Product | null}) {
  const [choice, setChoice] = useState<Choice>('medium');
  const {publish, shop} = useAnalytics();
  if (!medium || !dark) return null;
  const product = choice === 'medium' ? medium : dark;
  const variant = defaultVariant(product);
  const purchasable = canPurchase(variant);
  const copy = ROAST_COPY[choice];

  return (
    <section aria-labelledby="selector-title" className="relative py-16 sm:py-24">
      <div className="wrap">
        <div
          className="relative isolate overflow-hidden rounded-[1.75rem] px-6 py-10 sm:px-10 lg:px-14 lg:py-14"
        >
          {/* Two stacked light fields crossfade (gradients cannot interpolate). */}
          {(['medium', 'dark'] as const).map((k) => (
            <div
              key={k}
              aria-hidden="true"
              className="absolute inset-0 -z-10 transition-opacity duration-700 ease-[var(--ease-in-out)]"
              style={{background: ROAST_FIELD[k], opacity: choice === k ? 1 : 0}}
            />
          ))}
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <h2 id="selector-title" className="display-l">
                How do you take your rebellion?
              </h2>
              <div
                role="radiogroup"
                aria-labelledby="selector-title"
                className="mt-8 grid gap-3 sm:grid-cols-2"
              >
                {(['medium', 'dark'] as const).map((key) => {
                  const active = key === choice;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      tabIndex={active ? 0 : -1}
                      onClick={() => {
                        setChoice(key);
                        publish('custom_select_item', {shop, roast: key});
                      }}
                      onKeyDown={(e) => {
                        if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) {
                          e.preventDefault();
                          const next = key === 'medium' ? 'dark' : 'medium';
                          setChoice(next);
                          (e.currentTarget.parentElement?.querySelector(
                            `[data-choice="${next}"]`,
                          ) as HTMLButtonElement | null)?.focus();
                        }
                      }}
                      data-choice={key}
                      className={`group flex min-h-20 items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition-[transform,background-color,border-color] duration-200 ease-[var(--ease-out)] active:scale-[0.98] ${
                        active
                          ? 'border-[var(--color-ivory)] bg-[color-mix(in_oklab,var(--color-ivory)_12%,transparent)]'
                          : 'border-[color-mix(in_oklab,var(--color-ivory)_22%,transparent)] hover:border-[color-mix(in_oklab,var(--color-ivory)_50%,transparent)]'
                      }`}
                    >
                      <span className="font-display text-[1.55rem] leading-tight">
                        {ROAST_COPY[key].choice}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`grid h-6 w-6 flex-none place-items-center rounded-full border ${active ? 'border-[var(--color-ivory)]' : 'border-[color-mix(in_oklab,var(--color-ivory)_35%,transparent)]'}`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full bg-[var(--color-ivory)] transition-transform duration-200 ease-[var(--ease-out)] ${active ? 'scale-100' : 'scale-0'}`}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5" aria-live="polite">
              <div key={choice} className="swap-enter flex items-center gap-6">
                <Link to={`/products/${product.handle}`} className="pouch w-28 flex-none sm:w-36" tabIndex={-1} aria-hidden="true">
                  <ProductImage image={product.featuredImage} sizes="9rem" alt="" />
                </Link>
                <div className="flex min-w-0 flex-col gap-2">
                  <p className="font-display text-3xl leading-none">{copy.name}</p>
                  <p className="text-[var(--text-muted)]">{copy.character}</p>
                  <p className="text-lg font-bold">
                    <Price money={variant?.price} />
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <AddToCartButton
                  lines={variant && purchasable ? [{variant, quantity: 1}] : []}
                  disabled={!purchasable}
                  className="btn btn--block"
                  testId="selector-add"
                >
                  {purchasable ? `Add ${copy.name} to cart` : 'Sold out'}
                </AddToCartButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
