import * as React from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  Easing,
  runOnJS,
  type SharedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '@/lib/haptics';

import type { Geometry } from './geometry';
import { PAGE_SPRING } from './theme';
import type { ProductMotion } from './use-product-transition';

/**
 * The left/right pager over the template list. `x` is the continuous page
 * position (2.4 = 40% of the way from page 2 to 3) — every page derives its
 * hero offset, scale, blur and the details crossfade from it on the UI
 * thread. JS hears about a swipe twice: on release (`index` — only the
 * light chrome follows it: breadcrumb, LIVE badge, details' touch target)
 * and, debounced, once the page has landed (`settled`, SETTLE_MS after the
 * LAST release — not the spring's own "finished", which only fires once
 * its energy has died out, seconds later). Everything that mounts views
 * (the ±WINDOW pages, live sites) follows `settled`, so a swipe's spring
 * never shares a frame with a React commit, and a run of quick swipes
 * commits once. Pages stay mounted ±WINDOW around `settled` so a second
 * swipe before the commit still finds its page; a swipe that reaches the
 * window's edge commits at once, and the drag can never run past it.
 *
 * Haptics follow the finger, like a picker: one `select` tick the moment a
 * drag crosses halfway to the next template (and back), one on release if
 * a fling lands on a page the finger had not ticked yet, and a `soft` bump
 * once per drag when it runs into either end of the list.
 *
 * The hero takes only clear HORIZONTAL swipes (vertical drags and taps go
 * to the live site, which scrolls and works natively). A swipe moves at
 * most one page. A pull down on the details box (`m.drag`) closes the page.
 */

const SETTLE_MS = 380;
/** Pages kept mounted either side of the settled one. */
export const WINDOW = 2;
/** Horizontal travel before the pager claims a drag; vertical travel that
 *  fails it on the hero (so the site keeps it). The hero decides within
 *  the first ~8pt, BEFORE the live site's own scroll view starts (≈10pt):
 *  once WebKit's pan has begun it owns the drag, and a sideways swipe
 *  would only nudge the page. */
const CLAIM_X = 18;
const HERO_CLAIM = 7;
const YIELD_Y = 8;
const DISMISS_PAST = 110;
const FLING = 900;
/** The one-time hint: how far (pt) the page nudges toward the next. */
const NUDGE = 24;

export type Pager = {
  x: SharedValue<number>;
  index: number;
  settled: number;
};

function useSettle(start: number, span: SharedValue<number>) {
  const [index, setIndex] = React.useState(start);
  const [settled, setSettled] = React.useState(start);
  const committed = React.useRef(start);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const commit = React.useCallback(
    (i: number) => {
      committed.current = i;
      span.set(i);
      setSettled(i);
    },
    [span]
  );
  const onSettle = React.useCallback(
    (i: number) => {
      clearTimeout(timer.current);
      // At the window's edge the next page is not mounted yet: re-centre now.
      if (Math.abs(i - committed.current) >= WINDOW) commit(i);
      else timer.current = setTimeout(() => commit(i), SETTLE_MS);
    },
    [commit]
  );
  React.useEffect(() => () => clearTimeout(timer.current), []);
  return { index, setIndex, settled, onSettle };
}

type GestureOpts = {
  count: number;
  g: Geometry;
  m: ProductMotion;
  onRelease: (i: number) => void;
  onSettle: (i: number) => void;
  onClose: () => void;
  /** The settled page the mounted window is centred on. */
  span: SharedValue<number>;
};

/** One page either side of `base`, and never outside the mounted window. */
function clampPage(v: number, base: number, o: GestureOpts) {
  'worklet';
  const c = o.span.value;
  const lo = Math.max(0, base - 1, c - WINDOW);
  const hi = Math.min(o.count - 1, base + 1, c + WINDOW);
  return Math.min(hi, Math.max(lo, v));
}

/** Past the first / last page the hero follows the finger at 30%. */
function rubber(v: number, count: number) {
  'worklet';
  if (v < 0) return v * 0.3;
  if (v > count - 1) return count - 1 + (v - (count - 1)) * 0.3;
  return v;
}

/** Where a drag puts the pager: at most one page either way of `base`,
 *  inside the mounted window, rubber-banding past either end. */
function follow(v: number, base: number, o: GestureOpts) {
  'worklet';
  const c = o.span.value;
  const lo = Math.max(base - 1, c - WINDOW);
  const hi = Math.min(base + 1, c + WINDOW);
  return rubber(Math.min(hi, Math.max(lo, v)), o.count);
}

const tick = () => haptic.select();
const bump = () => haptic.soft();

/** The page under the finger changed (halfway crossed): one tick. */
function tickAt(page: number, ticked: SharedValue<number>) {
  'worklet';
  if (page === ticked.value) return;
  ticked.value = page;
  runOnJS(tick)();
}

/** The hero's pan decides by hand from the raw touches: sideways travel
 *  of HERO_CLAIM that leads the vertical claims the swipe (a thumb's arc
 *  dips a few points, so no stricter ratio), a drag that is MORE vertical
 *  than sideways by YIELD_Y gives it to the site. */
function heroClaim(
  p: ReturnType<typeof Gesture.Pan>,
  start: SharedValue<{ x: number; y: number }>
) {
  return p
    .manualActivation(true)
    .onTouchesDown((e) => {
      'worklet';
      const t = e.allTouches[0];
      if (t) start.value = { x: t.absoluteX, y: t.absoluteY };
    })
    .onTouchesMove((e, mgr) => {
      'worklet';
      const t = e.allTouches[0];
      if (!t) return;
      const dx = Math.abs(t.absoluteX - start.value.x);
      const dy = Math.abs(t.absoluteY - start.value.y);
      if (dx >= HERO_CLAIM && dx > dy) mgr.activate();
      else if (dy >= YIELD_Y && dy > dx * 1.2) mgr.fail();
    });
}

/** Mid-drag haptics: a tick as the finger crosses to another page, one
 *  bump per drag at either end of the list. */
function feel(
  v: number,
  {
    count,
    ticked,
    bumped,
  }: { count: number; ticked: SharedValue<number>; bumped: SharedValue<number> }
) {
  'worklet';
  tickAt(Math.min(count - 1, Math.max(0, Math.round(v))), ticked);
  if (!bumped.value && (v < -0.04 || v > count - 0.96)) {
    bumped.value = 1;
    runOnJS(bump)();
  }
}

/** The finger lifted: settle on the projected page (one at most). */
function release(
  x: SharedValue<number>,
  base: SharedValue<number>,
  { vx, o, ticked }: { vx: number; o: GestureOpts; ticked: SharedValue<number> }
) {
  'worklet';
  const projected = x.value - (vx / o.g.stride) * 0.18;
  const to = clampPage(Math.round(projected), base.value, o);
  tickAt(to, ticked);
  base.value = to;
  runOnJS(o.onRelease)(to);
  runOnJS(o.onSettle)(to);
  x.value = withSpring(to, { ...PAGE_SPRING, velocity: -vx / o.g.stride });
}

function usePagerGestures(x: SharedValue<number>, o: GestureOpts) {
  const { count, g, m } = o;
  const base = useSharedValue(Math.round(x.value));
  const from = useSharedValue(0);
  const axis = useSharedValue(0);
  /** The page the last tick was for, and whether this drag has bumped an
   *  end of the list yet. */
  const ticked = useSharedValue(Math.round(x.value));
  const start = useSharedValue({ x: 0, y: 0 });
  const bumped = useSharedValue(0);
  return React.useMemo(() => {
    const onStart = (tx: number, ty: number) => {
      'worklet';
      axis.value = Math.abs(tx) >= Math.abs(ty) ? 1 : 2;
      // Only a horizontal drag takes the page position over. A pull-down
      // must not stop a page that is still settling, or it is left
      // between pages (off centre, a wide neighbour strip showing).
      if (axis.value !== 1) return;
      cancelAnimation(x);
      from.value = x.value;
      bumped.value = 0;
    };
    const onUpdate = (tx: number, ty: number) => {
      'worklet';
      if (m.closing.value) return;
      if (axis.value === 2) {
        m.drag.value = Math.max(0, ty) * 0.75;
        return;
      }
      x.value = follow(from.value - tx / g.stride, base.value, o);
      feel(x.value, { count, ticked, bumped });
    };
    const onEnd = (vx: number, vy: number) => {
      'worklet';
      if (m.closing.value) return;
      if (axis.value === 2) {
        if (m.drag.value > DISMISS_PAST || vy > FLING) runOnJS(o.onClose)();
        else m.drag.value = withSpring(0, PAGE_SPRING);
        return;
      }
      release(x, base, { vx, o, ticked });
      axis.value = 0;
    };
    // Safety net: a drag that ends any other way (cancelled by the
    // WebView's own gesture, interrupted) still lands exactly on a page.
    const onFinalize = () => {
      'worklet';
      if (axis.value === 1 && !m.closing.value) {
        x.value = withSpring(base.value, PAGE_SPRING);
        ticked.value = base.value;
      }
      axis.value = 0;
    };
    const pan = (pullDown: boolean) => {
      const p = Gesture.Pan()
        .activeOffsetX([-CLAIM_X, CLAIM_X])
        .onStart((e) => onStart(e.translationX, e.translationY))
        .onUpdate((e) => onUpdate(e.translationX, e.translationY))
        .onEnd((e) => onEnd(e.velocityX, e.velocityY))
        .onFinalize(onFinalize);
      return pullDown ? p.activeOffsetY(14) : heroClaim(p, start);
    };
    return { hero: pan(false), details: pan(true) };
  }, [x, base, from, axis, ticked, bumped, start, o, count, g, m]);
}

/** Once per app session: right after the page opens, it nudges toward the
 *  next template and springs back, so the swipe is discoverable. */
let hinted = false;

function useHint(
  x: SharedValue<number>,
  ready: boolean,
  { count, stride }: { count: number; stride: number }
) {
  React.useEffect(() => {
    if (!ready || hinted || count < 2) return;
    hinted = true;
    const at = Math.round(x.get());
    const dir = at < count - 1 ? 1 : -1;
    x.set(
      withDelay(
        600,
        withSequence(
          withTiming(at + dir * (NUDGE / stride), {
            duration: 420,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
          }),
          withSpring(at, { damping: 15, stiffness: 150 })
        )
      )
    );
  }, [x, ready, count, stride]);
}

type Params = Omit<GestureOpts, 'onRelease' | 'onSettle' | 'span'> & {
  start: number;
  /** The open transition has finished (hint waits for it). */
  ready: boolean;
};

export function usePager(p: Params) {
  const x = useSharedValue(p.start);
  const span = useSharedValue(p.start);
  const st = useSettle(p.start, span);
  const { count, g, m, onClose } = p;
  const { setIndex: onRelease, onSettle } = st;
  const opts = React.useMemo<GestureOpts>(
    () => ({ count, g, m, onClose, onRelease, onSettle, span }),
    [count, g, m, onClose, onRelease, onSettle, span]
  );
  const gestures = usePagerGestures(x, opts);
  useHint(x, p.ready, { count, stride: g.stride });
  return { x, index: st.index, settled: st.settled, gestures };
}
