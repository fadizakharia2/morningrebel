import type {Product, Rating} from '~/lib/catalog/types';
import {ROAST_COPY} from '~/lib/brand';

/**
 * Only genuine data: the aggregate rating and count that a Shopify review app
 * writes to the standard `reviews.rating` / `reviews.rating_count` metafields.
 * With none, the launch state says so plainly. No quotes, names or numbers
 * are ever made up.
 */
export function ReviewSection({medium, dark}: {medium: Product | null; dark: Product | null}) {
  const rated = [medium, dark].filter((p): p is Product & {rating: Rating} => Boolean(p?.rating));
  return (
    <section id="reviews" aria-labelledby="reviews-title" className="relative py-20 sm:py-28">
      <div className="wrap grid gap-10 lg:grid-cols-12 lg:items-end">
        <h2 id="reviews-title" className="display-l lg:col-span-6">
          {rated.length > 0 ? 'The verdict so far.' : 'No reviews yet.'}
        </h2>
        {rated.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-6">
            {rated.map((product) => (
              <div key={product.id} className="rounded-[1.25rem] bg-[var(--color-charcoal)] p-6">
                <p className="font-display text-xl">{ROAST_COPY[product.key === 'dark' ? 'dark' : 'medium'].name}</p>
                <p className="mt-3 flex items-center gap-3">
                  <Stars value={product.rating.value} max={product.rating.scaleMax} />
                  <span className="tabular font-semibold">
                    {product.rating.value.toFixed(1)} / {product.rating.scaleMax}
                  </span>
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  From {product.rating.count} {product.rating.count === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="lead lg:col-span-5 lg:col-start-8" data-testid="reviews-launch">
            We are new, and we will not fake it. Reviews from real customers appear here once they have tried a bag.
          </p>
        )}
      </div>
    </section>
  );
}

function Stars({value, max}: {value: number; max: number}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <span className="relative inline-block text-lg leading-none tracking-[0.15em]" role="img" aria-label={`Rated ${value.toFixed(1)} out of ${max}`}>
      <span aria-hidden="true" className="text-[color-mix(in_oklab,var(--color-ivory)_25%,transparent)]">
        {'★'.repeat(Math.round(max))}
      </span>
      <span aria-hidden="true" className="absolute inset-0 overflow-hidden text-[var(--color-crema)]" style={{width: `${pct}%`}}>
        {'★'.repeat(Math.round(max))}
      </span>
    </span>
  );
}
