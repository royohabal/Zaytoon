import type { CurrencyCode } from "@workspace/api-zod";

const EXCHANGE_RATES_URL = "https://open.er-api.com/v6/latest/USD";
const MAX_RATE_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_RETRY_INTERVAL_MS = 60 * 60 * 1000;
const REFRESH_AFTER_PROVIDER_UPDATE_MS = 5 * 60 * 1000;
const supportedCurrencies: CurrencyCode[] = ["USD", "KWD", "GBP", "EUR", "SAR"];

interface CachedRates {
  rates: Record<CurrencyCode, number>;
  updatedAt: Date;
  nextUpdateAt: Date;
  retryAt: number;
}

interface ProviderResponse {
  result?: unknown;
  base_code?: unknown;
  time_last_update_utc?: unknown;
  time_next_update_utc?: unknown;
  rates?: unknown;
}

export class ExchangeRatesUnavailableError extends Error {
  constructor() {
    super("Currency conversion rates are temporarily unavailable.");
    this.name = "ExchangeRatesUnavailableError";
  }
}

let cachedRates: CachedRates | null = null;

function positiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function parseProviderResponse(value: unknown, now: number): CachedRates {
  if (!value || typeof value !== "object") {
    throw new ExchangeRatesUnavailableError();
  }

  const response = value as ProviderResponse;
  const rates = response.rates;
  if (
    response.result !== "success" ||
    response.base_code !== "USD" ||
    !rates ||
    typeof rates !== "object"
  ) {
    throw new ExchangeRatesUnavailableError();
  }

  const rateValues = rates as Record<string, unknown>;
  const selectedRates = {} as Record<CurrencyCode, number>;
  for (const currency of supportedCurrencies) {
    if (!positiveNumber(rateValues[currency])) {
      throw new ExchangeRatesUnavailableError();
    }
    selectedRates[currency] = rateValues[currency];
  }

  const updatedAt = new Date(String(response.time_last_update_utc ?? ""));
  const nextUpdateAt = new Date(String(response.time_next_update_utc ?? ""));
  const age = now - updatedAt.getTime();
  if (
    !Number.isFinite(updatedAt.getTime()) ||
    !Number.isFinite(nextUpdateAt.getTime()) ||
    age < 0 ||
    age > MAX_RATE_AGE_MS ||
    selectedRates.USD !== 1
  ) {
    throw new ExchangeRatesUnavailableError();
  }

  return {
    rates: selectedRates,
    updatedAt,
    nextUpdateAt,
    retryAt: Math.max(
      now + MIN_RETRY_INTERVAL_MS,
      nextUpdateAt.getTime() + REFRESH_AFTER_PROVIDER_UPDATE_MS,
    ),
  };
}

async function loadUsdRates(): Promise<CachedRates> {
  const now = Date.now();
  if (cachedRates && now < cachedRates.retryAt) {
    return cachedRates;
  }

  try {
    const response = await fetch(EXCHANGE_RATES_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      throw new ExchangeRatesUnavailableError();
    }

    const updatedRates = parseProviderResponse(await response.json(), Date.now());
    cachedRates = updatedRates;
    return updatedRates;
  } catch {
    if (
      cachedRates &&
      Date.now() - cachedRates.updatedAt.getTime() <= MAX_RATE_AGE_MS
    ) {
      cachedRates = {
        ...cachedRates,
        retryAt: Date.now() + MIN_RETRY_INTERVAL_MS,
      };
      return cachedRates;
    }
    throw new ExchangeRatesUnavailableError();
  }
}

export async function getUsdExchangeRate(currency: CurrencyCode): Promise<{
  rate: number;
  updatedAt: Date | null;
}> {
  if (currency === "USD") {
    return { rate: 1, updatedAt: null };
  }

  const rates = await loadUsdRates();
  return {
    rate: rates.rates[currency],
    updatedAt: rates.updatedAt,
  };
}

