import {useEffect, useRef, useState} from 'react';

/**
 * Flags an element once it has entered the viewport (one-shot). Content is
 * fully visible without JS; reveal styles only apply under `.js`.
 */
export function useInView<T extends Element>(rootMargin = '0px 0px -15% 0px') {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      {rootMargin},
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, rootMargin]);
  return [ref, inView] as const;
}
