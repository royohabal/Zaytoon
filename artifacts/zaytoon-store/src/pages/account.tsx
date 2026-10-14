import { Link } from 'wouter';
import { Reveal } from '@/lib/motion';
import { useClerk, useUser } from '@clerk/react';
import { ArrowRight, UserRound } from 'lucide-react';

export default function AccountPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) {
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-[1440px] items-center justify-center px-6">
        <div className="h-8 w-8 animate-pulse border border-[#4a5844]" role="status" data-testid="status-account-loading" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[65vh] max-w-[1440px] px-5 pb-20 pt-10 sm:px-10 sm:pt-16 lg:px-16">
      <div className="border-b border-[#d8cab8] pb-8">
        <p className="atelier-label text-[#944931]">YOUR ATELIER</p>
        <h1 className="atelier-heading mt-3 text-5xl sm:text-6xl">Account</h1>
      </div>
      <div className="grid gap-10 pt-10 lg:grid-cols-[300px_1fr] lg:gap-16">
        <Reveal><aside className="border border-[#d8cab8] bg-[#f6f3ef] p-6">
          <div className="flex h-14 w-14 items-center justify-center border border-[#4a5844] text-[#4a5844]">
            <UserRound size={22} strokeWidth={1.2} />
          </div>
          <p className="atelier-heading mt-5 text-2xl" data-testid="text-account-name">
            {user?.fullName || 'Atelier customer'}
          </p>
          <p className="mt-2 text-sm font-light text-[#66685f]" data-testid="text-account-email">
            {user?.primaryEmailAddress?.emailAddress}
          </p>
          <button type="button" onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL || '/' })} className="atelier-label mt-7 border-b border-[#1c1c1a] pb-1" data-testid="button-account-sign-out">
            SIGN OUT
          </button>
        </aside></Reveal>
        <Reveal delay={0.1}><div>
          <p className="atelier-label text-[#944931]">YOUR DETAILS</p>
          <h2 className="atelier-heading mt-3 text-3xl">Welcome back{user?.firstName ? `, ${user.firstName}` : ''}.</h2>
          <p className="mt-4 max-w-xl text-sm font-light leading-7 text-[#66685f]">
            Your account keeps your atelier orders close. Check in on a piece as it makes its way to you.
          </p>
          <Link href="/orders" className="mt-8 inline-flex items-center gap-3 border border-[#1c1c1a] px-6 py-4 atelier-label transition-colors hover:bg-[#4a5844] hover:text-[#fcf9f5]" data-testid="link-account-orders">
            VIEW ORDER HISTORY <ArrowRight size={14} />
          </Link>
        </div></Reveal>
      </div>
    </main>
  );
}
