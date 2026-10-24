import type { TileRect } from '@/lib/template-transition';

/**
 * Where everything sits, computed once from the window and the safe area —
 * absolute and deterministic, so the grow animation knows its landing rect
 * synchronously (no measuring, no first-frame jump).
 *
 *   ┌──────────────────────── status bar ────────────────────────┐
 *   │▐  ┌─ hero: a phone-shaped card, centred ─────────┐  ▐│
 *   │▐  │ (X)  website: live site · app: its screenshot │  ▐│
 *   │▐  │                                               │  ▐│
 *   │▐  └───────────────────────────────────────────────┘  ▐│
 *   │      [ • LIVE | Mobile | Tablet | Desktop ]  (glass)      │
 *   │ ┌─ box (frosted glass): highlights · count / blurb / CTAs ┐ │
 *   │ └─────────────────────────────────────────────────────────┘ │
 *   └─────────────────────── home indicator ─────────────────────┘
 *
 * `▐` is the previous / next template peeking in at the screen edges.
 * Nothing above the hero (no breadcrumb): the template gets the focus.
 */

/** The gap between the panels and the screen edges / each other. */
export const GUTTER = 8;
/** How much of the previous / next template shows at the screen edges. */
export const PEEK = 4;
/** The hero's corner radius (continuous curve). */
export const HERO_RADIUS = 30;
/** The details box's corner radius. */
export const BOX_RADIUS = 26;
/** The details box's height: everything in it fits, no scrolling. */
const BOX_H = 132;
/** The device pills' row between the hero and the box. */
export const BAR_H = 34;
const BAR_GAP = 8;
/** The hero's width : height — a phone's shape, like the reference. */
const HERO_RATIO = 0.5;
/** The close button, inside the hero's top-left corner. */
export const CLOSE_SIZE = 34;
export const CLOSE_INSET = 10;

export type Geometry = {
  W: number;
  H: number;
  insetTop: number;
  insetBottom: number;
  /** The hero: a phone-shaped card, centred, from just under the status
   *  bar down to the pills row. */
  hero: TileRect;
  /** The same rect (websites and apps share it). */
  heroTall: TileRect;
  /** Page-to-page distance: one hero plus one gutter. */
  stride: number;
  /** The device pills' row, between the hero and the box. */
  bar: TileRect;
  /** The close button, over the hero's top-left corner. */
  close: TileRect;
  /** The details box under the bar. */
  box: TileRect;
};

type Insets = { top: number; bottom: number };

export function pageGeometry(W: number, H: number, insets: Insets): Geometry {
  const full = W - GUTTER * 2;
  const y = insets.top + 6;
  // Down to the home indicator (it may overlap the box's bottom padding).
  const boxBottom = H - Math.max(GUTTER, insets.bottom - 12);
  const boxY = boxBottom - BOX_H;
  const barY = boxY - BAR_GAP - BAR_H;
  const height = barY - BAR_GAP - y;
  const width = Math.min(full, Math.round(height * HERO_RATIO));
  const hero = { x: Math.round((W - width) / 2), y, width, height };
  return {
    W,
    H,
    insetTop: insets.top,
    insetBottom: insets.bottom,
    hero,
    heroTall: hero,
    stride: width + GUTTER,
    bar: { x: GUTTER, y: barY, width: full, height: BAR_H },
    close: {
      x: hero.x + CLOSE_INSET,
      y: y + CLOSE_INSET,
      width: CLOSE_SIZE,
      height: CLOSE_SIZE,
    },
    box: { x: GUTTER, y: boxY, width: full, height: boxBottom - boxY },
  };
}
