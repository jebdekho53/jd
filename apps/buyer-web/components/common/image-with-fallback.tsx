'use client';

import Image, { type ImageProps } from 'next/image';
import { type ReactNode, useEffect, useState } from 'react';

type Props = Omit<ImageProps, 'src'> & {
  src?: string | null;
  /** Rendered when src is missing OR the image fails to load (404/broken host). */
  fallback: ReactNode;
};

/**
 * next/image that degrades gracefully: a missing or broken image URL renders the
 * provided fallback (e.g. an initial or icon) instead of the browser's broken-image
 * glyph. Keeps product/category/store tiles looking intentional when assets are
 * absent or a CDN link rots.
 */
export function ImageWithFallback({ src, fallback, ...rest }: Props) {
  const [failed, setFailed] = useState(false);

  // Reset the error state if the source changes (e.g. list re-render / new item).
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) return <>{fallback}</>;

  return <Image src={src} onError={() => setFailed(true)} {...rest} />;
}
