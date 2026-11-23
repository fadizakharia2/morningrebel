import type {Route} from './+types/_index';
import type {RootLoader} from '~/root';
import {useStorefront} from '~/lib/use-storefront';
import {absoluteUrl, pageMeta, SITE_NAME} from '~/lib/seo';
import {HeroSection} from '~/components/home/HeroSection';
import {ProductShowcase} from '~/components/home/ProductShowcase';
import {RoastSelector} from '~/components/home/RoastSelector';
import {DiscoveryDuo} from '~/components/home/DiscoveryDuo';
import {IngredientTransparency} from '~/components/home/IngredientTransparency';
import {BrewingRitual} from '~/components/home/BrewingRitual';
import {ReviewSection} from '~/components/home/ReviewSection';
import {FAQAccordion} from '~/components/home/FAQAccordion';
import {FinalPurchase} from '~/components/home/FinalPurchase';

export const meta: Route.MetaFunction = ({matches}) => {
  const root = matches.find((m) => m?.id === 'root')?.data as
    | Awaited<ReturnType<RootLoader>>
    | undefined;
  const siteUrl = root?.siteUrl ?? 'https://localhost';
  const image = root?.storefront.dark?.featuredImage?.url;
  return [
    ...pageMeta({
      title: `${SITE_NAME} | Premium Mushroom Coffee, Medium & Dark Roast`,
      url: absoluteUrl(siteUrl, '/'),
      image: image?.startsWith('https://') ? image : null,
      noindex: root?.storefront.isFixture,
    }),
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: absoluteUrl(siteUrl, '/'),
        slogan: 'For the ritual. Not the hype.',
      },
    },
  ];
};

export default function Homepage() {
  const {medium, dark, duo, faqs, policies} = useStorefront();
  return (
    <main id="main">
      <HeroSection medium={medium} dark={dark} />
      <ProductShowcase medium={medium} dark={dark} />
      <RoastSelector medium={medium} dark={dark} />
      <DiscoveryDuo medium={medium} dark={dark} duo={duo} />
      <IngredientTransparency medium={medium} dark={dark} />
      <BrewingRitual product={medium ?? dark} />
      <ReviewSection medium={medium} dark={dark} />
      <FAQAccordion faqs={faqs} policies={policies} medium={medium} dark={dark} />
      <FinalPurchase medium={medium} dark={dark} duo={duo} />
    </main>
  );
}
