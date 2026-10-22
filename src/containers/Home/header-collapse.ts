import * as React from 'react';
import {
  runOnUI,
  type SharedValue,
  useAnimatedReaction,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

/**
 * Home's hide-on-scroll header, all on the UI thread.
 *
 * `hide` is how far the header has slid up (0 = shown, `max` = gone). Past
 * the hero and prompt (`from`, the feed's start in content coordinates) it
 * follows the finger while the content goes up (a diff-clamp on the scroll
 * delta, clamped to [0, max]). Scrolling the other way by more than REVEAL_AT
 * brings it back in full with a quick spring, anywhere in the page. Above
 * `from` (the top of the page) it is always shown. When a drag or its
 * momentum ends half way, `snap()` settles it fully shown or fully hidden.
 * No React render per frame.
 */

/** Reverse scroll (pt) that reveals the header. */
const REVEAL_AT = 10;
const SPRING = { damping: 26, stiffness: 320, mass: 0.8 } as const;

type Inputs = {
  offset: SharedValue<number>;
  /** Content y below which the header may hide (the feed's start). */
  from: SharedValue<number>;
  hide: SharedValue<number>;
  max: SharedValue<number>;
};

export function useHeaderCollapse({ offset, from, hide, max }: Inputs) {
  const back = useSharedValue(0);
  useAnimatedReaction(
    () => offset.value,
    (y, prev) => {
      if (prev === null || max.value <= 0) return;
      const dy = y - prev;
      if (y < from.value) {
        back.value = 0;
        if (hide.value > 0 && dy < 0) hide.value = withSpring(0, SPRING);
        return;
      }
      if (dy > 0) {
        back.value = 0;
        hide.value = Math.min(max.value, Math.max(0, hide.value + dy));
      } else if (dy < 0) {
        back.value += -dy;
        if (back.value > REVEAL_AT && hide.value > 0) {
          back.value = 0;
          hide.value = withSpring(0, SPRING);
        }
      }
    }
  );
  return React.useMemo(
    () => ({
      snap: () =>
        runOnUI(() => {
          'worklet';
          const h = hide.value;
          if (h <= 0 || h >= max.value) return;
          hide.value = withSpring(h > max.value / 2 ? max.value : 0, SPRING);
        })(),
      show: () =>
        runOnUI(() => {
          'worklet';
          hide.value = withSpring(0, SPRING);
        })(),
    }),
    [hide, max]
  );
}
