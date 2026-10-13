import { useState } from 'react';
import type { ReactNode } from 'react';
import { useParams, Link } from 'wouter';
import { Check, ChevronDown, ChevronUp, Heart, Minus, Plus } from 'lucide-react';
import { useGetProduct } from '@workspace/api-client-react';
import { useCart } from '@/lib/cart';
import { apiErrorMessage, ErrorState, LoadingState } from '@/components/page-states';

export default function ProductDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const query = useGetProduct(id);
  const { addItem } = useCart();
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const product = query.data;

  if (query.isLoading) {
    return <main className="mx-auto max-w-[1440px] px-6"><LoadingState label="Opening the atelier archive" /></main>;
  }
  if (query.isError) {
    return <main className="mx-auto max-w-[1440px] px-6"><ErrorState onRetry={() => void query.refetch()} title="This piece is out of reach for a moment" description={apiErrorMessage(query.error)} /></main>;
  }
  if (!product) {
    return (
      <main className="mx-auto max-w-[1440px] px-6 py-24 text-center" data-testid="status-product-missing">
        <p className="atelier-label text-[#944931]">PIECE NOT FOUND</p>
        <h1 className="atelier-heading mt-4 text-4xl">This page has moved on.</h1>
        <Link href="/shop" className="atelier-label atelier-link mt-7 inline-block">Return to the collection</Link>
      </main>
    );
  }

  const images = product.images?.length ? product.images : ['/images/zaytoon-hero.jpg'];
  const available = product.stockQuantity > 0;
  const handleAdd = () => {
    if (!size || !available) {
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      image: images[0],
      size,
      quantity,
      unitPrice: product.price,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  return (
    <main className="mx-auto max-w-[1440px] px-5 pb-20 pt-5 sm:px-10 sm:pt-8 lg:px-16">
      <div className="mb-5 flex items-center gap-2 text-[10px] tracking-[0.12em] text-[#74766f]">
        <Link href="/" className="hover:text-[#4a5844]">HOME</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[#4a5844]">COLLECTION</Link>
        <span>/</span>
        <span className="text-[#1c1c1a]">{product.name.toUpperCase()}</span>
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:gap-16">
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          {images.slice(0, 4).map((image, index) => (
            <div key={`${image}-${index}`} className={`product-image aspect-[4/5] ${index === 0 ? 'col-span-2' : ''}`}>
              <img src={image} alt={`${product.name}, view ${index + 1}`} className="h-full w-full object-cover" data-testid={`img-detail-${index}`} />
            </div>
          ))}
        </div>
        <div className="lg:sticky lg:top-[130px] lg:self-start lg:py-4">
          <p className="atelier-label text-[#944931]">{product.category.toUpperCase()} · PALESTINIAN ROOTS</p>
          <h1 className="atelier-heading mt-3 text-4xl leading-tight sm:text-5xl" data-testid="text-product-name">{product.name}</h1>
          <div className="mt-5 flex items-center justify-between border-b border-[#d8cab8] pb-5">
            <p className="atelier-label" data-testid="text-detail-price">${product.price.toFixed(2)}</p>
            <p className="text-xs text-[#74766f]">{available ? 'Complimentary delivery on orders over $250' : 'Currently unavailable'}</p>
          </div>
          <p className="mt-6 text-sm font-light leading-7 text-[#55574f]" data-testid="text-product-description">
            {product.description}
          </p>
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <label className="atelier-label" htmlFor="product-size">SELECT SIZE</label>
              <button type="button" className="atelier-label text-[9px] text-[#66685f] underline underline-offset-4" data-testid="button-size-guide" onClick={() => document.getElementById('size-note')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                SIZE NOTES
              </button>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {product.sizes.map((availableSize) => (
                <button
                  key={availableSize}
                  type="button"
                  aria-pressed={size === availableSize}
                  onClick={() => setSize(availableSize)}
                  className={`h-12 border text-sm transition-colors ${size === availableSize ? 'border-[#4a5844] bg-[#4a5844] text-[#fcf9f5]' : 'border-[#c5c8be] hover:border-[#4a5844]'}`}
                  data-testid={`button-size-${availableSize}`}
                >
                  {availableSize}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-7 flex items-center justify-between border-y border-[#d8cab8] py-4">
            <span className="atelier-label">QUANTITY</span>
            <div className="flex items-center border border-[#c5c8be]">
              <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="flex h-10 w-10 items-center justify-center" data-testid="button-quantity-decrease"><Minus size={14} /></button>
              <span className="w-8 text-center text-sm" data-testid="text-product-quantity">{quantity}</span>
              <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((current) => Math.min(10, product.stockQuantity, current + 1))} disabled={quantity >= Math.min(10, product.stockQuantity)} className="flex h-10 w-10 items-center justify-center disabled:opacity-30" data-testid="button-quantity-increase"><Plus size={14} /></button>
            </div>
          </div>
          {!size && available && <p className="mt-4 text-xs text-[#944931]" data-testid="text-size-required">Please select a size to continue.</p>}
          {!available && <p className="mt-4 text-xs text-[#944931]" data-testid="text-out-of-stock">This piece is currently out of stock.</p>}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!size || !available}
            className="mt-5 flex w-full items-center justify-center gap-3 bg-[#1c1c1a] px-7 py-4 atelier-label text-[#fcf9f5] transition-colors hover:bg-[#4a5844] disabled:cursor-not-allowed disabled:bg-[#b8b9b2]"
            data-testid="button-add-to-bag"
          >
            {added ? <><Check size={15} /> ADDED TO CART</> : 'ADD TO CART'}
          </button>
          <button type="button" className="mt-4 flex w-full items-center justify-center gap-2 py-3 atelier-label text-[#55574f] hover:text-[#944931]" onClick={() => window.navigator.clipboard?.writeText(window.location.href)} data-testid="button-share-product">
            <Heart size={15} strokeWidth={1.3} /> COPY PIECE LINK
          </button>
          <div className="mt-8 border-t border-[#d8cab8]">
            <Disclosure title="Details & care">
              <p>{product.description}</p>
              <p className="mt-2">Care instructions are provided with your piece.</p>
            </Disclosure>
            <Disclosure title="Artisan & origin">
              <p>Rooted in Palestinian craft traditions and made with a contemporary point of view.</p>
            </Disclosure>
            <Disclosure title="Delivery & returns">
              <p>Delivery and return details are shared at checkout and in your order confirmation.</p>
            </Disclosure>
          </div>
          <div id="size-note" className="mt-7 border border-[#d8cab8] p-4">
            <p className="atelier-label text-[#4a5844]">A NOTE ON FIT</p>
            <p className="mt-2 text-xs leading-5 text-[#66685f]">Select your usual size. For a more relaxed silhouette, consider sizing up.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="group border-b border-[#d8cab8] py-4" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="flex cursor-pointer list-none items-center justify-between atelier-label">
        {title}
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </summary>
      <div className="pt-3 text-sm font-light leading-6 text-[#66685f]">{children}</div>
    </details>
  );
}
