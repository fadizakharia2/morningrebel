import {Image} from '@shopify/hydrogen';
import type {ImageData} from '~/lib/catalog/types';

function isShopifyCdn(url: string) {
  try {
    return new URL(url).hostname === 'cdn.shopify.com';
  } catch {
    return false;
  }
}

/** React 18 only knows the lowercase DOM attribute. */
function priorityAttr(value?: 'high' | 'low' | 'auto') {
  return value ? ({fetchpriority: value} as Record<string, string>) : {};
}

/**
 * Shopify CDN images go through Hydrogen's <Image> (responsive srcset and
 * on-the-fly transforms). Local fixture renders fall back to a plain <img>.
 */
export function ProductImage({
  image,
  sizes,
  alt,
  loading = 'lazy',
  fetchPriority,
  className,
  aspectRatio = '4/5',
}: {
  image?: ImageData | null;
  sizes: string;
  alt?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  className?: string;
  aspectRatio?: string;
}) {
  if (!image?.url) return null;
  const altText = alt ?? image.altText ?? '';
  if (isShopifyCdn(image.url)) {
    return (
      <Image
        data={{
          url: image.url,
          altText,
          width: image.width ?? undefined,
          height: image.height ?? undefined,
        }}
        alt={altText}
        aspectRatio={aspectRatio}
        sizes={sizes}
        loading={loading}
        className={className}
        {...priorityAttr(fetchPriority)}
      />
    );
  }
  return (
    <img
      src={image.url}
      alt={altText}
      width={image.width ?? 1200}
      height={image.height ?? 1500}
      loading={loading}
      decoding="async"
      {...priorityAttr(fetchPriority)}
      className={className}
      style={{aspectRatio}}
    />
  );
}
