import type {Product} from '~/lib/catalog/types';
import {RoastPanel} from '~/components/product/RoastPanel';

/** The primary sales section: both roasts side by side, fully purchasable. */
export function ProductShowcase({medium, dark}: {medium: Product | null; dark: Product | null}) {
  return (
    <section id="roasts" aria-labelledby="roasts-title" className="relative py-16 sm:py-24">
      <div className="wrap">
        <div className="mb-10 flex flex-col gap-4 sm:mb-14 lg:flex-row lg:items-end lg:justify-between">
          <h2 id="roasts-title" className="display-l">
            Two roasts.
            <br />
            One ritual.
          </h2>
          <p className="lead lg:text-right">
            Same rebellion, two temperaments. Compare them here and add the one that fits your morning.
          </p>
        </div>
        <div className="relative grid gap-5 lg:grid-cols-2 lg:gap-6">
          {medium ? <RoastPanel product={medium} /> : <MissingProduct name="Medium Roast" />}
          {dark ? <RoastPanel product={dark} /> : <MissingProduct name="Dark Roast" />}
        </div>
      </div>
    </section>
  );
}

function MissingProduct({name}: {name: string}) {
  return (
    <div className="grid min-h-64 place-items-center rounded-[1.75rem] border border-dashed hairline p-8 text-center">
      <p className="text-[var(--text-muted)]">
        {name} is not available right now. Please check back soon.
      </p>
    </div>
  );
}
