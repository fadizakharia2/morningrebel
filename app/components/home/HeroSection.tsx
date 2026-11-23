import {Link} from 'react-router';
import type {Product} from '~/lib/catalog/types';
import {ROAST_COPY} from '~/lib/brand';
import {defaultVariant} from '~/lib/variants';
import {Price} from '~/components/Price';
import {ProductImage} from '~/components/ProductImage';

/**
 * The seam: two light fields, warm coffee for Medium on the left, burgundy
 * for Dark on the right, split by a thin silver line. The headline crosses
 * the seam; both bags stand on it. One composition says "two roasts, one
 * ritual" before a word is read.
 */
export function HeroSection({medium, dark}: {medium: Product | null; dark: Product | null}) {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden"

    >
      <HeroBackdrop />

      <div
        className="wrap relative grid grid-cols-1 lg:grid-cols-12 lg:gap-x-8"
        style={{paddingTop: 'calc(var(--header-h) + clamp(1.25rem, 4vh, 3.5rem))', paddingBottom: 'clamp(2.5rem, 7vh, 5rem)'}}
      >
        <h1 id="hero-title" className="display-xl relative z-10 lg:col-span-12 lg:row-start-1 [text-shadow:0_2px_30px_rgb(0_0_0/0.45)]">
          <span className="enter-line">
            <span style={{'--i': 0} as React.CSSProperties}>Your morning.</span>
          </span>
          <span className="enter-line lg:text-right">
            <span style={{'--i': 1} as React.CSSProperties}>Your rules.</span>
          </span>
        </h1>

        <div className="relative order-3 mt-6 lg:order-none lg:col-span-4 lg:col-start-1 lg:row-start-2 lg:mt-0 lg:self-end lg:pb-6">
          <p className="lead enter-fade" style={{'--i': 0} as React.CSSProperties}>
            Premium mushroom coffee. Two distinct roasts. One extraordinary ritual.
          </p>
          <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap enter-fade" style={{'--i': 1} as React.CSSProperties}>
            <a href="#roasts" className="btn">
              Shop the Roasts
            </a>
            <a href="#duo" className="btn btn--ghost">
              Discover the Duo
            </a>
          </div>
        </div>

        <div className="relative order-2 mt-4 grid grid-cols-2 items-end gap-3 sm:gap-6 lg:order-none lg:col-span-6 lg:col-start-4 lg:row-start-2 lg:-mt-[min(9vw,9rem)] lg:gap-10">
          {medium ? <HeroBag product={medium} index={0} /> : null}
          {dark ? <HeroBag product={dark} index={1} /> : null}
        </div>
      </div>
    </section>
  );
}

function HeroBag({product, index}: {product: Product; index: number}) {
  const variant = defaultVariant(product);
  const copy = product.key === 'dark' ? ROAST_COPY.dark : ROAST_COPY.medium;
  return (
    <Link
      to={`/products/${product.handle}`}
      className="group relative flex flex-col items-center text-center"
    >
      <Steam index={index} />
      <div
        className="pouch pouch--reflect enter-settle w-[min(100%,15rem)] transition-transform duration-500 ease-[var(--ease-out)] group-hover:-translate-y-1 lg:w-[min(100%,21.5rem)]"
        style={{'--i': index} as React.CSSProperties}
      >
        <ProductImage
          image={product.featuredImage}
          sizes="(min-width: 1024px) 21.5rem, 45vw"
          loading="eager"
          fetchPriority={index === 0 ? 'high' : 'auto'}
          // The link is named by the visible roast name below.
          alt=""
        />
      </div>
      <div className="mt-4 flex flex-col items-center gap-0.5 enter-fade" style={{'--i': 2 + index} as React.CSSProperties}>
        <span className="font-display text-[1.15rem] leading-tight sm:text-xl">{copy.name}</span>
        <span className="text-sm text-[var(--text-muted)]">
          {variant ? <Price money={variant.price} /> : null}
        </span>
      </div>
    </Link>
  );
}

function Steam({index}: {index: number}) {
  return (
    <svg
      className="steam pointer-events-none absolute -top-16 left-1/2 h-24 w-24 -translate-x-1/2"
      viewBox="0 0 100 100"
      aria-hidden="true"
      fill="none"
    >
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M${38 + i * 12} 96 C ${28 + i * 12} 74, ${52 + i * 12} 62, ${40 + i * 12} 40 S ${46 + i * 12} 12, ${40 + i * 12} 4`}
          stroke="#eee9df"
          strokeOpacity="0.32"
          strokeWidth="2"
          strokeLinecap="round"
          style={{'--i': i + index, filter: 'blur(2px)', opacity: 0} as React.CSSProperties}
        />
      ))}
    </svg>
  );
}

function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(60% 55% at 22% 62%, rgb(120 76 50 / 0.55), transparent 70%),
            radial-gradient(55% 55% at 80% 60%, rgb(105 30 43 / 0.62), transparent 70%),
            linear-gradient(90deg, #1a120e 0%, #0d0b0b 48%, #0d090a 52%, #1b0a0f 100%)`,
        }}
      />
      {/* The counter the bags stand on */}
      <div
        className="absolute inset-x-0 bottom-0 h-[34%]"
        style={{
          background:
            'linear-gradient(to bottom, transparent, rgb(0 0 0 / 0.55) 40%, #0b0b0d 100%)',
        }}
      />
      <div className="seam absolute top-[8%] bottom-[10%] left-1/2 hidden opacity-70 lg:block" />
    </div>
  );
}
