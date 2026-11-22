import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { create } from 'zustand';

import {
  getTemplateAllowance,
  type TemplateAllowance,
  tierLabel,
} from '@/api/templates';
import { useAuth } from '@/hooks/useAuth';

/**
 * The plan's template allowance on the template page. Every copy ("Use this
 * template", "Customise with AI") goes through `ensure`: with a free slot it
 * runs at once; when the allowance is used up it opens /template-limit
 * (upgrade, or delete one of their copies) and runs once a slot is free.
 * The clone endpoint's 402 lands in the same sheet (use-use-template.ts).
 */
type LimitState = {
  allowance: TemplateAllowance | null;
  /** What to do once a slot is free (the copy that was refused). */
  retry: (() => void) | null;
  open: (a: TemplateAllowance, retry: () => void) => void;
  clear: () => void;
};

export const useTemplateLimit = create<LimitState>((set) => ({
  allowance: null,
  retry: null,
  open: (allowance, retry) => set({ allowance, retry }),
  clear: () => set({ allowance: null, retry: null }),
}));

export const ALLOWANCE_KEY = ['template-allowance'];

/** The signed-in caller's allowance (null signed out / not loaded yet). */
export function useAllowance() {
  const signedIn = useAuth.use.status() === 'signIn';
  const q = useQuery({
    queryKey: ALLOWANCE_KEY,
    queryFn: getTemplateAllowance,
    enabled: signedIn,
    staleTime: 30_000,
  });
  return signedIn ? (q.data ?? null) : null;
}

/** "3 of 8 used on Basic" / "Unlimited on 100X". */
export function allowanceLine(a: TemplateAllowance | null): string | undefined {
  if (!a) return undefined;
  const plan = tierLabel(a.tier);
  if (a.limit == null) return `Unlimited on ${plan}`;
  if (!a.allowed) return `All ${a.limit} used on ${plan}`;
  return `${a.used} of ${a.limit} used on ${plan}`;
}

/** Opens /template-limit for a refused copy. */
export function useShowLimit() {
  const router = useRouter();
  return React.useCallback(
    (a: TemplateAllowance, retry: () => void) => {
      useTemplateLimit.getState().open(a, retry);
      router.push('/template-limit' as never);
    },
    [router]
  );
}

/** `ensure(run)`: run now with a free slot, else the limit sheet first. A
 *  failed check runs anyway — the clone endpoint still decides. */
export function useEnsureSlot() {
  const qc = useQueryClient();
  const showLimit = useShowLimit();
  return React.useCallback(
    async (run: () => void) => {
      const a = await qc
        .fetchQuery({
          queryKey: ALLOWANCE_KEY,
          queryFn: getTemplateAllowance,
          staleTime: 0,
        })
        .catch(() => null);
      if (!a) {
        run();
        return;
      }
      if (a.allowed) run();
      else showLimit(a, run);
    },
    [qc, showLimit]
  );
}
