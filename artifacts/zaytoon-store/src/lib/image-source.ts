/**
 * Serve the original Stitch trouser photograph locally. Its imported catalogue
 * URL contains a transcription typo; the MongoDB record stays unchanged.
 */
export function resolveImageSource(src: string | undefined): string | undefined {
  if (src?.startsWith('/images/sample-products/') && src.endsWith('.svg')) {
    const fileName = src.slice('/images/sample-products/'.length, -'.svg'.length);
    return `${import.meta.env.BASE_URL}images/sample-products/${fileName}.jpg`;
  }

  if (src?.startsWith('https://lh3.googleusercontent.com/aida-public/AB6AXuBLPxvIK')) {
    return `${import.meta.env.BASE_URL}images/pleated-wide-leg-trouser.jpg`;
  }
  return src;
}
