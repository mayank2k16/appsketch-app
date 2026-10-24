/**
 * The cart's currency: INR in India, USD everywhere else — the server
 * decides from the request's country (nginx geoip) and returns it as
 * `currency` on the catalogue and domain search. Rupees stay the source of
 * truth here (prices, discount validation); display converts them the way
 * the server does (× rate_from_inr, 2 places) unless the server sent the
 * exact amount (`price` / `amount`). Checkout charges the server's total.
 */
import { foreign, inr } from '@/components/services/format';

import { useCatalogue } from './use-app-cart';

export type CartCurrency = {
  code: string;
  symbol: string;
  rate_from_inr: string;
};

export const INR: CartCurrency = {
  code: 'INR',
  symbol: '₹',
  rate_from_inr: '1',
};

const isInr = (c: CartCurrency) => c.code === 'INR';

/** An INR amount in `c` (server rounding: 2 places, half up). */
export function convert(amountInr: number, c: CartCurrency): number {
  if (isInr(c)) return amountInr;
  const v = amountInr * Number(c.rate_from_inr || 0);
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/** "$10.79" / "$12" / "₹1,250" — an amount already in `c`. */
export function format(n: number, c: CartCurrency): string {
  return isInr(c) ? inr(n) : foreign(Math.abs(n), c.symbol);
}

export type Money = {
  currency: CartCurrency;
  /** An INR amount for display; `exact` is the server's own figure in the
   *  cart currency when it sent one. */
  money: (amountInr: number, exact?: number | null) => string;
  /** Like `money` with the sign kept: −$5.40 for a discount line. */
  signed: (amountInr: number, exact?: number | null) => string;
  /** For AnimatedTotal (which takes rupees). */
  rate: number;
  symbol: string;
};

export function moneyFor(c: CartCurrency): Money {
  const money = (amountInr: number, exact?: number | null) =>
    format(exact ?? convert(amountInr, c), c);
  const signed = (amountInr: number, exact?: number | null) =>
    amountInr < 0
      ? `−${money(-amountInr, exact == null ? null : -exact)}`
      : money(amountInr, exact);
  return {
    currency: c,
    money,
    signed,
    rate: isInr(c) ? 1 : Number(c.rate_from_inr || 0),
    symbol: c.symbol,
  };
}

/** The cart currency from the (cached, AllowAny) catalogue; INR until it
 *  has loaded or when the server is older than currencies. */
export function useMoney(): Money {
  const c = useCatalogue().data?.currency ?? INR;
  return moneyFor(c);
}
