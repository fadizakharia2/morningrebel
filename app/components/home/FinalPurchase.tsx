import {Link} from 'react-router';
import type {Product} from '~/lib/catalog/types';
import {ROAST_COPY} from '~/lib/brand';
import {canPurchase, useVariantSelection} from '~/lib/variants';
import {AddToCartButton} from '~/components/cart/AddToCartButton';
import {Price} from '~/components/Price';
import {ProductImage} from '~/components/ProductImage';
import {VariantPicker} from '~/components/product/VariantPicker';
import {DiscoveryDuo} from './DiscoveryDuo';

export function FinalPurchase({
  medium,
  dark,
  duo,
}: {
  medium: Product | null;
  dark: Product | null;
  duo: Product | null;
}) {
  return (
    <section aria-labelledby="final-title" className="relative isolate overflow-hidden py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(50% 60% at 15% 100%, rgb(120 76 50 / 0.35), transparent 70%), radial-gradient(50% 60% at 85% 100%, rgb(105 30 43 / 0.45), transparent 70%), #0b0b0d',
        }}
      />
      <div className="wrap">
        <h2 id="final-title" className="display-xl text-center">
          Break the ordinary.
        </h2>
        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2 lg:mt-16">
          {medium ? <BuyRow product={medium} /> : null}
          {dark ? <BuyRow product={dark} /> : null}
        </div>
        <div className="mx-auto mt-4 max-w-5xl">
          <DiscoveryDuo medium={medium} dark={dark} duo={duo} variant="compact" />
        </div>
      </div>
    </section>
  );
}

function BuyRow({product}: {product: Product}) {
  const key = product.key === 'dark' ? 'dark' : 'medium';
  const {selected, select, variant} = useVariantSelection(product);
  const purchasable = canPurchase(variant);
  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-[color-mix(in_oklab,var(--color-charcoal)_85%,transparent)] p-5 backdrop-blur-sm sm:p-6">
      <div className="flex items-center gap-5">
        <Link to={`/products/${product.handle}`} className="pouch w-20 flex-none" tabIndex={-1} aria-hidden="true">
          <ProductImage image={product.featuredImage} sizes="80px" alt="" />
        </Link>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-2xl leading-tight">
            <Link to={`/products/${product.handle}`}>{ROAST_COPY[key].name}</Link>
          </h3>
          <p className="text-sm text-[var(--text-muted)]">{ROAST_COPY[key].character}</p>
        </div>
        <p className="text-lg font-bold">
          <Price money={variant?.price} />
        </p>
      </div>
      <VariantPicker product={product} selected={selected} onSelect={select} compact />
      <AddToCartButton
        lines={variant && purchasable ? [{variant, quantity: 1}] : []}
        disabled={!purchasable}
        className="btn btn--block"
        context={ROAST_COPY[key].name}
      >
        {purchasable ? 'Add to cart' : 'Sold out'}
      </AddToCartButton>
    </div>
  );
}
