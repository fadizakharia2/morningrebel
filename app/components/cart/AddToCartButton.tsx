import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {useEffect, useRef, useState} from 'react';
import type {FetcherWithComponents} from 'react-router';
import type {Variant} from '~/lib/catalog/types';
import {readAttribution} from '~/lib/attribution';
import {useCartUI} from './CartUIContext';

export interface CartActionData {
  ok: boolean;
  errors?: string[];
}

type Line = {variant: Variant; quantity: number};

/**
 * Adds one or more Shopify variants via the Cart API (`/cart` action).
 * Shows Adding… / Added feedback in place, opens the drawer on success and
 * announces the result. Nothing is ever added without this explicit press.
 */
export function AddToCartButton({
  lines,
  disabled,
  children,
  className = 'btn',
  context,
  openDrawer = true,
  testId,
}: {
  lines: Line[];
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  /**
   * What the button adds, read after the visible text so the spoken name
   * starts with what sighted users see (WCAG 2.5.3), e.g. "Add to cart, Medium Roast".
   */
  context?: string;
  openDrawer?: boolean;
  testId?: string;
}) {
  const inputs: OptimisticCartLineInput[] = lines.map(({variant, quantity}) => ({
    merchandiseId: variant.id,
    quantity,
    selectedVariant: variant,
  }));
  return (
    <CartForm route="/cart" action={CartForm.ACTIONS.LinesAdd} inputs={{lines: inputs}}>
      {(fetcher) => (
        <AddButtonInner
          fetcher={fetcher as FetcherWithComponents<CartActionData>}
          disabled={disabled || lines.length === 0}
          className={className}
          context={context}
          openDrawer={openDrawer}
          testId={testId}
          names={lines.map((l) => l.variant.product.title)}
        >
          {children}
        </AddButtonInner>
      )}
    </CartForm>
  );
}

function AddButtonInner({
  fetcher,
  disabled,
  children,
  className,
  context,
  openDrawer,
  names,
  testId,
}: {
  fetcher: FetcherWithComponents<CartActionData>;
  disabled?: boolean;
  children: React.ReactNode;
  className: string;
  context?: string;
  openDrawer: boolean;
  names: string[];
  testId?: string;
}) {
  const {open, announce, notifyAdded} = useCartUI();
  const [phase, setPhase] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [attribution, setAttribution] = useState('');
  const wasBusy = useRef(false);

  useEffect(() => setAttribution(readAttribution()), []);

  useEffect(() => {
    if (fetcher.state !== 'idle') {
      wasBusy.current = true;
      setPhase('busy');
      setError(null);
      return;
    }
    if (!wasBusy.current) return;
    wasBusy.current = false;
    const data = fetcher.data;
    if (!data || !data.ok) {
      const message = data?.errors?.[0] ?? 'We could not add that. Please try again.';
      setError(message);
      announce(message);
      setPhase('idle');
      return;
    }
    setPhase('done');
    notifyAdded();
    announce(`Added ${names.join(' and ')} to your cart.`);
    if (openDrawer) open();
    const t = setTimeout(() => setPhase('idle'), 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  return (
    <>
      <input type="hidden" name="attribution" value={attribution} />
      <button
        type="submit"
        className={className}
        disabled={disabled || phase === 'busy'}
        data-state={phase}
        data-testid={testId}
      >
        <span className="btn__content" key={phase}>
          {phase === 'busy' ? (
            'Adding…'
          ) : phase === 'done' ? (
            <>
              <CheckIcon /> Added
            </>
          ) : (
            children
          )}
        </span>
        {context ? <span className="sr-only">, {context}</span> : null}
      </button>
      {error ? (
        <p role="alert" className="mt-3 text-sm font-semibold text-[var(--color-ember)]">
          {error}
        </p>
      ) : null}
    </>
  );
}

export function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
      <path
        d="M3 8.5l3.2 3L13 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
