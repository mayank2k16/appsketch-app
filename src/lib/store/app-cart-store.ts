/**
 * The services cart (team-built apps, extras, one domain) — paid with
 * Razorpay at /cart. Platform plans never go in here; they are App Store
 * subscriptions. Persisted in MMKV like the other stores.
 */
import { create } from 'zustand';

import type { DomainYearPrice, RegistrantContact } from '@/api/app-domains';

import { getItem, removeItem, setItem } from '../storage';

const KEY = 'app_cart_v1';

export type CartDomain = {
  name: string;
  years: number;
  price_inr: number;
  tenant_id: number | string | null;
  /** Every registration length the search offered, to switch years here. */
  options: DomainYearPrice[];
};

type Persisted = {
  addonIds: number[];
  domain: CartDomain | null;
  contact: Partial<RegistrantContact>;
  /** Discount code the user applied (validated live; the server re-checks
   *  it at checkout). Kept across launches with the cart. */
  discountCode: string | null;
};

type AppCartState = Persisted & {
  /** Not persisted: checkout answered 400 `plan_required` although the
   *  local subscription looked active — show the plan step anyway. */
  planRequired: boolean;
  setDiscountCode: (code: string | null) => void;
  setPlanRequired: (v: boolean) => void;
  setAddons: (ids: number[]) => void;
  removeAddon: (id: number, buildIds: number[]) => void;
  setDomain: (d: CartDomain | null) => void;
  patchDomain: (p: Partial<CartDomain>) => void;
  setContact: (c: Partial<RegistrantContact>) => void;
  clear: () => void;
};

const EMPTY: Persisted = {
  addonIds: [],
  domain: null,
  contact: {},
  discountCode: null,
};

function save(s: Persisted) {
  void setItem<Persisted>(KEY, {
    addonIds: s.addonIds,
    domain: s.domain,
    contact: s.contact,
    discountCode: s.discountCode,
  });
}

export const useAppCart = create<AppCartState>((set, get) => {
  const commit = (patch: Partial<Persisted>) => {
    set(patch);
    save(get());
  };
  return {
    ...EMPTY,
    ...(getItem<Persisted>(KEY) ?? {}),
    planRequired: false,
    setDiscountCode: (code) =>
      commit({ discountCode: code?.trim().toUpperCase() || null }),
    setPlanRequired: (planRequired) => set({ planRequired }),
    setAddons: (ids) => commit({ addonIds: [...new Set(ids)] }),
    // Extras run on a build: dropping the last build drops them too.
    removeAddon: (id, buildIds) => {
      const next = get().addonIds.filter((x) => x !== id);
      const hasBuild = next.some((x) => buildIds.includes(x));
      commit({ addonIds: hasBuild ? next : [] });
    },
    setDomain: (domain) => commit({ domain }),
    patchDomain: (p) => {
      const d = get().domain;
      if (d) commit({ domain: { ...d, ...p } });
    },
    setContact: (c) => commit({ contact: { ...get().contact, ...c } }),
    clear: () => {
      set({
        addonIds: [],
        domain: null,
        discountCode: null,
        planRequired: false,
      });
      void removeItem(KEY);
      save(get());
    },
  };
});

export const cartCount = (s: Pick<Persisted, 'addonIds' | 'domain'>) =>
  s.addonIds.length + (s.domain ? 1 : 0);
