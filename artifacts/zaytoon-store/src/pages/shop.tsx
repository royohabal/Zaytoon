import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useGetProducts, type GetProductsParams } from '@workspace/api-client-react';
import { apiErrorMessage, ErrorState, LoadingState } from '@/components/page-states';
import { ProductCard } from '@/components/product-card';

type SortValue = NonNullable<GetProductsParams['sort']>;

export default function ShopPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(
    () => new URLSearchParams(window.location.search).get('category') ?? '',
  );
  const [sort, setSort] = useState<SortValue>('newest');
  const params: GetProductsParams = {
    search: search.trim() || undefined,
    category: category || undefined,
    sort,
  };
  const query = useGetProducts(params);
  const products = query.data?.products ?? [];
  const categories = query.data?.categories ?? [];

  return (
    <main className="mx-auto min-h-[65vh] max-w-[1440px] px-5 pb-20 pt-10 sm:px-10 sm:pt-16 lg:px-16">
      <div className="border-b border-[#d8cab8] pb-8">
        <p className="atelier-label text-[#944931]">ZAYTOON ATELIER · COLLECTION</p>
        <div className="mt-3 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <h1 className="atelier-heading text-5xl leading-[1.05] sm:text-6xl">Shop the pieces</h1>
          <p className="max-w-[340px] text-sm font-light leading-6 text-[#66685f]">
            Modern tailoring, rooted in Palestinian artistry. Find the piece that feels like yours.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-5 border-b border-[#d8cab8] py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={`border px-4 py-2 text-[10px] font-medium tracking-[0.14em] transition-colors ${category === '' ? 'border-[#4a5844] bg-[#4a5844] text-[#fcf9f5]' : 'border-[#c5c8be] hover:border-[#4a5844]'}`}
            data-testid="filter-category-all"
          >
            ALL PIECES
          </button>
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCategory(name)}
              className={`border px-4 py-2 text-[10px] font-medium tracking-[0.14em] transition-colors ${category === name ? 'border-[#4a5844] bg-[#4a5844] text-[#fcf9f5]' : 'border-[#c5c8be] hover:border-[#4a5844]'}`}
              data-testid={`filter-category-${name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {name.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-4 xs:flex-row sm:items-center">
          <label className="relative flex min-w-[220px] items-center border-b border-[#1c1c1a]/35 py-2">
            <Search size={15} className="mr-2 text-[#74766f]" strokeWidth={1.4} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search pieces"
              aria-label="Search products"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#8a8b85]"
              data-testid="input-product-search"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="p-1" data-testid="button-clear-search">
                <X size={14} />
              </button>
            )}
          </label>
          <label className="flex items-center gap-3">
            <span className="atelier-label whitespace-nowrap text-[9px] text-[#74766f]">SORT BY</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortValue)}
              className="border-b border-[#1c1c1a]/35 bg-transparent py-2 text-sm outline-none"
              aria-label="Sort products"
              data-testid="select-product-sort"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="name_asc">Name A–Z</option>
            </select>
          </label>
        </div>
      </div>
      <div className="flex items-center justify-between py-5">
        <p className="atelier-label text-[#74766f]" data-testid="text-product-count">
          {query.isLoading ? 'CURATING' : `${products.length} ${products.length === 1 ? 'PIECE' : 'PIECES'}`}
        </p>
        {category && <button type="button" onClick={() => setCategory('')} className="atelier-label text-[#944931]" data-testid="button-clear-filter">CLEAR FILTER ×</button>}
      </div>
      {query.isLoading ? (
        <LoadingState label="Finding your next piece" />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} description={apiErrorMessage(query.error)} />
      ) : products.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-7 sm:gap-y-14 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
          {products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
        </div>
      ) : (
        <div className="border-t border-[#d8cab8]">
          <div className="mx-auto py-20 text-center" data-testid="status-no-results">
            <p className="atelier-label text-[#944931]">NO MATCHES FOUND</p>
            <h2 className="atelier-heading mt-4 text-3xl">A different thread?</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#66685f]">
              Try another search or browse every piece in the collection.
            </p>
            <button type="button" onClick={() => { setSearch(''); setCategory(''); }} className="mt-6 border border-[#1c1c1a] px-6 py-3 atelier-label transition-colors hover:bg-[#4a5844] hover:text-[#fcf9f5]" data-testid="button-reset-filters">
              Reset filters
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
