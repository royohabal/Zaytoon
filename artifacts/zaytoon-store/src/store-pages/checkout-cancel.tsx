import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { Enter, Reveal } from '@/lib/motion';

export default function CheckoutCancelPage() {
  return (
    <main className="mx-auto min-h-[60vh] max-w-[1440px] px-6 py-16 sm:py-24" data-testid="page-checkout-cancel">
      <Reveal className="mx-auto max-w-2xl border-b border-[#d8cab8] pb-7 text-center">
        <p className="atelier-label text-[#944931]">ZAYTOON ATELIER · CHECKOUT</p>
        <h1 className="atelier-heading mt-4 text-4xl sm:text-5xl">Your bag is still here.</h1>
      </Reveal>
      <Enter className="mx-auto max-w-xl pt-9 text-center">
        <p className="text-sm leading-6 text-[#66685f]">
          Payment was canceled before completion. Your cart is unchanged, and no order was placed.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/cart"
            className="inline-flex items-center justify-center gap-3 bg-[#4a5844] px-7 py-4 atelier-label text-[#fcf9f5] hover:bg-[#1c1c1a]"
            data-testid="link-return-to-cart"
          >
            RETURN TO YOUR BAG <ArrowRight size={14} />
          </Link>
          <Link
            href="/shop"
            className="border border-[#1c1c1a] px-7 py-4 atelier-label hover:bg-[#4a5844] hover:text-[#fcf9f5]"
            data-testid="link-cancel-continue-shopping"
          >
            CONTINUE EXPLORING
          </Link>
        </div>
      </Enter>
    </main>
  );
}
