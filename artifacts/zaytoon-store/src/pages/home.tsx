import { Link } from 'wouter';
import type { ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, Leaf, Scissors, Sparkles } from 'lucide-react';
import { useGetFeaturedProducts, useGetProducts } from '@workspace/api-client-react';
import { ProductCard } from '@/components/product-card';
import { apiErrorMessage, ErrorState, LoadingState } from '@/components/page-states';

export default function HomePage() {
  const featured = useGetFeaturedProducts();
  const catalogue = useGetProducts();
  const categories = catalogue.data?.categories ?? [];
  const products = catalogue.data?.products ?? [];
  const collections = categories
    .map((name) => ({
      name,
      product: products.find((product) => product.category === name),
      count: products.filter((product) => product.category === name).length,
    }))
    .filter((collection) => collection.product);
  const arrivals = products.filter((product) => !product.featured).slice(0, 4);

  return (
    <main>
      <section className="relative min-h-[620px] overflow-hidden bg-[#e7e3dc] sm:min-h-[680px] lg:min-h-[min(760px,calc(100dvh-120px))]">
        <img
          src="/images/zaytoon-hero.jpg"
          alt="Olive tailoring in a sunlit Palestinian stone courtyard"
          className="absolute inset-0 h-full w-full object-cover object-[58%_center]"
          data-testid="img-home-hero"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c1c1a]/65 via-[#1c1c1a]/18 to-transparent" />
        <div className="relative mx-auto flex min-h-[620px] max-w-[1600px] items-end px-6 pb-16 pt-24 sm:min-h-[680px] sm:px-10 sm:pb-20 lg:min-h-[min(760px,calc(100dvh-120px))] lg:items-center lg:px-16">
          <div className="max-w-[650px] text-[#fcf9f5]">
            <p className="atelier-label reveal">PALESTINIAN ROOTS · CONTEMPORARY FORM</p>
            <h1 className="atelier-heading reveal reveal-delay mt-5 text-[clamp(3rem,7.5vw,6.7rem)] leading-[0.99] tracking-[-0.04em]">
              Roots of the<br />olive grove.
            </h1>
            <p className="reveal reveal-delay-2 mt-6 max-w-[420px] text-base font-light leading-7 text-[#fcf9f5]/85 sm:text-lg">
              Modern silhouettes, shaped by the enduring art of Palestinian making.
            </p>
            <div className="reveal reveal-delay-2 mt-9 flex flex-wrap gap-3">
              <Link href="/shop" className="inline-flex items-center gap-3 bg-[#4a5844] px-7 py-4 atelier-label text-[#fcf9f5] transition-colors hover:bg-[#1c1c1a]" data-testid="link-hero-shop">
                Shop now <ArrowRight size={15} />
              </Link>
              <a href="#story" className="inline-flex items-center border border-[#fcf9f5]/70 px-7 py-4 atelier-label text-[#fcf9f5] transition-colors hover:bg-[#fcf9f5] hover:text-[#1c1c1a]" data-testid="link-hero-story">
                Our story
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 hidden h-[3px] opacity-70 sm:block">
          <div className="tatreez-rule h-full" />
        </div>
        <div className="absolute bottom-7 right-8 hidden text-right text-[9px] tracking-[0.17em] text-white/80 lg:block">
          <span>01 — A LIVING ARCHIVE</span><br />
          <span className="mt-1 inline-block">BEIT JALA · PALESTINE</span>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-20 sm:px-10 sm:py-28 lg:px-16">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="atelier-label text-[#944931]">THE COLLECTION</p>
            <h2 className="atelier-heading mt-3 text-4xl sm:text-[3.25rem]">Structural silhouettes</h2>
          </div>
          <Link href="/shop" className="atelier-label atelier-link inline-flex items-center gap-2 pb-1" data-testid="link-all-products">
            View all pieces <ArrowUpRight size={14} />
          </Link>
        </div>
        {featured.isLoading ? (
          <LoadingState label="Preparing the featured collection" />
        ) : featured.isError ? (
          <ErrorState onRetry={() => void featured.refetch()} />
        ) : featured.data?.length ? (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-7 sm:gap-y-14 lg:grid-cols-4 lg:gap-x-8">
            {featured.data.slice(0, 4).map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="mt-10 border-y border-[#d8cab8] py-12 text-center" data-testid="status-featured-empty">
            <p className="atelier-heading text-2xl">The next chapter is taking shape.</p>
            <Link href="/shop" className="atelier-label atelier-link mt-5 inline-block">Browse the collection</Link>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-20 sm:px-10 sm:pb-28 lg:px-16">
        <div className="flex flex-col justify-between gap-5 border-b border-[#d8cab8] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="atelier-label text-[#944931]">THE EDIT</p>
            <h2 className="atelier-heading mt-3 text-4xl sm:text-5xl">Explore the collections</h2>
          </div>
          <Link href="/shop" className="atelier-label atelier-link inline-flex items-center gap-2" data-testid="link-all-collections">
            View all collections <ArrowUpRight size={14} />
          </Link>
        </div>
        {catalogue.isLoading ? (
          <LoadingState label="Opening the collections" />
        ) : catalogue.isError ? (
          <ErrorState
            onRetry={() => void catalogue.refetch()}
            description={apiErrorMessage(catalogue.error)}
          />
        ) : collections.length ? (
          <div className="mt-9 grid gap-4 sm:grid-cols-3 sm:gap-6">
            {collections.slice(0, 3).map(({ name, product, count }, index) => (
              <Link
                key={name}
                href={`/shop?category=${encodeURIComponent(name)}`}
                className="group"
                data-testid={`link-featured-collection-${index}`}
              >
                <div className="product-image aspect-[4/5] overflow-hidden">
                  <img
                    src={product!.images[0]}
                    alt={`${name} collection`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                    loading="lazy"
                  />
                </div>
                <div className="flex items-baseline justify-between border-b border-[#d8cab8] py-4">
                  <h3 className="atelier-heading text-2xl">{name}</h3>
                  <span className="atelier-label text-[9px] text-[#74766f]">
                    {String(count).padStart(2, '0')} PIECES
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-9 border-y border-[#d8cab8] py-12 text-center" data-testid="status-collections-empty">
            <p className="atelier-heading text-2xl">The next chapter is taking shape.</p>
          </div>
        )}
      </section>

      <section className="bg-[#f6f3ef]">
        <div className="mx-auto max-w-[1440px] px-6 py-20 sm:px-10 sm:py-28 lg:px-16">
          <div className="flex flex-col justify-between gap-5 border-b border-[#d8cab8] pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="atelier-label text-[#944931]">JUST ARRIVED</p>
              <h2 className="atelier-heading mt-3 text-4xl sm:text-5xl">New to the atelier</h2>
            </div>
            <Link href="/shop" className="atelier-label atelier-link inline-flex items-center gap-2" data-testid="link-new-arrivals">
              Explore every piece <ArrowUpRight size={14} />
            </Link>
          </div>
          {catalogue.isLoading ? (
            <LoadingState label="Finding the latest pieces" />
          ) : catalogue.isError ? (
            <ErrorState
              onRetry={() => void catalogue.refetch()}
              description={apiErrorMessage(catalogue.error)}
            />
          ) : arrivals.length ? (
            <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-7 sm:gap-y-14 lg:grid-cols-4 lg:gap-x-8">
              {arrivals.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="mt-9 border-y border-[#d8cab8] py-12 text-center" data-testid="status-arrivals-empty">
              <p className="atelier-heading text-2xl">New pieces are taking shape.</p>
              <Link href="/shop" className="atelier-label atelier-link mt-5 inline-block">
                Browse the collection
              </Link>
            </div>
          )}
        </div>
      </section>

      <section id="craft" className="bg-[#f0edea]">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-20 lg:px-16 lg:py-24">
          <div className="order-2 lg:order-1">
            <div className="mb-7 flex items-center gap-3 text-[#4a5844]">
              <span className="h-[1px] w-10 bg-[#4a5844]" />
              <p className="atelier-label">THE ART OF TATREEZ</p>
            </div>
            <h2 className="atelier-heading max-w-[560px] text-4xl leading-[1.12] sm:text-5xl">
              A language of thread, in a contemporary form.
            </h2>
            <p className="mt-6 max-w-[490px] text-[15px] font-light leading-7 text-[#55574f]">
              Every motif carries a place, a hand, a memory. We bring these living patterns into considered pieces made for the way we dress now.
            </p>
            <div className="mt-9 grid max-w-[490px] grid-cols-3 border-y border-[#c5c8be] py-5">
              <div>
                <span className="atelier-heading text-3xl">01</span>
                <p className="atelier-label mt-2 text-[9px] text-[#66685f]">ROOTED</p>
              </div>
              <div className="border-l border-[#c5c8be] pl-4">
                <span className="atelier-heading text-3xl">∞</span>
                <p className="atelier-label mt-2 text-[9px] text-[#66685f]">INTERGENERATIONAL</p>
              </div>
              <div className="border-l border-[#c5c8be] pl-4">
                <span className="atelier-heading text-3xl">01</span>
                <p className="atelier-label mt-2 text-[9px] text-[#66685f]">OF A KIND</p>
              </div>
            </div>
            <a href="#story" className="atelier-label atelier-link mt-8 inline-flex items-center gap-2">
              Meet the hands behind the work <ArrowRight size={14} />
            </a>
          </div>
          <div className="order-1 relative lg:order-2">
            <img
              src="/images/tatreez-craft.jpg"
              alt="Artisan hands stitching Palestinian embroidery into olive wool"
              className="aspect-[1.15/1] w-full object-cover"
              loading="lazy"
              data-testid="img-tatreez-craft"
            />
            <span className="absolute -bottom-3 -left-3 border border-[#4a5844] bg-[#fcf9f5] px-4 py-3 atelier-label text-[9px] text-[#4a5844] sm:-bottom-5 sm:-left-5">
              THREAD · PLACE · MEMORY
            </span>
          </div>
        </div>
      </section>

      <section id="story" className="bg-[#252622] text-[#fcf9f5]">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-20 sm:px-10 lg:grid-cols-[1fr_1.25fr] lg:gap-24 lg:px-16 lg:py-28">
          <div>
            <p className="atelier-label text-[#d8cab8]">A NOTE FROM THE ATELIER</p>
            <h2 className="atelier-heading mt-5 text-4xl leading-[1.12] sm:text-5xl">Dignity woven into modern living.</h2>
          </div>
          <div className="lg:pt-8">
            <p className="text-lg font-light leading-8 text-[#fcf9f5]/80">
              Zaytoon Atelier is a Palestinian label shaped by the strength of its roots. We make room for heritage in the present: precise tailoring, purposeful detail, and the quiet poetry of the olive tree.
            </p>
            <div className="mt-8 flex items-center gap-3 text-[#d8cab8]">
              <Leaf size={18} strokeWidth={1.2} />
              <span className="atelier-label">MADE WITH MEMORY · DESIGNED FOR THE PRESENT</span>
            </div>
            <Link href="/shop" className="mt-9 inline-flex items-center gap-3 border border-[#fcf9f5]/45 px-6 py-3 atelier-label transition-colors hover:bg-[#fcf9f5] hover:text-[#1c1c1a]" data-testid="link-story-shop">
              Find your piece <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
        <div className="flex flex-col items-center text-center">
          <Sparkles size={19} className="text-[#944931]" strokeWidth={1.2} />
          <p className="atelier-label mt-4 text-[#944931]">A PRACTICE OF CARE</p>
          <h2 className="atelier-heading mt-3 max-w-2xl text-3xl leading-tight sm:text-4xl">
            “The stitch is small. The story it carries is not.”
          </h2>
          <p className="mt-4 text-sm font-light tracking-[0.08em] text-[#66685f]">ZAYTOON ATELIER</p>
        </div>
        <div className="mt-12 grid gap-7 border-t border-[#d8cab8] pt-8 sm:grid-cols-3">
          <CraftValue icon={<Scissors size={19} strokeWidth={1.3} />} title="Considered tailoring" text="Clean lines and thoughtful proportions designed to live in." />
          <CraftValue icon={<Leaf size={19} strokeWidth={1.3} />} title="Heritage, held close" text="Palestinian craft remains present in every deliberate detail." />
          <CraftValue icon={<Sparkles size={19} strokeWidth={1.3} />} title="Made to return to" text="Pieces made with care, to be worn and kept for years." />
        </div>
      </section>
    </main>
  );
}

function CraftValue({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-4">
      <span className="mt-1 text-[#4a5844]">{icon}</span>
      <div>
        <h3 className="atelier-heading text-xl">{title}</h3>
        <p className="mt-2 text-sm font-light leading-6 text-[#66685f]">{text}</p>
      </div>
    </div>
  );
}
