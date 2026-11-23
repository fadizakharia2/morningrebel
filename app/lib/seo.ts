import type {MetaDescriptor} from 'react-router';
import type {Product, Variant} from '~/lib/catalog/types';

export const SITE_NAME = 'Morning Rebel';
export const DEFAULT_DESCRIPTION =
  'Premium mushroom coffee. Two distinct roasts, Medium and Dark. One extraordinary ritual.';

export function absoluteUrl(siteUrl: string, path: string) {
  return new URL(path, siteUrl).toString();
}

export function pageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  url,
  image,
  type = 'website',
  noindex = false,
}: {
  title: string;
  description?: string;
  url: string;
  image?: string | null;
  type?: 'website' | 'product';
  noindex?: boolean;
}): MetaDescriptor[] {
  const tags: MetaDescriptor[] = [
    {title},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: url},
    {property: 'og:site_name', content: SITE_NAME},
    {property: 'og:type', content: type},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:url', content: url},
    {name: 'twitter:card', content: image ? 'summary_large_image' : 'summary'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
  ];
  if (image) {
    tags.push({property: 'og:image', content: image}, {name: 'twitter:image', content: image});
  }
  if (noindex) tags.push({name: 'robots', content: 'noindex'});
  return tags;
}

/** schema.org Product built only from Shopify data. */
export function productJsonLd(product: Product, url: string, variants: Variant[]) {
  const offers = variants.map((v) => ({
    '@type': 'Offer',
    price: v.price.amount,
    priceCurrency: v.price.currencyCode,
    availability: v.availableForSale
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
    url: `${url}?variant=${encodeURIComponent(v.id.split('/').pop() ?? '')}`,
    ...(v.sku ? {sku: v.sku} : {}),
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || undefined,
    image: product.images.map((i) => i.url).slice(0, 4),
    brand: {'@type': 'Brand', name: product.vendor || SITE_NAME},
    offers,
    ...(product.rating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating.value,
            bestRating: product.rating.scaleMax,
            reviewCount: product.rating.count,
          },
        }
      : {}),
  };
}

export function breadcrumbJsonLd(items: Array<{name: string; url: string}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
