import { createContext, useContext, type ReactNode } from "react";

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCurrencyAmount(amount: number): string {
  return usdFormatter.format(Number.isFinite(amount) ? amount : 0);
}

interface CurrencyContextValue {
  formatBasePrice: (usdAmount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  formatBasePrice: formatCurrencyAmount,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  return (
    <CurrencyContext.Provider value={{ formatBasePrice: formatCurrencyAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
