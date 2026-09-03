import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * How tall the bottom tab bar is.
 *
 * It exists because the bar FLOATS: it is absolutely positioned over the
 * scene rather than taking a row in the navigator's layout. That is what lets
 * the screen show through the wedges outside its rounded top corners —
 * in-flow, those corners are cut out of an opaque strip and there is nothing
 * behind them but the navigator's black.
 *
 * The cost of floating is that the navigator no longer reserves the space, so
 * every tab screen has to reserve it instead. Hence one exported number and
 * one hook, rather than four screens each guessing at a padding value that
 * would drift the moment the bar's own metrics changed.
 *
 * Keep this in step with GlowTabBar's styles — the terms below name the exact
 * values they mirror.
 */

/** Everything above the safe-area inset: the ring stroke, `inner`'s top pad,
 *  and `cardInner`'s min height. */
export const TAB_BAR_CONTENT_H = 1 + 8 + 50;

/** The bar's full height on this device, safe area included. Add it as bottom
 *  padding to anything a tab screen scrolls or bottom-anchors. */
export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_CONTENT_H + Math.max(insets.bottom, 10);
}
