import {Link} from 'react-router';
import {useAnalytics} from '@shopify/hydrogen';
import type {Product} from '~/lib/catalog/types';
import {ROAST_COPY} from '~/lib/brand';
import {canPurchase, useVariantSelection} from '~/lib/variants';
import {AddToCartButton} from '~/components/cart/AddToCartButton';
import {Price} from '~/components/Price';
import {ProductImage} from '~/components/ProductImage';
import {VariantPicker} from './VariantPicker';
import {FactRow, TastingNotes} from './Facts';

export const ROAST_FIELD: Record<'medium' | 'dark', string> = {
  medium:
    'radial-gradient(90% 70% at 30% 20%, rgb(140 92 62 / 0.38), transparent 70%), linear-gradient(160deg, #3a281f 0%, #24180f 55%, #160f0b 100%)',
  dark:
    'radial-gradient(90% 70% at 70% 20%, rgb(140 38 56 / 0.42), transparent 70%), linear-gradient(200deg, #43121d 0%, #250a11 55%, #120609 100%)',
};

export function Availability({available}: {available: boolean}) {
  return (
    <span
      className="inline-flex items-center gap-2 text-sm font-semibold"
      data-testid="availability"
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${available ? 'bg-[#8fbf8a]' : 'bg-[var(--color-ember)]'}`}
      />
      {available ? 'In stock' : 'Sold out'}
    </span>
  );
}

/** One roast, everything needed to buy it, without leaving the page. */
export function RoastPanel({product, headingLevel = 3}: {product: Product; headingLevel?: 2 | 3}) {
  const key = product.key === 'dark' ? 'dark' : 'medium';
  const copy = ROAST_COPY[key];
  const {selected, select, variant} = useVariantSelection(product);
  const {publish, shop} = useAnalytics();
  const purchasable = canPurchase(variant);
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <article
      className="relative flex flex-col overflow-hidden rounded-[1.75rem] p-6 sm:p-8 lg:p-10"
      style={{background: ROAST_FIELD[key]}}
      aria-labelledby={`${product.handle}-name`}
      data-testid={`panel-${key}`}
    >
      <div className="grid gap-6 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:items-center lg:gap-8">
        <Link
          to={`/products/${product.handle}`}
          className="pouch pouch--reflect mx-auto block w-[min(70%,15rem)] transition-transform duration-500 ease-[var(--ease-out)] hover:-translate-y-1 sm:w-full"
          tabIndex={-1}
          aria-hidden="true"
        >
          <ProductImage
            image={variant?.image ?? product.featuredImage}
            sizes="(min-width: 1024px) 18rem, (min-width: 640px) 30vw, 60vw"
            alt=""
          />
        </Link>

        <div className="flex flex-col gap-4">
          <div>
            <Heading id={`${product.handle}-name`} className="font-display text-[clamp(2rem,1.5rem+1.4vw,2.75rem)] leading-none whitespace-nowrap">
              {copy.name}
            </Heading>
            <p className="mt-3 max-w-[34ch] text-[var(--text-muted)]">
              {product.description || copy.line}
            </p>
          </div>
          <TastingNotes notes={product.facts.tastingNotes} />
        </div>
      </div>

      <dl className="mt-6">
        <FactRow label="Caffeine" value={product.facts.caffeine} />
        <FactRow
          label="Mushrooms"
          value={product.facts.mushrooms.map((m) => m.name).join(', ') || undefined}
        />
      </dl>

      <div className="mt-auto flex flex-col gap-5 pt-6">
        <VariantPicker
          product={product}
          selected={selected}
          onSelect={(name, value) => {
            select(name, value);
            publish('custom_select_item', {shop, product: {id: product.id, title: product.title, option: name, value}});
          }}
          compact
        />
        <div className="flex items-center justify-between gap-4">
          <p className="text-2xl font-bold">
            <Price money={variant?.price} compareAt={variant?.compareAtPrice} />
          </p>
          <Availability available={purchasable} />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <AddToCartButton
            lines={variant && purchasable ? [{variant, quantity: 1}] : []}
            disabled={!purchasable}
            className="btn btn--block"
            context={copy.name}
            testId={`add-${key}`}
          >
            {purchasable ? 'Add to cart' : 'Sold out'}
          </AddToCartButton>
          <Link to={`/products/${product.handle}`} className="btn btn--ghost">
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
