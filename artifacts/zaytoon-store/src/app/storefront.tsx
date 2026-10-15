'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/error-boundary';

const StorefrontApp = dynamic(() => import('../App'), {
  ssr: false,
  loading: () => (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#fcf9f5]">
      <p className="atelier-label" role="status">
        Loading Zaytoon Atelier…
      </p>
    </main>
  ),
});

export default function Storefront() {
  return (
    <ErrorBoundary>
      <StorefrontApp />
    </ErrorBoundary>
  );
}
