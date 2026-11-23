import {Link} from 'react-router';
import type {FaqEntry, PolicyLink, Product} from '~/lib/catalog/types';

interface Item {
  id: string;
  question: string;
  answer: React.ReactNode;
}

/**
 * Merchant FAQs come from `morning_rebel_faq` metaobjects. Where none exist,
 * a small set of answers is derived strictly from Shopify data (policies,
 * selling plans, metafields) or from what the brand brief states. Any answer
 * that would need a fact we do not have points to where the fact lives.
 */
export function buildFaqs({
  faqs,
  policies,
  medium,
  dark,
}: {
  faqs: FaqEntry[];
  policies: PolicyLink[];
  medium: Product | null;
  dark: Product | null;
}): Item[] {
  if (faqs.length > 0) {
    return faqs.map((f) => ({id: f.id, question: f.question, answer: f.answer}));
  }
  const policy = (handle: string) => policies.find((p) => p.handle === handle);
  const shipping = policy('shipping-policy');
  const refund = policy('refund-policy');
  const caffeineKnown = medium?.facts.caffeine || dark?.facts.caffeine;
  const brewing = medium?.facts.brewingSteps.length ? medium.facts.brewingSteps : dark?.facts.brewingSteps ?? [];

  const items: Item[] = [
    {
      id: 'what',
      question: 'What is mushroom coffee?',
      answer:
        'Coffee blended with mushroom ingredients. The exact mushrooms in each roast, and how much of each, are listed in Ingredients on each product page.',
    },
    {
      id: 'roasts',
      question: 'Medium or Dark: which should I choose?',
      answer:
        'Medium Roast is balanced and approachable, for people who like a classic medium roast. Dark Roast is bold and rich, for people who want intensity. Not sure? The Duo gets you one of each.',
    },
    {
      id: 'ingredients',
      question: 'What is in it?',
      answer: (
        <>
          The full ingredient list, mushroom amounts and testing documentation are on the{' '}
          {medium ? <Link className="text-link" to={`/products/${medium.handle}`}>Medium Roast</Link> : 'Medium Roast'} and{' '}
          {dark ? <Link className="text-link" to={`/products/${dark.handle}`}>Dark Roast</Link> : 'Dark Roast'} pages.
        </>
      ),
    },
  ];
  if (caffeineKnown) {
    items.push({
      id: 'caffeine',
      question: 'How much caffeine is in it?',
      answer: [
        medium?.facts.caffeine ? `Medium Roast: ${medium.facts.caffeine}.` : '',
        dark?.facts.caffeine ? `Dark Roast: ${dark.facts.caffeine}.` : '',
      ]
        .filter(Boolean)
        .join(' '),
    });
  }
  if (brewing.length > 0) {
    items.push({id: 'brew', question: 'How do I brew it?', answer: brewing.join(' ')});
  }
  if (shipping) {
    items.push({
      id: 'shipping',
      question: 'How does shipping work?',
      answer: (
        <>
          Rates and delivery details are shown at checkout. Read the full{' '}
          <Link className="text-link" to={`/policies/${shipping.handle}`}>{shipping.title}</Link>.
        </>
      ),
    });
  }
  if (refund) {
    items.push({
      id: 'returns',
      question: 'What if it is not for me?',
      answer: (
        <>
          Returns and refunds follow our{' '}
          <Link className="text-link" to={`/policies/${refund.handle}`}>{refund.title}</Link>.
        </>
      ),
    });
  }
  return items;
}

export function FAQAccordion(props: Parameters<typeof buildFaqs>[0]) {
  const items = buildFaqs(props);
  return (
    <section id="faq" aria-labelledby="faq-title" className="relative py-20 sm:py-28">
      <div className="wrap grid gap-10 lg:grid-cols-12">
        <h2 id="faq-title" className="display-l lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
          Questions.
        </h2>
        <div className="lg:col-span-7 lg:col-start-6">
          {items.map((item) => (
            <details key={item.id} className="faq-item">
              <summary>
                {item.question}
                <svg className="faq-icon" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </summary>
              <div className="faq-answer">{item.answer}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
