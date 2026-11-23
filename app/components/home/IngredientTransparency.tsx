import type {Product} from '~/lib/catalog/types';
import {ROAST_COPY} from '~/lib/brand';
import {useIsFixture} from '~/lib/use-storefront';
import {FactRow} from '~/components/product/Facts';

export function hasAnyFacts(product: Product | null) {
  if (!product) return false;
  const f = product.facts;
  return Boolean(
    f.ingredients || f.mushrooms.length || f.caffeine || f.coffeeOrigin || f.sourcing || f.testingUrl,
  );
}

export function FactList({product}: {product: Product}) {
  const f = product.facts;
  return (
    <dl>
      <FactRow label="Ingredients" value={f.ingredients} />
      <FactRow label="Mushrooms">
        {f.mushrooms.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {f.mushrooms.map((m) => (
              <li key={m.name} className="flex justify-between gap-4">
                <span>{m.name}</span>
                {m.amount ? <span className="tabular text-[var(--text-muted)]">{m.amount}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </FactRow>
      <FactRow label="Caffeine" value={f.caffeine} />
      <FactRow label="Coffee origin" value={f.coffeeOrigin} />
      <FactRow label="Sourcing" value={f.sourcing} />
      <FactRow label="Testing">
        {f.testingUrl ? (
          <a href={f.testingUrl} className="text-link" target="_blank" rel="noopener noreferrer">
            View lab documentation
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : null}
      </FactRow>
      <FactRow label="Net weight" value={f.netWeight} />
    </dl>
  );
}

/**
 * NOTHING TO HIDE. Every row is a Shopify metafield fed by verified supplier
 * data. In production the section disappears entirely until data exists.
 */
export function IngredientTransparency({medium, dark}: {medium: Product | null; dark: Product | null}) {
  const isFixture = useIsFixture();
  if (!isFixture && !hasAnyFacts(medium) && !hasAnyFacts(dark)) return null;
  const products = [medium, dark].filter((p): p is Product => Boolean(p));
  return (
    <section id="ingredients" aria-labelledby="ingredients-title" className="relative py-20 sm:py-28">
      <div className="wrap grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="ingredients-title" className="display-l lg:sticky" style={{top: 'calc(var(--header-h) + 2rem)'}}>
            Nothing to hide.
          </h2>
          <p className="lead mt-5">
            Every ingredient, amount and test result, as our supplier documents it. If it is not verified, it is not here.
          </p>
        </div>
        <div className="grid gap-10 sm:grid-cols-2 lg:col-span-8 lg:gap-8">
          {products.map((product) => (
            <div key={product.id} className="rounded-[1.25rem] bg-[var(--color-charcoal)] p-6 sm:p-8">
              <h3 className="mb-4 font-display text-2xl">
                {ROAST_COPY[product.key === 'dark' ? 'dark' : 'medium'].name}
              </h3>
              <FactList product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
