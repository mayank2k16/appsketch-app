import { cardEdge } from '../Home/Studio/geometry';
import { homeTheme } from '../Home/theme/HomeTheme';

/** The category screen's palette: Home's canvas, raised white surfaces,
 *  inset chips, ink text and the 1.5px card edge. No shadows anywhere. */
export type CatColors = {
  dark: boolean;
  bg: string;
  surface: string;
  inset: string;
  ink: string;
  sub: string;
  muted: string;
  edge: string;
  hairline: string;
  /** Text / glyphs on an ink-filled pill. */
  onInk: string;
};

export function catColors(dark: boolean): CatColors {
  return {
    dark,
    bg: homeTheme[dark ? 'dark' : 'light'].bg,
    surface: dark ? '#111113' : '#FFFFFF',
    inset: dark ? '#18181B' : '#F4F4F2',
    ink: dark ? '#F4F4F5' : '#0B0B0C',
    sub: dark ? '#A1A1AA' : '#5C5D63',
    muted: dark ? '#71717A' : '#9C9DA3',
    edge: cardEdge(dark),
    hairline: dark ? 'rgba(255,255,255,0.09)' : '#E7E7E4',
    onInk: dark ? '#0B0B0C' : '#FFFFFF',
  };
}

/** The 1.5px edge every card and control on this screen wears. */
export const EDGE_W = 1.5;
