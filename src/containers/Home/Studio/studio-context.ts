import { useRouter } from 'expo-router';
import * as React from 'react';
import type { View } from 'react-native';

import type { MarketTemplate } from '@/api/templates';
import { openTemplate, type TileFrame } from '@/lib/template-transition';

import { useLiveBudget } from './live-budget';

/**
 * What every studio tile needs besides its own template, shared through one
 * context so rows stay memoised: the theme, the current category's list in
 * display order (the product page swipes through it), switching category
 * (type tiles), and "create yours" (scroll Home to the prompt and focus it).
 */
export type StudioActions = {
  dark: boolean;
  list: readonly MarketTemplate[];
  setCategory: (name: string) => void;
  create: () => void;
};

export const StudioContext = React.createContext<StudioActions>({
  dark: false,
  list: [],
  setCategory: () => {},
  create: () => {},
});

export const useStudioActions = () => React.useContext(StudioContext);

const PASTELS: readonly (readonly [string, string, string])[] = [
  ['#FFE3CF', '#FFD3E4', '#F1D8FF'],
  ['#D6E5FF', '#E2D8FF', '#F3DEFF'],
  ['#CFF3E1', '#D4EBFF', '#E0DCFF'],
  ['#FFF0BE', '#FFDCC2', '#FFD0D6'],
  ['#E6D8FF', '#FFD6EA', '#FFE2CF'],
  ['#CDF1EF', '#D6F4DA', '#F5F3C8'],
];
const DEEPS: readonly (readonly [string, string, string])[] = [
  ['#3B1D0E', '#3D1029', '#2D1240'],
  ['#0F2145', '#1F1748', '#33134A'],
  ['#0C3326', '#0E2A45', '#1F1A4A'],
  ['#3A2E0A', '#3B210F', '#3D1220'],
  ['#2A1550', '#45103A', '#40200E'],
  ['#0B3533', '#0E3A1D', '#33330C'],
];

export function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** A luminous pastel stage (deep tones in dark), stable per seed. */
export function stageOf(seed: string, dark: boolean) {
  return (dark ? DEEPS : PASTELS)[hash(seed) % PASTELS.length];
}

type Rect = { x: number; y: number; width: number; height: number };

/** Measures the tile's media and opens the product page from it. */
export function useOpenTemplate(
  template: MarketTemplate | null,
  frame: TileFrame,
  backdrop?: readonly string[]
) {
  const router = useRouter();
  const { list } = useStudioActions();
  const budget = useLiveBudget();
  const ref = React.useRef<View>(null);
  const onPress = React.useCallback(() => {
    if (!template) return;
    const go = (rect: Rect | null) => {
      budget.pause(true);
      openTemplate(router, { template, rect, frame, backdrop, list });
    };
    if (!ref.current) return go(null);
    ref.current.measureInWindow((...m: number[]) => {
      const [x, y, width, height] = m;
      go(width > 0 ? { x, y, width, height } : null);
    });
  }, [router, template, frame, backdrop, list, budget]);
  return { ref, onPress };
}
