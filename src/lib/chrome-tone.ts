import * as React from 'react';
import {
  makeMutable,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';

/**
 * The app chrome's tone — ONE UI-thread value shared by Home's header and the
 * bottom tab bar. 0 = the page theme (white or dark), 1 = black.
 *
 * Home's studio feed has exactly one black showcase section; Home derives
 * this value from its scroll offset on the UI thread (a `useAnimatedReaction`
 * over `useScrollOffset`), and the header and tab bar read it with
 * `interpolateColor` — no React re-render per frame. Home writes 0 whenever
 * it loses focus, so other tabs always see the bar in the page theme.
 */
export const chromeTone = makeMutable(0);

/** Black chrome — what the header and tab bar fade to at tone 1. */
export const CHROME_BLACK = {
  bg: '#000000',
  ring: '#2A2A2D',
  hairline: '#2A2A2D',
  ink: '#FFFFFF',
  inkMuted: 'rgba(255,255,255,0.5)',
  raised: '#161618',
  raisedEdge: 'rgba(255,255,255,0.14)',
} as const;

/** Tone stops for ink (text, glyphs): it holds, then crosses over quickly
 *  around the middle, so it never sits grey-on-grey while the fills glide. */
export const INK_AT = [0, 0.4, 0.6, 1];

/** True while the chrome is mostly black — for the status bar style. Flips
 *  (one React render) only when the tone crosses the middle. */
export function useChromeIsBlack() {
  const [black, setBlack] = React.useState(false);
  useAnimatedReaction(
    () => chromeTone.value > 0.5,
    (now, before) => {
      if (now !== before) runOnJS(setBlack)(now);
    }
  );
  return black;
}
