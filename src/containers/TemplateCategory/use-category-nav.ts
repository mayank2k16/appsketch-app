import type { FlashListRef } from '@shopify/flash-list';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import { AppState } from 'react-native';

import { haptic } from '@/lib/haptics';

import { LiveBudget } from '../Home/Studio/live-budget';
import type { StudioActions } from '../Home/Studio/studio-context';
import type { Deal, DealRow } from './deal';
import { resetCategoryRise } from './rows';

/** This screen's own live-tile budget (provided to Home's tiles through
 *  `LiveBudgetContext`), so Home's spots survive underneath. */
export const categoryLive = new LiveBudget();

/**
 * The category on screen, switching it in place, and back.
 *
 * The route's `name` only seeds the screen. A switch (chip, panel, or a type
 * tile in the feed) is local state: it never touches the route, so the stack
 * keeps exactly one category screen and one back (or swipe-back) returns to
 * Home. (`router.setParams` on a path param adds a history entry.) A switch
 * clears the rise memory and jumps the list to the top, so the new deal
 * rises in with a stagger. `select` fires once per actual change — the only
 * haptic on this screen.
 */
export function useCategoryNav(
  name: string,
  listRef: React.RefObject<FlashListRef<DealRow> | null>
) {
  const router = useRouter();
  const [category, setState] = React.useState(name);
  // A new route name (e.g. a deep link onto this screen) re-seeds it.
  React.useEffect(() => setState(name), [name]);
  const current = React.useRef(category);
  current.current = category;

  const setCategory = React.useCallback(
    (next: string) => {
      if (!next || next === current.current) return;
      haptic.select();
      resetCategoryRise();
      categoryLive.setSpots([]);
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      setState(next);
    },
    [listRef]
  );

  const back = React.useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/home' as never);
  }, [router]);

  return React.useMemo(
    () => ({ category, setCategory, back }),
    [category, setCategory, back]
  );
}

/** The context Home's tiles read (theme, swipe list, type-tile switch,
 *  "Create yours" — which here goes back to Home's prompt). */
export function useTileActions(o: {
  dark: boolean;
  deal: Deal;
  setCategory: (name: string) => void;
  back: () => void;
}): StudioActions {
  const { dark, deal, setCategory, back } = o;
  return React.useMemo(
    () => ({ dark, list: deal.order, setCategory, create: back }),
    [dark, deal.order, setCategory, back]
  );
}

/** Live tiles: this deal's spots; allowed only while the screen is focused
 *  and the app is in the foreground. */
export function useLiveWiring(deal: Deal) {
  React.useEffect(() => {
    categoryLive.setSpots(deal.live);
  }, [deal]);
  useFocusEffect(
    React.useCallback(() => {
      categoryLive.pause(false);
      const sub = AppState.addEventListener('change', (s) =>
        categoryLive.pause(s !== 'active')
      );
      return () => {
        sub.remove();
        categoryLive.pause(true);
      };
    }, [])
  );
  React.useEffect(() => () => categoryLive.setSpots([]), []);
}
