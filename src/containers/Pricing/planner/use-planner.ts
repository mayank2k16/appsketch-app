import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  type SharedValue,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { Catalogue, CatalogueItem } from '@/api/app-cart';
import { buildName, plural } from '@/components/services';
import { haptic } from '@/lib/haptics';
import { useAppCart } from '@/lib/store/app-cart-store';

export type Planner = {
  builds: CatalogueItem[];
  extras: CatalogueItem[];
  buildIds: number[];
  extraIds: number[];
  unlocked: boolean;
  step: 1 | 2 | 3;
  total: number;
  label: string;
  /** 0→1→0 when a locked extra is tapped (lights the build tiles). */
  nudge: SharedValue<number>;
  toggleBuild: (id: number) => void;
  toggleExtra: (id: number) => void;
  checkout: () => void;
};

function summaryLabel(builds: CatalogueItem[], extras: number) {
  const names = builds.map((b) => buildName(b.name)).join(' + ');
  return extras ? `${names} + ${plural(extras, 'extra')}` : names;
}

/** Seeds the picks from the cart once the catalogue is in. */
function useSeed(
  cat: Catalogue | undefined,
  set: (b: number[], e: number[]) => void
) {
  const seeded = React.useRef(false);
  React.useEffect(() => {
    if (!cat || seeded.current) return;
    seeded.current = true;
    const ids = useAppCart.getState().addonIds;
    const b = cat.builds.filter((x) => ids.includes(x.id)).map((x) => x.id);
    const e = b.length
      ? cat.extras.filter((x) => ids.includes(x.id)).map((x) => x.id)
      : [];
    set(b, e);
  }, [cat, set]);
}

function useToggles(cat: Catalogue | undefined) {
  const [buildIds, setBuildIds] = React.useState<number[]>([]);
  const [extraIds, setExtraIds] = React.useState<number[]>([]);
  const nudge = useSharedValue(0);
  const seed = React.useCallback((b: number[], e: number[]) => {
    setBuildIds(b);
    setExtraIds(e);
  }, []);
  useSeed(cat, seed);
  const toggleBuild = (id: number) => {
    haptic.select();
    const next = buildIds.includes(id)
      ? buildIds.filter((x) => x !== id)
      : [...buildIds, id];
    setBuildIds(next);
    // Extras run on a build: dropping the last build drops them.
    if (!next.length) setExtraIds([]);
  };
  const toggleExtra = (id: number) => {
    if (!buildIds.length) {
      haptic.warning();
      nudge.value = withSequence(
        withTiming(1, { duration: 140 }),
        withTiming(0, { duration: 900 })
      );
      return;
    }
    haptic.select();
    setExtraIds((xs) =>
      xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]
    );
  };
  return { buildIds, extraIds, nudge, toggleBuild, toggleExtra };
}

/** The assisted planner's state: picks, step, one-time total, checkout. */
export function usePlanner(cat: Catalogue | undefined): Planner {
  const router = useRouter();
  const setAddons = useAppCart((s) => s.setAddons);
  const tg = useToggles(cat);
  const builds = cat?.builds ?? [];
  const extras = cat?.extras ?? [];
  const pickedB = builds.filter((b) => tg.buildIds.includes(b.id));
  const pickedE = extras.filter((e) => tg.extraIds.includes(e.id));
  const unlocked = pickedB.length > 0;
  const step: 1 | 2 | 3 = unlocked && pickedE.length ? 3 : unlocked ? 2 : 1;
  const total = [...pickedB, ...pickedE].reduce((n, x) => n + x.price_inr, 0);
  const checkout = () => {
    haptic.press();
    setAddons([...pickedB, ...pickedE].map((x) => x.id));
    router.push('/cart');
  };
  return {
    builds,
    extras,
    buildIds: tg.buildIds,
    extraIds: tg.extraIds,
    unlocked,
    step,
    total,
    label: summaryLabel(pickedB, pickedE.length),
    nudge: tg.nudge,
    toggleBuild: tg.toggleBuild,
    toggleExtra: tg.toggleExtra,
    checkout,
  };
}
