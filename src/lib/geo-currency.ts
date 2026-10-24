/**
 * The app's currency, decided once at launch (during the splash): India
 * pays INR, everyone else USD — the website's rule. The device region gives
 * an instant first guess; appsketch.ai's /currency-geo (the same geoip the
 * website uses) confirms it and the answer is kept for the next launch.
 *
 * Every price request sends it explicitly (`?currency=` / body `currency`),
 * so plans, the services catalogue, domain search and checkout all agree.
 * App Store subscriptions still show StoreKit's own price when the product
 * is loaded: Apple charges in the storefront's currency, not ours.
 */
import axios from 'axios';
import { getLocales } from 'expo-localization';
import { create } from 'zustand';

import { getItem, setItem } from './storage';

export type AppCurrency = 'INR' | 'USD';

const KEY = 'geo_currency_v1';
const GEO_URL = 'https://appsketch.ai/currency-geo';

function deviceGuess(): AppCurrency {
  try {
    return getLocales()[0]?.regionCode?.toUpperCase() === 'IN' ? 'INR' : 'USD';
  } catch {
    return 'INR';
  }
}

type State = {
  currency: AppCurrency;
  /** True once /currency-geo answered (this launch). */
  resolved: boolean;
};

export const useGeoCurrency = create<State>(() => ({
  currency: getItem<AppCurrency>(KEY) ?? deviceGuess(),
  resolved: false,
}));

/** The currency to ask the server for, outside React. */
export const geoCurrency = (): AppCurrency =>
  useGeoCurrency.getState().currency;

let started = false;

/** Called once at launch. Failures keep the saved / device guess. */
export function resolveGeoCurrency(): void {
  if (started) return;
  started = true;
  axios
    .get<{ country?: string; currency?: string }>(GEO_URL, { timeout: 5000 })
    .then(({ data }) => {
      const c = String(data?.currency || '').toUpperCase();
      if (c !== 'INR' && c !== 'USD') return;
      useGeoCurrency.setState({ currency: c, resolved: true });
      void setItem<AppCurrency>(KEY, c);
    })
    .catch(() => undefined);
}
