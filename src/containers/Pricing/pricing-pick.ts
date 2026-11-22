import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { create } from 'zustand';

import type { PlanInterval } from '@/lib/iap';

/**
 * The plan tab and billing cycle picked on the Pricing tab, shared by the
 * folder card, the Yearly/Monthly toggle and the floating Pay now bar.
 * `tier` null = not picked: the card opens on the user's plan / the popular
 * one. `/pricing?plan=basic&cycle=yearly` (Buy plan on a template) picks for
 * the user.
 */
type Pick = {
  tier: string | null;
  cycle: PlanInterval;
  setTier: (tier: string | null) => void;
  setCycle: (cycle: PlanInterval) => void;
};

export const usePricingPick = create<Pick>((set) => ({
  tier: null,
  cycle: 'yearly',
  setTier: (tier) => set({ tier }),
  setCycle: (cycle) => set({ cycle }),
}));

/** Applies `?plan=` / `?cycle=` each time they arrive. */
export function usePickFromParams() {
  const { plan, cycle } = useLocalSearchParams<{
    plan?: string;
    cycle?: string;
  }>();
  React.useEffect(() => {
    // `plan=next`: "upgrade" — forget any earlier pick so the card opens on
    // the plan above the user's (see TabbedPlans' start).
    if (plan === 'next') usePricingPick.getState().setTier(null);
    else if (plan) usePricingPick.getState().setTier(plan);
    if (cycle === 'yearly' || cycle === 'monthly')
      usePricingPick.getState().setCycle(cycle);
  }, [plan, cycle]);
}

/** Case-insensitive tier match ("basic" from a link, "Basic" from the API). */
export const sameTier = (a?: string | null, b?: string | null) =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase();
