import { Link } from 'wouter';
import type { Product } from '@workspace/api-client-react';
import { ArrowUpRight } from 'lucide-react';
import { FadeImage } from '@/lib/motion';
import { resolveImageSource } from '@/lib/image-source';
import { useCurrency } from '@/lib/currency';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { formatBasePrice } = useCurrency();
  const image = product.images?.[0] || '/images/zaytoon-hero.jpg';
  const secondImage = product.images && product.images.length > 1 ? product.images[1] : null;

  return (
    <article
      className="group reveal"
      style={{ animationDelay: `${Math.min(index * 70, 350)}ms` }}
      data-testid={`card-product-${product.id}`}
    >
      <Link href={`/products/${product.id}`} className="block" data-testid={`link-product-${product.id}`}>
        <div className="product-image relative aspect-[4/5]">
          <FadeImage
            src={image}
            alt={product.name}
            className="h-full w-full object-cover"
            loading={index > 2 ? 'lazy' : 'eager'}
            data-testid={`img-product-${product.id}`}
          />
          {secondImage && (
            <img
              src={resolveImageSource(secondImage)}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
            />
          )}
          {product.featured && (
            <span className="absolute left-3 top-3 border border-[#fcf9f5]/75 bg-[#fcf9f5]/85 px-2 py-1 text-[9px] tracking-[0.13em]">
              ATELIER PIECE
            </span>
          )}
          <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center bg-[#fcf9f5] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            <ArrowUpRight size={17} strokeWidth={1.3} />
          </span>
        </div>
        <div className="flex items-start justify-between gap-3 pt-4">
          <div>
            <p className="atelier-heading text-[18px] leading-6">{product.name}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#74766f]">{product.category}</p>
          </div>
          <p className="atelier-label shrink-0 pt-1" data-testid={`text-product-price-${product.id}`}>
            {formatBasePrice(product.price)}
          </p>
        </div>
      </Link>
    </article>
  );
}
