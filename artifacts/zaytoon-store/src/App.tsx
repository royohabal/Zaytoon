import { useEffect, useRef, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { CartProvider } from '@/lib/cart';
import { queryClient } from '@/lib/queryClient';
import { ErrorBoundary } from '@/components/error-boundary';
import { Footer, Header } from '@/components/store-shell';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import AccountPage from '@/pages/account';
import CartPage from '@/pages/cart';
import HomePage from '@/pages/home';
import NotFound from '@/pages/not-found';
import OrdersPage from '@/pages/orders';
import ProductDetailPage from '@/pages/product-detail';
import ShopPage from '@/pages/shop';
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#4a5844',
    colorForeground: '#1c1c1a',
    colorMutedForeground: '#66685f',
    colorDanger: '#944931',
    colorBackground: '#fcf9f5',
    colorInput: '#fcf9f5',
    colorInputForeground: '#1c1c1a',
    colorNeutral: '#c5c8be',
    fontFamily: 'Work Sans, sans-serif',
    borderRadius: '0',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fcf9f5] w-[440px] max-w-full overflow-hidden border border-[#d8cab8]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'font-serif text-[#1c1c1a]',
    headerSubtitle: 'text-[#66685f]',
    socialButtonsBlockButtonText: 'text-[#1c1c1a]',
    formFieldLabel: 'text-[#1c1c1a]',
    footerActionLink: 'text-[#4a5844] underline underline-offset-4',
    footerActionText: 'text-[#66685f]',
    dividerText: 'text-[#66685f]',
    identityPreviewEditButton: 'text-[#4a5844]',
    formFieldSuccessText: 'text-[#33412e]',
    alertText: 'text-[#77331d]',
    logoBox: 'mx-auto',
    logoImage: 'max-h-12',
    socialButtonsBlockButton: 'border-[#c5c8be] rounded-none',
    formButtonPrimary: 'bg-[#4a5844] text-[#fcf9f5] rounded-none hover:bg-[#1c1c1a]',
    formFieldInput: 'border-[#c5c8be] rounded-none text-[#1c1c1a]',
    footerAction: 'text-[#66685f]',
    dividerLine: 'bg-[#d8cab8]',
    alert: 'border-[#c26d53] bg-[#c26d53]/5',
    otpCodeFieldInput: 'border-[#c5c8be] rounded-none',
    formFieldRow: 'text-[#1c1c1a]',
    main: 'text-[#1c1c1a]',
  },
};

function CacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const priorUser = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (priorUser.current !== undefined && priorUser.current !== userId) {
        client.clear();
      }
      priorUser.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);

  return null;
}

function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh]">
      <Header />
      {children}
      <Footer />
    </div>
  );
}

function ProtectedPage({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) {
    return (
      <StoreLayout>
        <main className="flex min-h-[60vh] items-center justify-center px-6">
          <div className="h-8 w-8 animate-pulse border border-[#4a5844]" role="status" data-testid="status-auth-loading" />
        </main>
      </StoreLayout>
    );
  }
  if (!isSignedIn) {
    return <Redirect to="/sign-in" />;
  }
  return <StoreLayout>{children}</StoreLayout>;
}

function HomeRoute() {
  return <StoreLayout><HomePage /></StoreLayout>;
}

function ShopRoute() {
  return <StoreLayout><ShopPage /></StoreLayout>;
}

function ProductRoute() {
  return <StoreLayout><ProductDetailPage /></StoreLayout>;
}

function CartRoute() {
  return <StoreLayout><CartPage /></StoreLayout>;
}

function AccountRoute() {
  return <ProtectedPage><AccountPage /></ProtectedPage>;
}

function OrdersRoute() {
  return <ProtectedPage><OrdersPage /></ProtectedPage>;
}

function SignInPage() {
  return (
    <main className="grid min-h-[100dvh] bg-[#f6f3ef] lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.85fr)]">
      <div className="relative hidden min-h-[100dvh] overflow-hidden lg:block">
        <img src="/images/zaytoon-hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[#1c1c1a]/25" />
        <div className="absolute bottom-12 left-12 text-[#fcf9f5]">
          <p className="atelier-label">ZAYTOON ATELIER</p>
          <p className="atelier-heading mt-3 max-w-lg text-5xl">A living archive. Yours to return to.</p>
        </div>
      </div>
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-5 py-12 sm:px-10">
        <a href={`${basePath || ''}/`} className="mb-8 text-center">
          <span className="atelier-heading block text-[27px] tracking-[-0.07em]">ZAYTOON</span>
          <span className="mt-1 block text-[8px] tracking-[0.31em]">ATELIER</span>
        </a>
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
        <a href={`${basePath || ''}/`} className="atelier-label atelier-link mt-8 text-[9px]">RETURN TO THE ATELIER</a>
      </div>
    </main>
  );
}

function SignUpPage() {
  return (
    <main className="grid min-h-[100dvh] bg-[#f6f3ef] lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.85fr)]">
      <div className="relative hidden min-h-[100dvh] overflow-hidden lg:block">
        <img src="/images/tatreez-craft.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[#1c1c1a]/30" />
        <div className="absolute bottom-12 left-12 text-[#fcf9f5]">
          <p className="atelier-label">THREAD · PLACE · MEMORY</p>
          <p className="atelier-heading mt-3 max-w-lg text-5xl">Keep a little of the story close.</p>
        </div>
      </div>
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-5 py-12 sm:px-10">
        <a href={`${basePath || ''}/`} className="mb-8 text-center">
          <span className="atelier-heading block text-[27px] tracking-[-0.07em]">ZAYTOON</span>
          <span className="mt-1 block text-[8px] tracking-[0.31em]">ATELIER</span>
        </a>
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
        <a href={`${basePath || ''}/`} className="atelier-label atelier-link mt-8 text-[9px]">RETURN TO THE ATELIER</a>
      </div>
    </main>
  );
}

function ClerkRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'Welcome back', subtitle: 'Return to your Zaytoon Atelier account' } },
        signUp: { start: { title: 'Join the atelier', subtitle: 'Create an account and keep your collection close' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <CacheInvalidator />
      <Switch>
        <Route path="/" component={HomeRoute} />
        <Route path="/shop" component={ShopRoute} />
        <Route path="/products/:id" component={ProductRoute} />
        <Route path="/cart" component={CartRoute} />
        <Route path="/account" component={AccountRoute} />
        <Route path="/orders" component={OrdersRoute} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route component={NotFound} />
      </Switch>
    </ClerkProvider>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <WouterRouter base={basePath}>
            <RoutedErrorBoundary>
              <ClerkRoutes />
            </RoutedErrorBoundary>
          </WouterRouter>
        </CartProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
