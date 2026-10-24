import type { ProductSubscription } from 'expo-iap';
import { create } from 'zustand';

/** `unsupported`: not iOS. `unavailable`: StoreKit returned no products
 *  (not configured in App Store Connect yet, no StoreKit config on the
 *  simulator, store unreachable) — the UI shows a calm notice, never a web
 *  link. */
export type StoreStatus =
  | 'unsupported'
  | 'connecting'
  | 'ready'
  | 'unavailable';

type IapState = {
  status: StoreStatus;
  /** StoreKit products by product id (localized `displayPrice`). */
  products: Record<string, ProductSubscription>;
  /** Product id whose purchase sheet / verification is in flight. */
  busySku: string | null;
  restoring: boolean;
  /** Why StoreKit has nothing to sell (shown small under the notice), e.g.
   *  "App Store returned 0 of 6 plans" or StoreKit's error message. */
  detail: string | null;
};

export const useIapStore = create<IapState>(() => ({
  status: 'unsupported',
  products: {},
  busySku: null,
  restoring: false,
  detail: null,
}));

export const setIap = (patch: Partial<IapState>) => useIapStore.setState(patch);
