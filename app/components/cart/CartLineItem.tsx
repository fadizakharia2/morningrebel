import {CartForm} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {CartLine} from '~/lib/cart/cart-types';
import {MAX_LINE_QUANTITY} from '~/lib/cart/validation';
import {multiplyMoney} from '~/lib/money';
import {Price} from '~/components/Price';
import {ProductImage} from '~/components/ProductImage';

export function shortName(title: string) {
  return title.replace(/^Morning Rebel\s*[—-]\s*/, '');
}

export function CartLineItem({line}: {line: CartLine}) {
  const {id, quantity, merchandise, isOptimistic} = line;
  const options = merchandise.selectedOptions.filter(
    (o) => o.value !== 'Default Title' && o.value !== 'Standard',
  );
  const name = shortName(merchandise.product.title);

  return (
    <li
      className="swap-enter flex gap-4 py-5"
      data-testid="cart-line"
      data-optimistic={isOptimistic ? 'true' : undefined}
    >
      <Link
        to={`/products/${merchandise.product.handle}`}
        className="w-20 flex-none overflow-hidden rounded-lg bg-[var(--color-graphite)]"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductImage image={merchandise.image} sizes="80px" alt="" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={`/products/${merchandise.product.handle}`}
              className="font-display text-lg leading-tight"
            >
              {name}
            </Link>
            {options.length > 0 ? (
              <p className="text-sm text-[var(--text-soft)]">
                {options.map((o) => `${o.name}: ${o.value}`).join(' · ')}
              </p>
            ) : null}
          </div>
          <p className="font-semibold" data-testid="line-total">
            {/* Optimistic lines have no Shopify cost yet; show unit price × qty until it lands. */}
            <Price money={line.cost?.totalAmount ?? multiplyMoney(merchandise.price, quantity)} />
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div className="stepper" role="group" aria-label={`Quantity of ${name}`}>
            <QuantityButton
              lineId={id}
              quantity={quantity - 1}
              disabled={quantity <= 1 || isOptimistic}
              label={`Decrease quantity of ${name}`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </QuantityButton>
            <output aria-live="polite" aria-label={`Quantity ${quantity}`} data-testid="line-qty">
              {quantity}
            </output>
            <QuantityButton
              lineId={id}
              quantity={quantity + 1}
              disabled={quantity >= MAX_LINE_QUANTITY || isOptimistic}
              label={`Increase quantity of ${name}`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </QuantityButton>
          </div>
          <CartForm
            route="/cart"
            action={CartForm.ACTIONS.LinesRemove}
            inputs={{lineIds: [id]}}
          >
            <button
              type="submit"
              className="text-link text-sm text-[var(--text-muted)] disabled:opacity-50"
              disabled={isOptimistic}
              aria-label={`Remove ${name} from cart`}
            >
              Remove
            </button>
          </CartForm>
        </div>
      </div>
    </li>
  );
}

function QuantityButton({
  lineId,
  quantity,
  disabled,
  label,
  children,
}: {
  lineId: string;
  quantity: number;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines: [{id: lineId, quantity}]}}
    >
      <button type="submit" disabled={disabled} aria-label={label}>
        {children}
      </button>
    </CartForm>
  );
}
