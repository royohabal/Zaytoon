import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CurrencyCode } from '@workspace/api-client-react';

const EXCHANGE_RATES_URL = 'https://open.er-api.com/v6/latest/USD';
const CURRENCY_STORAGE_KEY = 'zaytoon-display-currency-v1';
const RATES_STORAGE_KEY = 'zaytoon-usd-rates-v1';
const MAX_CACHED_RATE_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const PROVIDER_REFRESH_GRACE_MS = 5 * 60 * 1000;
const MIN_RETRY_INTERVAL_MS = 60 * 60 * 1000;

export const CURRENCY_RATES_QUERY_KEY = ['zaytoon-usd-rates-v1'] as const;

export const CURRENCY_OPTIONS: ReadonlyArray<{ code: CurrencyCode; label: string }> = [
  { code: 'KWD', label: 'KWD · د.ك' },
  { code: 'USD', label: 'USD · $' },
  { code: 'GBP', label: 'GBP · £' },
  { code: 'EUR', label: 'EUR · €' },
  { code: 'SAR', label: 'SAR · ر.س' },
];

interface UsdRates {
  baseCurrency: 'USD';
  rates: Record<CurrencyCode, number>;
  updatedAt: string;
  nextUpdateAt: string;
}

interface ExchangeRatesProviderResponse {
  result?: unknown;
  base_code?: unknown;
  rates?: unknown;
  time_last_update_utc?: unknown;
  time_next_update_utc?: unknown;
}

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  rates: UsdRates | null;
  effectiveCurrency: CurrencyCode;
  conversionRate: number;
  canConvert: boolean;
  isLoading: boolean;
  isUnavailable: boolean;
  ratesAreStale: boolean;
  updatedAt: string | null;
  formatAmount: (amount: number, currency: CurrencyCode) => string;
  formatBasePrice: (usdAmount: number) => string;
  convertBasePrice: (usdAmount: number) => number;
  refreshRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const currencySymbols: Record<CurrencyCode, string> = {
  KWD: 'د.ك',
  USD: '$',
  GBP: '£',
  EUR: '€',
  SAR: 'ر.س',
};

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return CURRENCY_OPTIONS.some((option) => option.code === value);
}

function readStoredCurrency(): CurrencyCode {
  try {
    const saved = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    return isCurrencyCode(saved) ? saved : 'KWD';
  } catch {
    return 'KWD';
  }
}

function readStoredRates(): UsdRates | undefined {
  try {
    const saved = window.localStorage.getItem(RATES_STORAGE_KEY);
    if (!saved) return undefined;
    const parsed: unknown = JSON.parse(saved);
    const normalized = normalizeRates(parsed);
    if (!normalized || Date.now() - Date.parse(normalized.updatedAt) > MAX_CACHED_RATE_AGE_MS) {
      return undefined;
    }
    return normalized;
  } catch {
    return undefined;
  }
}

function normalizeRates(value: unknown): UsdRates | null {
  if (!value || typeof value !== 'object') return null;
  const response = value as ExchangeRatesProviderResponse & Partial<UsdRates>;
  const sourceRates =
    response.rates && typeof response.rates === 'object'
      ? (response.rates as Record<string, unknown>)
      : null;
  const hasNormalizedShape = response.baseCurrency === 'USD';
  const hasProviderShape = response.base_code === 'USD';
  if ((!hasNormalizedShape && !hasProviderShape) || !sourceRates) return null;

  const rates = {} as Record<CurrencyCode, number>;
  for (const { code } of CURRENCY_OPTIONS) {
    const rate = sourceRates[code];
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return null;
    rates[code] = rate;
  }
  if (rates.USD !== 1) return null;

  const updatedAtValue = hasNormalizedShape
    ? response.updatedAt
    : response.time_last_update_utc;
  const nextUpdateAtValue = hasNormalizedShape
    ? response.nextUpdateAt
    : response.time_next_update_utc;
  const updatedAtDate = new Date(String(updatedAtValue ?? ''));
  const nextUpdateAtDate = new Date(String(nextUpdateAtValue ?? ''));
  const updatedAtTime = updatedAtDate.getTime();
  const nextUpdateAtTime = nextUpdateAtDate.getTime();
  if (
    !Number.isFinite(updatedAtTime) ||
    !Number.isFinite(nextUpdateAtTime) ||
    updatedAtTime > Date.now() ||
    Date.now() - updatedAtTime > MAX_CACHED_RATE_AGE_MS
  ) {
    return null;
  }

  return {
    baseCurrency: 'USD',
    rates,
    updatedAt: updatedAtDate.toISOString(),
    nextUpdateAt: nextUpdateAtDate.toISOString(),
  };
}

async function fetchUsdRates(signal: AbortSignal): Promise<UsdRates> {
  const response = await fetch(EXCHANGE_RATES_URL, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) {
    throw new Error('Currency conversion rates are temporarily unavailable.');
  }

  const normalized = normalizeRates(await response.json());
  if (!normalized) {
    throw new Error('The exchange-rate response was incomplete or too old.');
  }
  try {
    window.localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // The live response remains usable when browser storage is unavailable.
  }
  return normalized;
}

export function formatCurrencyAmount(amount: number, currency: CurrencyCode): string {
  const decimals = currency === 'KWD' ? 3 : 2;
  const number = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(amount) ? amount : 0);
  return currency === 'USD' || currency === 'GBP' || currency === 'EUR'
    ? `${currencySymbols[currency]}${number}`
    : `${currencySymbols[currency]} ${number}`;
}

function formatRateDate(value: string): string {
  return `${new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value))} UTC`;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState(readStoredCurrency);
  const query = useQuery({
    queryKey: CURRENCY_RATES_QUERY_KEY,
    queryFn: ({ signal }) => fetchUsdRates(signal),
    initialData: readStoredRates,
    staleTime: (currentQuery) => {
      const nextUpdateAt = currentQuery.state.data?.nextUpdateAt;
      if (!nextUpdateAt) return 0;
      return Math.max(
        0,
        Date.parse(nextUpdateAt) + PROVIDER_REFRESH_GRACE_MS - Date.now(),
      );
    },
    refetchInterval: (currentQuery) => {
      const nextUpdateAt = currentQuery.state.data?.nextUpdateAt;
      if (!nextUpdateAt) return MIN_RETRY_INTERVAL_MS;
      const untilRefresh =
        Date.parse(nextUpdateAt) + PROVIDER_REFRESH_GRACE_MS - Date.now();
      return Math.max(MIN_RETRY_INTERVAL_MS, untilRefresh);
    },
    refetchOnWindowFocus: true,
    retry: false,
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } catch {
      return;
    }
  }, [currency]);

  const value = useMemo<CurrencyContextValue>(() => {
    const rates = query.data ?? null;
    const canConvert = currency === 'USD' || rates !== null;
    const effectiveCurrency = canConvert ? currency : 'USD';
    const conversionRate =
      currency === 'USD' ? 1 : rates?.rates[currency] ?? 1;
    const formatAmount = (amount: number, targetCurrency: CurrencyCode) =>
      formatCurrencyAmount(amount, targetCurrency);
    const convertBasePrice = (usdAmount: number) => usdAmount * conversionRate;

    return {
      currency,
      setCurrency,
      rates,
      effectiveCurrency,
      conversionRate,
      canConvert,
      isLoading: query.isPending && rates === null,
      isUnavailable: query.isError && rates === null,
      ratesAreStale:
        rates !== null &&
        (query.isError || Date.now() >= Date.parse(rates.nextUpdateAt)),
      updatedAt: rates?.updatedAt ?? null,
      formatAmount,
      formatBasePrice: (usdAmount) =>
        formatCurrencyAmount(convertBasePrice(usdAmount), effectiveCurrency),
      convertBasePrice,
      refreshRates: async () => {
        await query.refetch();
      },
    };
  }, [currency, query.data, query.isError, query.isPending, query.refetch]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used inside CurrencyProvider');
  }
  return context;
}

export function CurrencyStatusBanner() {
  const {
    rates,
    isLoading,
    isUnavailable,
    ratesAreStale,
    updatedAt,
    refreshRates,
  } = useCurrency();
  const message = isUnavailable
    ? 'Exchange rates are unavailable. Prices are shown in USD; select USD or try again before ordering in another currency.'
    : isLoading
      ? 'Loading exchange rates. Prices are shown in USD until they are available.'
      : ratesAreStale && updatedAt
        ? `Live exchange rates are unavailable or due for an update. Using rates last published ${formatRateDate(updatedAt)}.`
        : null;

  if (!message || !rates && !isLoading && !isUnavailable) return null;

  return (
    <aside
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-[#d8cab8] bg-[#f6f3ef] px-4 py-2 text-center text-[11px] text-[#66685f]"
      role="status"
      data-testid="status-currency-rates"
    >
      <span>{message}</span>
      {(isUnavailable || (ratesAreStale && rates)) && (
        <button
          type="button"
          className="underline underline-offset-2 hover:text-[#1c1c1a]"
          onClick={() => void refreshRates()}
        >
          Try again
        </button>
      )}
    </aside>
  );
}

