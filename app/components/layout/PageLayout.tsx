import {useEffect} from 'react';
import {useLocation} from 'react-router';
import type {Cart} from '~/lib/cart/cart-types';
import {captureAttribution} from '~/lib/attribution';
import {CartDrawer} from '~/components/cart/CartDrawer';
import {CartUIProvider} from '~/components/cart/CartUIContext';
import {DevBanner} from './DevBanner';
import {Footer} from './Footer';
import {SiteHeader} from './SiteHeader';

export function PageLayout({
  cart,
  isFixture,
  children,
}: {
  cart: Promise<Cart | null> | Cart | null;
  isFixture: boolean;
  children: React.ReactNode;
}) {
  const location = useLocation();
  useEffect(() => {
    captureAttribution(location.search);
    // Only the landing URL matters for attribution.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CartUIProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {isFixture ? <DevBanner /> : null}
      <SiteHeader cart={cart} />
      {children}
      <Footer />
      <CartDrawer cart={cart} />
    </CartUIProvider>
  );
}
