import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { useUser } from '@clerk/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmCheckoutSession, getGetMyOrdersQueryKey } from '@workspace/api-client-react';
import { Enter, Reveal } from '@/lib/motion';
import { useCart } from '@/lib/cart';
import { formatCurrencyAmount } from '@/lib/currency';

function confirmationError(error: unknown): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = error.data;
    if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
      return data.error;
    }
  }
  return 'We could not verify the payment yet. Please try again.';
}

export default function CheckoutSuccessPage() {
  const [sessionId] = useState(
    () => new URLSearchParams(window.location.search).get('session_id') ?? '',
  );
  const { isLoaded, isSignedIn } = useUser();
  const { clearCart } = useCart();
  const queryClient = useQueryClient();
  const started = useRef(false);
  const confirmation = useMutation({
    mutationFn: (id: string) =>
      confirmCheckoutSession(
        { sessionId: id },
        { signal: AbortSignal.timeout(20_000) },
      ),
    onSuccess: () => {
      clearCart();
      void queryClient.invalidateQueries({ queryKey: getGetMyOrdersQueryKey() });
    },
  });

  const confirmSession = useCallback(() => {
    if (!sessionId) return;
    confirmation.mutate(sessionId);
  }, [confirmation.mutate, sessionId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !sessionId || started.current) return;
    started.current = true;
    confirmSession();
  }, [confirmSession, isLoaded, isSignedIn, sessionId]);

  const order = confirmation.data;

  return (
    <main className="mx-auto min-h-[60vh] max-w-[1440px] px-6 py-16 sm:py-24" data-testid="page-checkout-success">
      <Reveal className="mx-auto max-w-2xl border-b border-[#d8cab8] pb-7 text-center">
        <p className="atelier-label text-[#4a5844]">ZAYTOON ATELIER · CHECKOUT</p>
        <h1 className="atelier-heading mt-4 text-4xl sm:text-5xl">
          {order
            ? 'Payment received.'
            : isLoaded && !isSignedIn
              ? 'Sign-in needed to confirm.'
              : confirmation.isError
                ? 'We could not confirm your order yet.'
                : 'Confirming your order.'}
        </h1>
      </Reveal>

      <Enter className="mx-auto max-w-xl pt-9 text-center">
        {!sessionId ? (
          <p className="text-sm leading-6 text-[#66685f]" role="alert">
            This confirmation link is missing its Checkout Session. Check your order history or return to your bag.
          </p>
        ) : !isLoaded ? (
          <p className="text-sm text-[#66685f]" role="status">Checking your account…</p>
        ) : !isSignedIn ? (
          <>
            <p className="text-sm leading-6 text-[#66685f]">
              Your account session is not active on this hostname. Sign in to verify the Stripe payment and see whether the order was saved. Confirming will not charge you again.
            </p>
            <Link
              href={`/sign-in?redirect_url=${encodeURIComponent(`/checkout/success?session_id=${sessionId}`)}`}
              className="mt-7 inline-block bg-[#4a5844] px-7 py-4 atelier-label text-[#fcf9f5] hover:bg-[#1c1c1a]"
              data-testid="link-checkout-sign-in"
            >
              SIGN IN TO CONTINUE
            </Link>
          </>
        ) : confirmation.isPending || !order && !confirmation.isError ? (
          <p className="text-sm text-[#66685f]" role="status">Verifying the payment with Stripe…</p>
        ) : confirmation.isError ? (
          <>
            <p className="text-sm leading-6 text-[#77331d]" role="alert" data-testid="status-checkout-confirmation-error">
              {confirmationError(confirmation.error)}
            </p>
            <button
              type="button"
              onClick={confirmSession}
              className="mt-7 bg-[#4a5844] px-7 py-4 atelier-label text-[#fcf9f5] hover:bg-[#1c1c1a]"
              data-testid="button-retry-checkout-confirmation"
            >
              TRY AGAIN
            </button>
          </>
        ) : order ? (
          <>
            <p className="text-sm leading-6 text-[#66685f]">
              Your order number is <span className="font-medium text-[#1c1c1a]">{order.orderNumber}</span>.
            </p>
            <p className="mt-3 text-sm text-[#66685f]" data-testid="text-checkout-confirmation-total">
              Order total: {formatCurrencyAmount(order.displayTotal, order.displayCurrency)}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/orders"
                className="bg-[#4a5844] px-7 py-4 atelier-label text-[#fcf9f5] hover:bg-[#1c1c1a]"
                data-testid="link-checkout-orders"
              >
                VIEW MY ORDERS
              </Link>
              <Link
                href="/shop"
                className="border border-[#1c1c1a] px-7 py-4 atelier-label hover:bg-[#4a5844] hover:text-[#fcf9f5]"
                data-testid="link-checkout-continue-shopping"
              >
                CONTINUE EXPLORING
              </Link>
            </div>
          </>
        ) : null}
      </Enter>
    </main>
  );
}
