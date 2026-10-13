import { Link } from 'wouter';
import { LoaderCircle, RotateCw } from 'lucide-react';

export function LoadingState({ label = 'Gathering the collection' }: { label?: string }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-center" role="status" data-testid="status-loading">
      <LoaderCircle size={24} className="animate-spin text-[#4a5844]" strokeWidth={1.2} />
      <p className="atelier-label text-[#74766f]">{label}</p>
      <div className="h-1 w-24 overflow-hidden bg-[#e5e2de]">
        <div className="h-full w-1/2 animate-pulse bg-[#4a5844]" />
      </div>
    </div>
  );
}

export function ErrorState({
  onRetry,
  title = 'The atelier is momentarily quiet',
  description = 'We could not reach the collection just now. Please try again in a little while.',
}: {
  onRetry: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-20 text-center" data-testid="status-database-error">
      <p className="atelier-label text-[#944931]">A moment, please</p>
      <h2 className="atelier-heading mt-4 text-3xl">{title}</h2>
      <p className="mt-4 max-w-md text-sm leading-6 text-[#66685f]">{description}</p>
      <button type="button" onClick={onRetry} className="mt-7 inline-flex items-center gap-2 border border-[#1c1c1a] px-6 py-3 atelier-label transition-colors hover:bg-[#4a5844] hover:text-[#fcf9f5]" data-testid="button-retry">
        <RotateCw size={14} /> Try again
      </button>
    </div>
  );
}

export function apiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = error.data;
    if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
      return data.error;
    }
  }
  return 'The MongoDB Atlas catalogue could not be reached. Check its setup and try again.';
}

export function EmptyState({ title, copy, action = true }: { title: string; copy: string; action?: boolean }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center" data-testid="status-empty">
      <span className="h-8 w-8 border border-[#944931] p-[7px]" aria-hidden="true">
        <span className="block h-full w-full border border-[#944931]" />
      </span>
      <h2 className="atelier-heading mt-6 text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[#66685f]">{copy}</p>
      {action && (
        <Link href="/shop" className="mt-7 bg-[#4a5844] px-7 py-3 atelier-label text-[#fcf9f5] transition-colors hover:bg-[#1c1c1a]" data-testid="link-empty-shop">
          Explore the collection
        </Link>
      )}
    </div>
  );
}
