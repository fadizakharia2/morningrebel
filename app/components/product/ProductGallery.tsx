import {useEffect, useState} from 'react';
import type {ImageData} from '~/lib/catalog/types';
import {ProductImage} from '~/components/ProductImage';

/**
 * Main image plus thumbnails. Selecting a variant with its own image brings
 * that image forward. Swaps crossfade with a short blur (masks the change).
 */
export function ProductGallery({
  images,
  activeImage,
  title,
  field,
}: {
  images: ImageData[];
  activeImage?: ImageData | null;
  title: string;
  field: string;
}) {
  const all = images.length > 0 ? images : activeImage ? [activeImage] : [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!activeImage) return;
    const i = all.findIndex((img) => img.url === activeImage.url);
    if (i >= 0) setIndex(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeImage?.url]);

  const current = all[index] ?? all[0];
  if (!current) return null;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-[1.75rem] px-[12%] py-[8%]"
        style={{background: field}}
      >
        <div key={current.url} className="pouch pouch--reflect swap-enter w-full max-w-[26rem]">
          <ProductImage
            image={current}
            sizes="(min-width: 1024px) 40vw, 90vw"
            loading="eager"
            fetchPriority="high"
            alt={current.altText ?? title}
          />
        </div>
      </div>
      {all.length > 1 ? (
        <ul className="flex gap-3" aria-label="Product images">
          {all.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${all.length}`}
                aria-current={i === index}
                className={`block w-20 overflow-hidden rounded-xl border p-1 transition-[border-color,transform] duration-200 ease-[var(--ease-out)] active:scale-95 ${
                  i === index ? 'border-[var(--color-ivory)]' : 'hairline'
                }`}
              >
                <ProductImage image={img} sizes="80px" alt="" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
