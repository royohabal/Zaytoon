import { useState } from 'react';
import { Link } from 'wouter';
import { useClerk, useUser } from '@clerk/react';
import { Menu, ShoppingBag, UserRound, X } from 'lucide-react';
import { useCart } from '@/lib/cart';

export function Header() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { isSignedIn } = useUser();

  const closeMenu = () => setOpen(false);

  return (
    <>
      <div className="bg-[#33412e] px-4 py-2 text-center text-[10px] font-medium tracking-[0.17em] text-[#fcf9f5] sm:text-[11px]">
        MADE WITH MEMORY · DESIGNED FOR THE PRESENT
      </div>
      <header className="sticky top-0 z-40 border-b border-[#1c1c1a]/10 bg-[#fcf9f5]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[76px] max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:h-[88px] lg:px-12">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-start lg:hidden"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            data-testid="button-mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} strokeWidth={1.4} /> : <Menu size={20} strokeWidth={1.4} />}
          </button>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
            <Link href="/shop" className="atelier-label atelier-link text-[10px]" data-testid="link-shop">
              Shop
            </Link>
            <a href={`${import.meta.env.BASE_URL}#story`} className="atelier-label atelier-link text-[10px]" data-testid="link-story">
              Our story
            </a>
            <a href={`${import.meta.env.BASE_URL}#craft`} className="atelier-label atelier-link text-[10px]" data-testid="link-craft">
              The craft
            </a>
          </nav>
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 text-center" data-testid="link-home-logo">
            <span className="atelier-heading block text-[25px] leading-none tracking-[-0.07em] sm:text-[29px]">
              ZAYTOON
            </span>
            <span className="mt-1 block text-[8px] font-medium tracking-[0.31em]">
              ATELIER
            </span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href={isSignedIn ? '/account' : '/sign-in'}
              className="hidden items-center gap-2 text-[10px] font-medium tracking-[0.14em] sm:flex"
              data-testid="link-account"
            >
              <UserRound size={17} strokeWidth={1.35} />
              <span className="uppercase">{isSignedIn ? 'Account' : 'Sign in'}</span>
            </Link>
            <Link href="/cart" className="relative flex items-center gap-2" data-testid="link-cart">
              <ShoppingBag size={18} strokeWidth={1.35} />
              <span className="hidden text-[10px] font-medium tracking-[0.14em] sm:block">BAG</span>
              <span className="flex h-[18px] min-w-[18px] items-center justify-center bg-[#c26d53] px-1 text-[9px] text-white" data-testid="text-cart-count">
                {count}
              </span>
            </Link>
          </div>
        </div>
        {open && (
          <nav className="border-t border-[#1c1c1a]/10 bg-[#fcf9f5] px-6 py-7 lg:hidden" aria-label="Mobile navigation">
            <div className="flex flex-col gap-6">
              <Link href="/shop" onClick={closeMenu} className="atelier-heading text-2xl" data-testid="mobile-link-shop">
                Shop the collection
              </Link>
              <a href={`${import.meta.env.BASE_URL}#story`} onClick={closeMenu} className="atelier-heading text-2xl">
                Our story
              </a>
              <a href={`${import.meta.env.BASE_URL}#craft`} onClick={closeMenu} className="atelier-heading text-2xl">
                The craft
              </a>
              <Link href={isSignedIn ? '/account' : '/sign-in'} onClick={closeMenu} className="atelier-label pt-2" data-testid="mobile-link-account">
                {isSignedIn ? 'My account' : 'Sign in'}
              </Link>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}

export function Footer() {
  const { isSignedIn } = useUser();
  const { signOut } = useClerk();

  return (
    <footer className="bg-[#1c1c1a] text-[#fcf9f5]">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 sm:grid-cols-2 sm:px-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-16 lg:py-20">
        <div>
          <Link href="/" className="inline-block" data-testid="footer-home-logo">
            <span className="atelier-heading block text-[27px] tracking-[-0.06em]">ZAYTOON</span>
            <span className="mt-1 block text-[8px] tracking-[0.31em]">ATELIER</span>
          </Link>
          <p className="mt-6 max-w-[270px] text-sm font-light leading-6 text-[#fcf9f5]/65">
            Palestinian heritage, carried forward in every stitch.
          </p>
        </div>
        <div>
          <p className="atelier-label mb-5 text-[#d8cab8]">Explore</p>
          <div className="flex flex-col gap-3 text-sm font-light text-[#fcf9f5]/75">
            <Link href="/shop" className="atelier-link" data-testid="footer-link-shop">All pieces</Link>
            <a href={`${import.meta.env.BASE_URL}#story`} className="atelier-link">Our story</a>
            <a href={`${import.meta.env.BASE_URL}#craft`} className="atelier-link">Craft & roots</a>
          </div>
        </div>
        <div>
          <p className="atelier-label mb-5 text-[#d8cab8]">Your atelier</p>
          <div className="flex flex-col gap-3 text-sm font-light text-[#fcf9f5]/75">
            <Link href={isSignedIn ? '/account' : '/sign-in'} className="atelier-link" data-testid="footer-link-account">My account</Link>
            {isSignedIn && <Link href="/orders" className="atelier-link" data-testid="footer-link-orders">Order history</Link>}
            {isSignedIn && <SignOutLink signOut={signOut} />}
          </div>
        </div>
        <div>
          <p className="atelier-label mb-5 text-[#d8cab8]">A note from us</p>
          <p className="text-sm font-light leading-6 text-[#fcf9f5]/65">
            A living archive of Palestinian artistry, made slowly and worn for years.
          </p>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 border-t border-[#fcf9f5]/15 px-6 py-5 text-[10px] tracking-[0.12em] text-[#fcf9f5]/50 sm:flex-row sm:justify-between sm:px-10 lg:px-16">
        <span>© {new Date().getFullYear()} Zaytoon Atelier</span>
        <span>MADE WITH MEMORY · DESIGNED FOR THE PRESENT</span>
      </div>
    </footer>
  );
}

function SignOutLink({ signOut }: { signOut: ReturnType<typeof useClerk>['signOut'] }) {
  return (
    <button
      type="button"
      className="atelier-link w-fit text-left"
      onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL || '/' })}
      data-testid="button-sign-out"
    >
      Sign out
    </button>
  );
}
