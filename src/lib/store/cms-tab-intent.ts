/**
 * Deep-link intent for the CMS shell. `CmsShell` (single-screen, tab state kept
 * as local `useState` — see `src/containers/CMS/CmsShell.tsx`) has no route per
 * tab, so a notification tap can't navigate straight to e.g. the Orders tab via
 * `expo-router`. Instead the notification handler sets `pendingTab` here and
 * routes to `/cms`; `CmsShell` reads + clears it on mount/focus.
 *
 * The tab key is typed as a plain `string` on purpose. This module (and the
 * notification layer that writes to it) sits UNDER the CMS screens in the
 * dependency graph — importing `CmsTabKey` from `@/containers/CMS/tabs` here
 * would pull all 25 CMS screens into `@/lib`, which `useAuth` and
 * `app-startup` depend on, creating a require cycle. `CmsShell` narrows the
 * value back to `CmsTabKey` when it consumes it.
 */
import { create } from 'zustand';

interface CmsTabIntentState {
  pendingTab: string | null;
  setPendingTab: (tab: string) => void;
  consumePendingTab: () => string | null;
}

export const useCmsTabIntent = create<CmsTabIntentState>((set, get) => ({
  pendingTab: null,
  setPendingTab: (tab) => set({ pendingTab: tab }),
  consumePendingTab: () => {
    const tab = get().pendingTab;
    if (tab) set({ pendingTab: null });
    return tab;
  },
}));
