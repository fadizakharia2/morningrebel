import {useOptimisticCart} from '@shopify/hydrogen';
import {Suspense, useEffect, useRef, useState} from 'react';
import {Await, Link, NavLink, useLocation} from 'react-router';
import type {Cart} from '~/lib/cart/cart-types';
import {useCartUI} from '~/components/cart/CartUIContext';
import {MobileNavigation} from './MobileNavigation';
import {NAV_ITEMS} from './nav';

export function SiteHeader({cart}: {cart: Promise<Cart | null> | Cart | null}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname, location.hash]);

  return (
    <header className="site-header" data-scrolled={scrolled || location.pathname !== '/'}>
      <div className="wrap flex h-full items-center justify-between gap-6">
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            className="icon-btn -ml-2"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen(true)}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
              <path d="M3 7h16M3 15h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <Link to="/" className="wordmark" aria-label="Morning Rebel, home">
          Morning Rebel
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className="nav-link">
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <CartToggle cart={cart} />
      </div>
      <MobileNavigation open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}

function CartToggle({cart}: {cart: Promise<Cart | null> | Cart | null}) {
  return (
    <Suspense fallback={<CartLink count={null} />}>
      <Await resolve={cart} errorElement={<CartLink count={null} />}>
        {(resolved) => <CartCount cart={resolved} />}
      </Await>
    </Suspense>
  );
}

function CartCount({cart}: {cart: Cart | null}) {
  const optimistic = useOptimisticCart(cart) as unknown as Cart | null;
  return <CartLink count={optimistic?.totalQuantity ?? 0} />;
}

function CartLink({count}: {count: number | null}) {
  const {open, addTick} = useCartUI();
  const [bump, setBump] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setBump(true);
    const t = setTimeout(() => setBump(false), 400);
    return () => clearTimeout(t);
  }, [addTick]);

  const label = count === null ? 'Cart' : `Cart, ${count} ${count === 1 ? 'item' : 'items'}`;
  return (
    <a
      href="/cart"
      className="icon-btn -mr-2 px-2 text-sm font-semibold"
      aria-label={label}
      data-testid="cart-toggle"
      onClick={(event) => {
        // Progressive enhancement: without JS this is a plain link to /cart.
        event.preventDefault();
        open();
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="none">
        <path d="M4 6.5h12l-1 10H5l-1-10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7.5 6.5V5a2.5 2.5 0 015 0v1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span className="hidden sm:inline">Cart</span>
      {count ? (
        <span className="cart-count" data-bump={bump} data-testid="cart-count">
          {count}
        </span>
      ) : null}
    </a>
  );
}
