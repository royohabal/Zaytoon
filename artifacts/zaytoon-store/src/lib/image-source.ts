/**
 * Serve the original Stitch trouser photograph locally. Its imported catalogue
 * URL contains a transcription typo; the MongoDB record stays unchanged.
 */
export function resolveImageSource(
  src: string | Blob | undefined,
): string | Blob | undefined {
  if (typeof src !== 'string') return src;

  if (src?.startsWith('/images/sample-products/') && src.endsWith('.svg')) {
    const fileName = src.slice('/images/sample-products/'.length, -'.svg'.length);
    return `/images/sample-products/${fileName}.jpg`;
  }

  if (src?.startsWith('https://lh3.googleusercontent.com/aida-public/AB6AXuBLPxvIK')) {
    return '/images/pleated-wide-leg-trouser.jpg';
  }
  return src;
}
