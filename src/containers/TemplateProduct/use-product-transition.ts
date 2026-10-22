import { useRouter } from 'expo-router';
import * as React from 'react';
import { BackHandler } from 'react-native';
import {
  Easing,
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { clearPendingTemplate } from '@/lib/template-transition';

import { GROW_SPRING } from './theme';

/**
 * The page's open / close choreography as a handful of UI-thread values:
 *
 * - `grow`    0 → 1: the flying screenshot, from the tile's rect to the hero
 *                    (spring). Cold opens start at 1.
 * - `reveal`  0 → 1: the page itself — background, blurred band, details,
 *                    neighbours, chrome.
 * - `landed`  0 | 1: the hero's own screen shows (and the flying copy hides)
 *                    — flipped in the same frame, at the same rect, so the
 *                    hand-over is invisible.
 * - `solo`    0 | 1: the hero fades + rises with `reveal` instead of
 *                    flying (cold open, or closing on another template).
 * - `drag`         : the hero band's pull-down (swipe down to close).
 *
 * Close: if the page still shows the template the tile opened, the shot
 * shrinks back onto the tile while the page fades; after a swipe to another
 * template the whole page fades and scales out. Then `router.back()`.
 */
export type ProductMotion = {
  grow: SharedValue<number>;
  reveal: SharedValue<number>;
  landed: SharedValue<number>;
  solo: SharedValue<number>;
  drag: SharedValue<number>;
  closing: SharedValue<number>;
};

function useMotionValues(fromTile: boolean): ProductMotion {
  const grow = useSharedValue(fromTile ? 0 : 1);
  const reveal = useSharedValue(0);
  const landed = useSharedValue(fromTile ? 0 : 1);
  const solo = useSharedValue(fromTile ? 0 : 1);
  const drag = useSharedValue(0);
  const closing = useSharedValue(0);
  return React.useMemo(
    () => ({ grow, reveal, landed, solo, drag, closing }),
    [grow, reveal, landed, solo, drag, closing]
  );
}

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE = Easing.bezier(0.4, 0, 0.2, 1);

type OpenOpts = { fromTile: boolean; onLanded: () => void };

function runOpen(m: ProductMotion, opts: OpenOpts) {
  if (!opts.fromTile) {
    m.reveal.value = withTiming(1, { duration: 480, easing: EASE_OUT }, (f) => {
      if (f) runOnJS(opts.onLanded)();
    });
    return;
  }
  m.reveal.value = withTiming(1, { duration: 420, easing: EASE_OUT });
  // Landing is detected by `useLanding` (the spring's own "finished" fires
  // only once its energy has died out — ~4s after it visibly lands).
  m.grow.value = withSpring(1, GROW_SPRING);
}

/** The flying copy is (visibly) on the hero: hand over to the hero. */
const LANDED_AT = 0.997;

function land(landed: SharedValue<number>, onLanded: () => void) {
  'worklet';
  if (landed.value) return;
  landed.value = 1;
  runOnJS(onLanded)();
}

function useLanding(m: ProductMotion, onLanded: () => void) {
  useAnimatedReaction(
    () => m.grow.value >= LANDED_AT && !m.closing.value,
    (now, before) => {
      if (now && !before) land(m.landed, onLanded);
    }
  );
}

type CloseOpts = { shrink: boolean; onDone: () => void };

function runClose(m: ProductMotion, opts: CloseOpts) {
  if (m.closing.value) return;
  m.closing.value = 1;
  const done = () => {
    'worklet';
    runOnJS(opts.onDone)();
  };
  if (!opts.shrink) {
    m.solo.value = 1;
    m.drag.value = withTiming(m.drag.value * 1.4, { duration: 300 });
    m.reveal.value = withTiming(0, { duration: 300, easing: EASE }, done);
    return;
  }
  const ease = { duration: 360, easing: EASE };
  m.landed.value = 0;
  m.drag.value = withTiming(0, ease);
  m.reveal.value = withTiming(0, { duration: 300, easing: EASE });
  m.grow.value = withTiming(0, ease, done);
}

type Params = {
  templateKey: string;
  fromTile: boolean;
  /** The key of the template the page shows right now. */
  currentKey: () => string;
};

export function useProductTransition(params: Params) {
  const { templateKey, fromTile, currentKey } = params;
  const router = useRouter();
  const m = useMotionValues(fromTile);
  const [landed, setLanded] = React.useState(!fromTile);
  const onLanded = React.useCallback(() => {
    setLanded(true);
  }, []);

  const onDone = React.useCallback(() => {
    clearPendingTemplate(templateKey);
    if (router.canGoBack()) router.back();
    else router.replace('/home' as never);
  }, [router, templateKey]);

  // The open choreography, once (a rotation must not replay it).
  const opened = React.useRef(false);
  React.useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    runOpen(m, { fromTile, onLanded });
  }, [m, fromTile, onLanded]);
  useLanding(m, onLanded);

  const close = React.useCallback(() => {
    const shrink = fromTile && currentKey() === templateKey;
    runClose(m, { shrink, onDone });
  }, [m, fromTile, currentKey, templateKey, onDone]);

  useBackHandler(close);
  return { m, landed, close };
}

/** Android back runs the close choreography instead of popping instantly. */
function useBackHandler(close: () => void) {
  React.useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [close]);
}
