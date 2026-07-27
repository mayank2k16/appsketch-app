/**
 * Domain price parsing — ported from the web reference
 * (`HomeV3/CartPage/utils.js`'s `getDomainPriceFromItem`/`formatINR`, and
 * the inline per-option math in `Cart.jsx`'s registration-period grid).
 * Registrar responses are USD by default; this app bills in INR, so
 * everything gets converted at the same hardcoded rate the web reference
 * uses — there's no live FX endpoint on either side.
 */
import type { DomainRegisterOption, DomainSearchResult } from '@/api/domains/types';

export const USD_TO_INR = 83.0;

export function formatINR(amount: number): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${Number(amount || 0).toFixed(2)}`;
  }
}

/** INR price for one specific year/price option from a search result's register array. */
export function priceForRegisterOption(option: DomainRegisterOption): number {
  const currency = (option.currency || 'USD').toUpperCase();
  const basePrice = parseFloat(String(option.your_price ?? option.price ?? ''));
  const additionalCost = parseFloat(String(option.additional_cost ?? 0));
  const totalUSD = (Number.isNaN(basePrice) ? 0 : basePrice) + (Number.isNaN(additionalCost) ? 0 : additionalCost);
  return currency === 'USD' ? totalUSD * USD_TO_INR : totalUSD;
}

/** Default INR price for a search result — premium price if flagged, else the 1-year
 * (or first available) registration option, else whatever flat price shape the
 * response has. Mirrors `getDomainPriceFromItem` exactly, including its fallback order. */
export function getDomainPriceFromItem(item: DomainSearchResult | null | undefined): number {
  if (!item) return 0;

  if (item.premium && item.premium_price) {
    const p = parseFloat(String(item.premium_price));
    if (!Number.isNaN(p)) return p * USD_TO_INR;
  }

  const registerArray = item.pricing?.pricing?.register ?? [];
  if (registerArray.length > 0) {
    const oneYear = registerArray.find((r) => Number(r.years) === 1) ?? registerArray[0];
    return priceForRegisterOption(oneYear);
  }

  const registration = item.pricing?.registration;
  const possible = [
    typeof registration === 'object' ? registration?.price : undefined,
    typeof registration !== 'object' ? registration : undefined,
    item.pricing?.price,
  ];
  for (const v of possible) {
    const n = parseFloat(String(v));
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

export function domainRegisterOptions(item: DomainSearchResult | null | undefined): DomainRegisterOption[] {
  return item?.pricing?.pricing?.register ?? [];
}
