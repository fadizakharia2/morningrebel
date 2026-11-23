import {Link} from 'react-router';
import {useStorefront} from '~/lib/use-storefront';
import {NAV_ITEMS} from './nav';

export function Footer() {
  const {policies, shopName} = useStorefront();
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t hairline bg-[var(--color-obsidian)]">
      <div className="wrap grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-6">
          <p className="font-display text-[clamp(2rem,1.4rem+2.6vw,3.5rem)] uppercase leading-[0.95]">
            For the ritual.
            <br />
            Not the hype.
          </p>
        </div>
        <nav aria-label="Shop" className="md:col-span-3">
          <h2 className="label mb-4 font-sans">Shop</h2>
          <ul className="flex flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Policies" className="md:col-span-3">
          <h2 className="label mb-4 font-sans">Policies</h2>
          {policies.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {policies.map((policy) => (
                <li key={policy.handle}>
                  <Link to={`/policies/${policy.handle}`} className="text-link">
                    {policy.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--text-soft)]">
              Policies appear here once they are published in Shopify.
            </p>
          )}
        </nav>
      </div>
      <div className="wrap flex flex-col gap-2 border-t hairline py-6 text-sm text-[var(--text-soft)] sm:flex-row sm:justify-between">
        <p>
          © {year} {shopName}
        </p>
        <p>Checkout is processed securely by Shopify.</p>
      </div>
    </footer>
  );
}
