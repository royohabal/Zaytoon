import { Link } from 'wouter';
import { useGetMyOrders } from '@workspace/api-client-react';
import { ErrorState, EmptyState, LoadingState } from '@/components/page-states';
import { resolveImageSource } from '@/lib/image-source';
import { formatCurrencyAmount } from '@/lib/currency';

function isUnauthorized(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as { status?: number; response?: { status?: number } };
  return candidate.status === 401 || candidate.response?.status === 401;
}

export default function OrdersPage() {
  const query = useGetMyOrders();

  return (
    <main className="mx-auto min-h-[65vh] max-w-[1440px] px-5 pb-20 pt-10 sm:px-10 sm:pt-16 lg:px-16">
      <div className="border-b border-[#d8cab8] pb-8">
        <p className="atelier-label text-[#944931]">YOUR ATELIER ARCHIVE</p>
        <h1 className="atelier-heading mt-3 text-5xl sm:text-6xl">Order history</h1>
      </div>
      {query.isLoading ? (
        <LoadingState label="Gathering your orders" />
      ) : query.isError && isUnauthorized(query.error) ? (
        <div className="mx-auto max-w-xl py-20 text-center" data-testid="status-orders-sign-in-required">
          <p className="atelier-label text-[#944931]">A PRIVATE ARCHIVE</p>
          <h2 className="atelier-heading mt-4 text-3xl">Sign in to view your orders.</h2>
          <p className="mt-3 text-sm leading-6 text-[#66685f]">Your order history is only visible to you.</p>
          <Link href="/sign-in" className="mt-7 inline-block bg-[#4a5844] px-7 py-3 atelier-label text-[#fcf9f5]" data-testid="link-orders-sign-in">SIGN IN</Link>
        </div>
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} title="Your order archive is unavailable" />
      ) : query.data?.length ? (
        <div className="divide-y divide-[#d8cab8]">
          {query.data.map((order) => (
            <article key={order.id} className="grid gap-5 py-7 sm:grid-cols-[1fr_auto] sm:items-center" data-testid={`card-order-${order.id}`}>
              <div>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <h2 className="atelier-heading text-2xl">Order {order.orderNumber}</h2>
                  <span className="atelier-label text-[9px] text-[#4a5844]" data-testid={`status-order-${order.id}`}>{order.status.toUpperCase()}</span>
                </div>
                <p className="mt-2 text-xs text-[#74766f]">{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {order.items.map((item, index) => (
                    <div key={`${item.productId}-${item.size}-${index}`} className="flex items-center gap-3 border border-[#d8cab8] p-2" data-testid={`row-order-item-${order.id}-${index}`}>
                      {item.image && <img src={resolveImageSource(item.image)} alt="" className="h-16 w-12 object-cover" />}
                      <div>
                        <p className="atelier-heading text-base">{item.name}</p>
                        <p className="mt-1 text-[10px] text-[#66685f]">SIZE {item.size} · QTY {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="atelier-label sm:text-right" data-testid={`text-order-total-${order.id}`}>
                {formatCurrencyAmount(order.displayTotal, order.displayCurrency)}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="Your story here is just beginning." copy="Once you place an order, it will find a place in your personal archive." />
      )}
    </main>
  );
}
