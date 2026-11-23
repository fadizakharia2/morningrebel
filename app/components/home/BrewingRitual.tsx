import type {Product} from '~/lib/catalog/types';
import {useIsFixture} from '~/lib/use-storefront';
import {useInView} from '~/components/motion/useInView';
import {Pending} from '~/components/product/Facts';

const STEPS = ['Open', 'Brew', 'Enjoy'] as const;

/**
 * Three-beat ritual. Step titles are brand structure; the instructions under
 * them come only from the `morning_rebel.brewing_steps` metafield (three
 * lines, in order). The line drawings sketch themselves once, on first view.
 */
export function BrewingRitual({product}: {product: Product | null}) {
  const isFixture = useIsFixture();
  const steps = product?.facts.brewingSteps ?? [];
  const [ref, inView] = useInView<HTMLOListElement>();
  if (!isFixture && steps.length === 0) return null;

  return (
    <section id="ritual" aria-labelledby="ritual-title" className="relative overflow-hidden bg-[var(--color-charcoal)] py-20 sm:py-28">
      <div className="wrap">
        <h2 id="ritual-title" className="display-l max-w-[14ch]">
          The ritual.
        </h2>
        <ol ref={ref} className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-6 lg:mt-16">
          {STEPS.map((title, i) => (
            <li key={title} className="flex flex-col gap-5">
              <div
                className={`reveal-draw relative aspect-[4/3] overflow-hidden rounded-[1.25rem] ${inView ? 'is-inview' : ''}`}
                style={{
                  '--i': i,
                  background:
                    i === 1
                      ? 'radial-gradient(80% 80% at 50% 60%, rgb(140 92 62 / 0.35), transparent 70%), #1d1714'
                      : 'radial-gradient(80% 80% at 50% 60%, rgb(105 30 43 / 0.35), transparent 70%), #19141a',
                } as React.CSSProperties}
              >
                <RitualDrawing step={i} />
              </div>
              <div className="flex items-baseline gap-4">
                <span aria-hidden="true" className="font-display text-xl italic text-[var(--text-soft)]">
                  {['i.', 'ii.', 'iii.'][i]}
                </span>
                <div>
                  <h3 className="font-display text-3xl">{title}</h3>
                  <p className="mt-2 max-w-[32ch] text-[var(--text-muted)]">
                    {steps[i] ?? <Pending label="Instructions: awaiting verified supplier data" />}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const stroke = {
  fill: 'none',
  stroke: '#d8cfc3',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  pathLength: 1,
};

function RitualDrawing({step}: {step: number}) {
  return (
    <svg viewBox="0 0 240 180" className="absolute inset-0 h-full w-full" aria-hidden="true">
      {step === 0 ? (
        <g>
          {/* A pouch, its top torn open */}
          <path {...stroke} d="M88 52 L152 52 L156 150 Q156 158 148 158 L92 158 Q84 158 84 150 Z" />
          <path {...stroke} d="M88 52 L96 44 L104 52 L112 44 L120 52 L128 44 L136 52 L144 44 L152 52" />
          <path {...stroke} d="M156 40 Q176 30 184 44" />
          <path {...stroke} d="M102 92 L138 92 M106 102 L134 102" />
        </g>
      ) : step === 1 ? (
        <g>
          {/* A kettle spout pouring into a cup */}
          <path {...stroke} d="M40 46 Q70 40 92 58 L104 66" />
          <path {...stroke} d="M106 68 Q114 92 116 112" />
          <path {...stroke} d="M84 112 L148 112 L142 150 Q140 158 132 158 L100 158 Q92 158 90 150 Z" />
          <path {...stroke} d="M148 122 Q166 122 164 134 Q162 146 144 144" />
          <ellipse {...stroke} cx="116" cy="112" rx="32" ry="5" />
        </g>
      ) : (
        <g>
          {/* A cup with rising steam */}
          <path {...stroke} d="M80 100 L160 100 L152 148 Q150 158 140 158 L100 158 Q90 158 88 148 Z" />
          <path {...stroke} d="M160 110 Q182 110 180 124 Q178 138 156 136" />
          <ellipse {...stroke} cx="120" cy="100" rx="40" ry="6" />
          <path {...stroke} d="M104 84 Q96 70 106 58 Q114 48 106 34" />
          <path {...stroke} d="M122 84 Q114 68 124 56 Q132 46 124 30" />
          <path {...stroke} d="M140 84 Q132 72 142 60 Q148 52 142 42" />
        </g>
      )}
    </svg>
  );
}
