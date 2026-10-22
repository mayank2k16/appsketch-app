import { useFocusEffect } from 'expo-router';
import * as React from 'react';
import { AppState } from 'react-native';
import {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { chromeTone } from '@/lib/chrome-tone';

import { liveBudget } from './live-budget';

/**
 * Drives `chromeTone` from Home's scroll offset, on the UI thread.
 *
 * The tone rises as the black showcase's top climbs from the middle of the
 * viewport to its top edge (black reaches the header). It stays black while
 * the showcase leaves, and only falls once its bottom has climbed to 40% of
 * the viewport (the last of the black is mostly scrolled past), finishing as
 * it nears the header. While Home is blurred the tone eases back to 0, so other tabs
 * and the product page never inherit black chrome.
 */

type Inputs = {
  offset: SharedValue<number>;
  listTop: SharedValue<number>;
  /** The showcase's y/height in list-content coordinates (h 0 = none). */
  showcase: SharedValue<{ y: number; h: number }>;
  viewportH: SharedValue<number>;
};

export function useChromeDriver({
  offset,
  listTop,
  showcase,
  viewportH,
}: Inputs) {
  const focused = useHomeFocus();
  useAnimatedReaction(
    () => {
      const sc = showcase.value;
      const vh = viewportH.value;
      if (sc.h <= 0 || vh <= 0) return { tone: 0, on: focused.value };
      const top = listTop.value + sc.y - offset.value;
      const bottom = top + sc.h;
      const clamp = Extrapolation.CLAMP;
      const enter = interpolate(top, [vh * 0.5, vh * 0.05], [0, 1], clamp);
      const exit = interpolate(bottom, [vh * 0.4, vh * 0.15], [1, 0], clamp);
      return { tone: Math.min(enter, exit), on: focused.value };
    },
    (now, before) => {
      if (!now.on) return;
      if (before && !before.on) {
        chromeTone.value = withTiming(now.tone, { duration: 240 });
      } else if (!before || now.tone !== before.tone) {
        chromeTone.value = now.tone;
      }
    }
  );
}

/** Home focused + app foregrounded: tone live, live tiles allowed. */
function useHomeFocus() {
  const focused = useSharedValue(1);
  useFocusEffect(
    React.useCallback(() => {
      focused.value = 1;
      liveBudget.pause(false);
      const sub = AppState.addEventListener('change', (s) =>
        liveBudget.pause(s !== 'active')
      );
      return () => {
        sub.remove();
        focused.value = 0;
        chromeTone.value = withTiming(0, { duration: 240 });
        liveBudget.pause(true);
      };
    }, [focused])
  );
  return focused;
}
