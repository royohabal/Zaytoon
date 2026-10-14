import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useUser } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Minus, Plus, Trash2 } from 'lucide-react';
import { AnimatedPrice, EASE, Enter, FadeImage } from '@/lib/motion';
import { getGetMyOrdersQueryKey, useCreateOrder, type CurrencyCode } from '@workspace/api-client-react';
import { useCart } from '@/lib/cart';
import { CURRENCY_RATES_QUERY_KEY, formatCurrencyAmount, useCurrency } from '@/lib/currency';
import { EmptyState } from '@/components/page-states';

function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = error.data;
    if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
      return data.error;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'We could not place this order. Please try again.';
}

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const {
    currency,
    effectiveCurrency,
    rates,
    canConvert,
    convertBasePrice,
    formatAmount,
    refreshRates,
  } = useCurrency();
  const { isSignedIn } = useUser();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [placedOrder, setPlacedOrder] = useState<{
    orderNumber: string;
    displayTotal: number;
    displayCurrency: CurrencyCode;
  } | null>(null);
  const reduce = useReducedMotion();
  const pageMotion = {
    initial: reduce ? false as const : { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0, pointerEvents: 'none' as const },
    transition: { duration: reduce ? 0 : 0.25 },
  };
  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: async (order) => {
        clearCart();
        setPlacedOrder({
          orderNumber: order.orderNumber,
          displayTotal: order.displayTotal,
          displayCurrency: order.displayCurrency,
        });
        await queryClient.invalidateQueries({ queryKey: getGetMyOrdersQueryKey() });
      },
      onError: async (error) => {
        if (
          error &&
          typeof error === 'object' &&
          'status' in error &&
          error.status === 409
        ) {
          await queryClient.invalidateQueries({ queryKey: CURRENCY_RATES_QUERY_KEY });
        }
      },
    },
  });

  const placeOrder = async () => {
    if (currency !== 'USD' && !canConvert) {
      await refreshRates();
      return;
    }
    if (!isSignedIn) {
      setLocation('/sign-in');
      return;
    }
    createOrder.mutate({
      data: {
        items: items.map((item) => ({
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
        })),
        displayCurrency: currency,
        exchangeRateDate:
          currency === 'USD' || !rates ? null : new Date(rates.updatedAt),
      },
    });
  };

  if (placedOrder) {
    return (
      <AnimatePresence mode="wait"><motion.main key="received" {...pageMotion} className="mx-auto min-h-[60vh] max-w-[1440px] px-6 py-20 text-center sm:py-28" data-testid="status-order-created">
        <p className="atelier-label text-[#4a5844]">ORDER RECEIVED</p>
        <h1 className="atelier-heading mt-4 text-4xl sm:text-5xl">Your order has been received.</h1>
        <p className="mt-4 text-sm text-[#66685f]">
          Your order number is <span className="font-medium text-[#1c1c1a]">{placedOrder.orderNumber}</span>.
        </p>
        <p className="mt-3 text-sm text-[#66685f]" data-testid="text-order-confirmation-total">
          Saved order total: {formatCurrencyAmount(placedOrder.displayTotal, placedOrder.displayCurrency)}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => setLocation('/orders')} className="bg-[#4a5844] px-7 py-4 atelier-label text-[#fcf9f5] hover:bg-[#1c1c1a]" data-testid="button-view-orders">VIEW MY ORDERS</button>
          <Link href="/shop" className="border border-[#1c1c1a] px-7 py-4 atelier-label hover:bg-[#4a5844] hover:text-[#fcf9f5]" data-testid="link-continue-shopping">CONTINUE EXPLORING</Link>
        </div>
      </motion.main></AnimatePresence>
    );
  }

  if (!items.length) {
    return (
      <AnimatePresence mode="wait"><motion.main key="empty" {...pageMotion} className="mx-auto max-w-[1440px] px-6 py-12 sm:px-10">
        <div className="border-b border-[#d8cab8] pb-7">
          <p className="atelier-label text-[#944931]">YOUR SELECTION</p>
          <h1 className="atelier-heading mt-3 text-5xl">The bag</h1>
        </div>
        <Enter><EmptyState title="Your bag is waiting." copy="Pieces chosen with care belong here. Take a look through the collection." /></Enter>
      </motion.main></AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait"><motion.main key="bag" {...pageMotion} className="mx-auto min-h-[65vh] max-w-[1440px] px-5 pb-20 pt-10 sm:px-10 sm:pt-16 lg:px-16">
      <div className="border-b border-[#d8cab8] pb-8">
        <p className="atelier-label text-[#944931]">YOUR SELECTION · {items.length} {items.length === 1 ? 'PIECE' : 'PIECES'}</p>
        <h1 className="atelier-heading mt-3 text-5xl sm:text-6xl">The bag</h1>
      </div>
      <div className="grid gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
        <div>
          <AnimatePresence>
          {items.map((item) => (
            <motion.article layout="position" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35, ease: EASE }} key={`${item.productId}-${item.size}`} className="grid grid-cols-[100px_1fr] gap-4 border-b border-[#d8cab8] py-5 sm:grid-cols-[150px_1fr] sm:gap-6" data-testid={`row-cart-item-${item.productId}-${item.size}`}>
              <Link href={`/products/${item.productId}`} className="product-image aspect-[4/5]" data-testid={`link-cart-product-${item.productId}`}>
                <FadeImage src={item.image} alt={item.name} className="h-full w-full object-cover" />
              </Link>
              <div className="flex flex-col justify-between py-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link href={`/products/${item.productId}`} className="atelier-heading text-xl sm:text-2xl" data-testid={`text-cart-product-${item.productId}`}>{item.name}</Link>
                    <p className="mt-2 text-xs text-[#66685f]">Size: {item.size}</p>
                  </div>
                  <AnimatedPrice
                    value={convertBasePrice(item.unitPrice * item.quantity)}
                    formatValue={(amount) => formatAmount(amount, effectiveCurrency)}
                    className="atelier-label whitespace-nowrap"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-[#c5c8be]">
                    <button type="button" onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`} className="flex h-9 w-9 items-center justify-center" data-testid={`button-cart-minus-${item.productId}`}><Minus size={13} /></button>
                    <span className="w-8 text-center text-sm" data-testid={`text-cart-quantity-${item.productId}`}>{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`} className="flex h-9 w-9 items-center justify-center" data-testid={`button-cart-plus-${item.productId}`}><Plus size={13} /></button>
                  </div>
                  <button type="button" onClick={() => removeItem(item.productId, item.size)} className="inline-flex items-center gap-2 text-[10px] tracking-[0.12em] text-[#66685f] hover:text-[#944931]" data-testid={`button-remove-${item.productId}`}>
                    <Trash2 size={14} strokeWidth={1.4} /><span className="hidden sm:inline">REMOVE</span>
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
          </AnimatePresence>
          <Link href="/shop" className="atelier-label atelier-link mt-6 inline-flex items-center gap-2" data-testid="link-back-to-shop">
            <ArrowRight size={13} className="rotate-180" /> Continue exploring
          </Link>
        </div>
        <aside className="h-fit border border-[#d8cab8] bg-[#f6f3ef] p-5 sm:p-7">
          <p className="atelier-label">ORDER SUMMARY</p>
          <div className="mt-6 flex justify-between border-b border-[#d8cab8] pb-4 text-sm">
            <span>Subtotal</span>
            <AnimatedPrice
              value={convertBasePrice(subtotal)}
              formatValue={(amount) => formatAmount(amount, effectiveCurrency)}
              data-testid="text-cart-subtotal"
            />
          </div>
          <div className="flex justify-between border-b border-[#d8cab8] py-4 text-sm">
            <span>Delivery</span>
            <span className="text-xs text-[#66685f]">Not included</span>
          </div>
          <p className="mt-4 text-xs font-light leading-5 text-[#66685f]">This order saves the item subtotal and selected currency. Delivery and online payment are not processed by this site.</p>
          <AnimatePresence>
          {createOrder.isError && (
            <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="mt-4 border-l-2 border-[#944931] bg-[#944931]/5 px-3 py-2 text-xs leading-5 text-[#77331d]" role="alert" data-testid="status-order-error">
              {errorMessage(createOrder.error)}
            </motion.p>
          )}
          </AnimatePresence>
          <button
            type="button"
            onClick={placeOrder}
            disabled={createOrder.isPending || (currency !== 'USD' && !canConvert)}
            className="mt-7 flex w-full items-center justify-center gap-3 bg-[#4a5844] px-5 py-4 atelier-label text-[#fcf9f5] transition-colors hover:bg-[#1c1c1a] disabled:cursor-not-allowed disabled:opacity-70"
            data-testid="button-place-order"
          >
            {createOrder.isPending
              ? 'PLACING YOUR ORDER…'
              : currency !== 'USD' && !canConvert
                ? 'CURRENCY RATES UNAVAILABLE'
                : isSignedIn
                  ? 'PLACE ORDER'
                  : 'SIGN IN TO PLACE ORDER'}
            {!createOrder.isPending && <ArrowRight size={14} />}
          </button>
          <p className="mt-4 text-center text-[10px] leading-5 text-[#74766f]">Prices and availability are rechecked when your order is placed. Online payment is not enabled here.</p>
        </aside>
      </div>
    </motion.main></AnimatePresence>
  );
}
