import { appTheme } from '@/lib/theme/AppTheme';

/**
 * The product page's colours. The page follows the app theme — white
 * panels in light, graphite panels in dark — over a frosted backdrop made
 * from the template's own screenshot (page-backdrop.tsx); panels are set
 * apart by hairlines, never shadows. `page` is the backdrop's base colour.
 */
export const INK = '#0B0B0C';
/** The app's accent orange (`appTheme.light.accent`). */
export const BRAND_ORANGE = appTheme.light.accent;

export type PageTheme = {
  page: string;
  /** The two panels (hero frame + details box). */
  panel: string;
  /** The panels' 1.5pt border: the brand orange, in both themes. */
  frame: string;
  /** The neutral edge of the small controls (close X, device pills). */
  panelEdge: string;
  edge: string;
  ink: string;
  muted: string;
  chip: string;
  chipEdge: string;
  /** Primary CTA: ink on white, white on dark. */
  primaryBg: string;
  primaryFg: string;
  outline: string;
};

const LIGHT: PageTheme = {
  page: '#F1F1EE',
  panel: '#FFFFFF',
  frame: BRAND_ORANGE,
  panelEdge: '#CFCFCA',
  edge: '#E7E7E4',
  ink: INK,
  muted: '#5C5C60',
  chip: '#F1F1EE',
  chipEdge: '#E4E4E0',
  primaryBg: INK,
  primaryFg: '#FFFFFF',
  outline: '#D4D4D0',
};

const DARK: PageTheme = {
  page: '#050506',
  panel: '#111113',
  frame: BRAND_ORANGE,
  panelEdge: 'rgba(255,255,255,0.2)',
  edge: 'rgba(255,255,255,0.08)',
  ink: '#F4F4F5',
  muted: '#A1A1A6',
  chip: 'rgba(255,255,255,0.06)',
  chipEdge: 'rgba(255,255,255,0.1)',
  primaryBg: '#FFFFFF',
  primaryFg: INK,
  outline: 'rgba(255,255,255,0.22)',
};

export const pageTheme = (dark: boolean) => (dark ? DARK : LIGHT);

/** The grow spring, per the Joker reference: soft, no overshoot to speak of. */
export const GROW_SPRING = { damping: 18, stiffness: 140, mass: 1 } as const;
/** A page settling after a swipe. */
export const PAGE_SPRING = { damping: 32, stiffness: 340, mass: 1 } as const;
