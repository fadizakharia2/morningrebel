import type {Money} from '~/lib/catalog/types';
import {formatMoney} from '~/lib/money';
import {useIsFixture} from '~/lib/use-storefront';

/**
 * Renders a Shopify price. In fixture mode there is no real price, so we say
 * so instead of printing a fake number.
 */
export function Price({
  money,
  compareAt,
  className,
}: {
  money?: Money | null;
  compareAt?: Money | null;
  className?: string;
}) {
  const isFixture = useIsFixture();
  if (!money) return null;
  if (isFixture) {
    return (
      <span className={`pending ${className ?? ''}`} data-testid="price">
        Price from Shopify
      </span>
    );
  }
  const onSale =
    compareAt && Number(compareAt.amount) > Number(money.amount)
      ? compareAt
      : null;
  return (
    <span className={`tabular ${className ?? ''}`} data-testid="price">
      {onSale ? (
        <>
          <span className="sr-only">Sale price </span>
          {formatMoney(money)}{' '}
          <s className="text-[0.85em] text-[var(--text-soft)]">
            <span className="sr-only">Regular price </span>
            {formatMoney(onSale)}
          </s>
        </>
      ) : (
        formatMoney(money)
      )}
    </span>
  );
}
