import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {Suspense, useEffect, useRef} from 'react';
import {Await, Link} from 'react-router';
import type {Cart} from '~/lib/cart/cart-types';
import {getCrossSell} from '~/lib/cart/cross-sell';
import type {Product} from '~/lib/catalog/types';
import {defaultVariant} from '~/lib/variants';
import {useStorefront} from '~/lib/use-storefront';
import {Price} from '~/components/Price';
import {ProductImage} from '~/components/ProductImage';
import {AddToCartButton} from './AddToCartButton';
import {CartLineItem} from './CartLineItem';
import {useCartUI} from './CartUIContext';

export function CartDrawer({cart}: {cart: Promise<Cart | null> | Cart | null}) {
  const {isOpen, close} = useCartUI();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    // Backdrop click is a pointer shortcut only; keyboard users close with
    // Escape (native <dialog> cancel) or the Close button.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="cart-title"
      onClose={close}
      onClick={(event) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (event.target === event.currentTarget) close();
      }}
      data-testid="cart-drawer"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 id="cart-title" className="font-display text-[1.75rem] leading-none">
            Your cart
          </h2>
          <button
            type="button"
            className="icon-btn -mr-2"
            onClick={close}
            aria-label="Close cart"
            // Inside a modal <dialog>, autofocus is how the HTML spec sets initial focus.
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <Suspense fallback={<p className="px-6 text-[var(--text-muted)]">Loading your cart…</p>}>
          <Await
            resolve={cart}
            errorElement={
              <p role="alert" className="px-6">
                Your cart could not be loaded. Refresh the page to try again.
              </p>
            }
          >
            {(resolved) => <CartContents cart={resolved} layout="drawer" />}
          </Await>
        </Suspense>
      </div>
    </dialog>
  );
}

function isSafeCheckoutUrl(url: string | undefined, isFixture: boolean) {
  if (!url) return false;
  if (isFixture) return url === '/dev/checkout';
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

export function CartContents({
  cart: originalCart,
  layout,
}: {
  cart: Cart | null;
  layout: 'drawer' | 'page';
}) {
  const cart = useOptimisticCart(originalCart) as unknown as Cart | null;
  const {medium, dark, isFixture} = useStorefront();
  const {publish, shop} = useAnalytics();
  const lines = cart?.lines?.nodes ?? [];
  const count = cart?.totalQuantity ?? 0;
  const crossSell = getCrossSell(lines, medium, dark);
  const pad = layout === 'drawer' ? 'px-6' : '';

  if (lines.length === 0) {
    return (
      <div className={`${pad} flex flex-1 flex-col gap-6 pb-8`} data-testid="cart-empty">
        <p className="text-[var(--text-muted)]">Your cart is empty. Pick your roast.</p>
        <div className="flex flex-col gap-3">
          {[medium, dark].map((p) => (p ? <QuickAddRow key={p.id} product={p} /> : null))}
        </div>
      </div>
    );
  }

  const checkoutUrl = cart?.checkoutUrl;
  const canCheckout = isSafeCheckoutUrl(checkoutUrl, isFixture) && !cart?.isOptimistic;

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${layout === 'page' ? 'gap-8' : ''}`}>
      <p className={`${pad} label`} aria-live="polite">
        {count} {count === 1 ? 'bag' : 'bags'}
      </p>
      <ul
        className={`${pad} ${layout === 'drawer' ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain' : ''} divide-y divide-[color-mix(in_oklab,var(--color-ivory)_10%,transparent)]`}
        aria-label="Cart items"
      >
        {lines.map((line) => (
          <CartLineItem key={line.id} line={line} />
        ))}
      </ul>

      <footer className={`${pad} border-t hairline pt-5 pb-6`} style={{paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))'}}>
        {crossSell ? (
          // Held until the pending change lands: two adds racing on a brand-new
          // cart would each create their own cart and one line would be lost.
          <CrossSell product={crossSell} pending={Boolean(cart?.isOptimistic)} />
        ) : null}
        <dl className="flex items-baseline justify-between">
          <dt className="font-semibold">Subtotal</dt>
          <dd className="text-lg font-bold" data-testid="cart-subtotal">
            <Price money={cart?.cost?.subtotalAmount} />
          </dd>
        </dl>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          Shipping and taxes are calculated at checkout.
        </p>
        {canCheckout ? (
          <a
            href={checkoutUrl}
            className="btn btn--blood btn--block mt-5"
            data-testid="checkout"
            onClick={() =>
              publish('custom_begin_checkout', {cart: originalCart, shop})
            }
          >
            <span className="btn__content">
              Checkout
              <LockIcon />
            </span>
          </a>
        ) : (
          <button type="button" className="btn btn--blood btn--block mt-5" disabled>
            Updating cart…
          </button>
        )}
        <p className="mt-3 text-center text-xs text-[var(--text-soft)]">
          Secure checkout by Shopify
        </p>
      </footer>
    </div>
  );
}

function CrossSell({product, pending}: {product: Product; pending: boolean}) {
  const variant = defaultVariant(product);
  if (!variant) return null;
  const name = product.key === 'dark' ? 'Dark Roast' : 'Medium Roast';
  return (
    <section
      aria-label="Complete the ritual"
      className="mb-5 flex items-center gap-4 rounded-xl bg-[color-mix(in_oklab,var(--color-ivory)_5%,transparent)] p-3"
      data-testid="cross-sell"
    >
      <div className="w-14 flex-none">
        <ProductImage image={product.featuredImage} sizes="56px" alt="" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Try the {name} too</p>
        <p className="text-sm text-[var(--text-muted)]">
          <Price money={variant.price} />
        </p>
      </div>
      <AddToCartButton
        lines={[{variant, quantity: 1}]}
        disabled={!variant.availableForSale || pending}
        className="btn btn--ghost btn--sm"
        context={name}
        openDrawer={false}
      >
        {variant.availableForSale ? 'Add' : 'Sold out'}
      </AddToCartButton>
    </section>
  );
}

function QuickAddRow({product}: {product: Product}) {
  const variant = defaultVariant(product);
  if (!variant) return null;
  const name = product.title.replace(/^Morning Rebel\s*[—-]\s*/, '');
  return (
    <div className="flex items-center gap-4">
      <Link
        to={`/products/${product.handle}`}
        className="w-16 flex-none"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductImage image={product.featuredImage} sizes="64px" alt="" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/products/${product.handle}`} className="font-display text-lg leading-tight">
          {name}
        </Link>
        <p className="text-sm text-[var(--text-muted)]">
          <Price money={variant.price} />
        </p>
      </div>
      <AddToCartButton
        lines={[{variant, quantity: 1}]}
        disabled={!variant.availableForSale}
        className="btn btn--ghost btn--sm"
        context={name}
        openDrawer={false}
      >
        {variant.availableForSale ? 'Add' : 'Sold out'}
      </AddToCartButton>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none">
      <rect x="2.5" y="6" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
