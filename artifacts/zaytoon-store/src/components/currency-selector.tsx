import { CURRENCY_OPTIONS, useCurrency } from '@/lib/currency';

export function CurrencySelector({ mobile = false }: { mobile?: boolean }) {
  const { currency, setCurrency } = useCurrency();

  return (
    <label className={`inline-flex items-center gap-2 ${mobile ? 'w-full justify-between' : ''}`}>
      <span className={mobile ? 'atelier-label text-[10px]' : 'sr-only'}>Currency</span>
      <select
        value={currency}
        onChange={(event) => setCurrency(event.target.value as typeof currency)}
        aria-label="Display currency"
        data-testid="select-display-currency"
        className={`border border-[#c5c8be] bg-transparent px-2 py-2 text-[10px] outline-none focus:border-[#4a5844] ${
          mobile ? 'w-full max-w-[180px]' : 'max-w-[112px]'
        }`}
      >
        {CURRENCY_OPTIONS.map(({ code, label }) => (
          <option key={code} value={code}>{label}</option>
        ))}
      </select>
    </label>
  );
}
