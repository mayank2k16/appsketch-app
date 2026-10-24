import type { TileRect } from '@/lib/template-transition';

/**
 * Where everything sits, computed once from the window and the safe area —
 * absolute and deterministic, so the grow animation knows its landing rect
 * synchronously (no measuring, no first-frame jump).
 *
 *   ┌──────────────────────── status bar ────────────────────────┐
 *   │   Templates › Category › Template name           (22pt)    │
 *   │ ┌─ hero, 8pt from the edges ────────────────────────────┐ ▐│
 *   │ │ (X)   [ • LIVE | Mobile | Tablet | Desktop ] (glass)  │ ▐│
 *   │ │  website: live site · app: its screenshot             │ ▐│
 *   │ │  (runs down to 8pt above the box, websites and apps)  │ ▐│
 *   │ └───────────────────────────────────────────────────────┘ ▐│
 *   │ ┌─ box: highlight chips · count / 1-line blurb / CTAs ──┐  │
 *   │ └───────────────────────────────────────────────────────┘  │
 *   └─────────────────────── home indicator ─────────────────────┘
 *
 * `▐` is the next template peeking in (PEEK pt) over the 8pt gutter.
 */

/** The gap between the panels and the screen edges / each other. */
export const GUTTER = 8;
/** How much of the previous / next template shows at the screen edges. */
export const PEEK = 4;
/** The hero's corner radius (continuous curve). */
export const HERO_RADIUS = 30;
/** The details box's corner radius. */
export const BOX_RADIUS = 26;
/** The details box's least height: everything in it fits, no scrolling. */
const BOX_MIN = 150;
/** Where the box starts, as a share of the screen height: the template
 *  gets ~80% of the screen, the details stay short. */
const HERO_BOTTOM = 0.8;
/** The plain gap between the hero and the box. */
const HERO_GAP = 8;
/** The close button, inside the hero's top-left corner. */
export const CLOSE_SIZE = 34;
export const CLOSE_INSET = 10;
/** The breadcrumb row in the strip under the status bar. */
export const CRUMB_H = 22;

export type Geometry = {
  W: number;
  H: number;
  insetTop: number;
  insetBottom: number;
  /** The hero: runs down to 8pt above the box. */
  hero: TileRect;
  /** The same rect (websites and apps share it since the device pills
   *  moved onto the hero). */
  heroTall: TileRect;
  /** Page-to-page distance: one hero plus one gutter. */
  stride: number;
  /** The device pills' row, inside the hero's top edge (level with the
   *  close button). */
  bar: TileRect;
  /** The close button, over the hero's top-left corner. */
  close: TileRect;
  /** Templates › Category › Name, above the hero. */
  crumbs: TileRect;
  /** The details box under the bar. */
  box: TileRect;
};

type Insets = { top: number; bottom: number };

export function pageGeometry(W: number, H: number, insets: Insets): Geometry {
  const width = W - GUTTER * 2;
  const crumbY = insets.top + 1;
  const y = crumbY + CRUMB_H + 3;
  // Down to the home indicator (it may overlap the box's bottom padding).
  const boxBottom = H - Math.max(GUTTER, insets.bottom - 12);
  // ~80% for the template, but never squeezing the details below BOX_MIN.
  const boxY = Math.min(Math.round(H * HERO_BOTTOM), boxBottom - BOX_MIN);
  const hero = { x: GUTTER, y, width, height: boxY - HERO_GAP - y };
  return {
    W,
    H,
    insetTop: insets.top,
    insetBottom: insets.bottom,
    hero,
    heroTall: hero,
    stride: width + GUTTER,
    bar: { x: GUTTER, y: y + CLOSE_INSET, width, height: CLOSE_SIZE },
    crumbs: { x: GUTTER + 6, y: crumbY, width: width - 12, height: CRUMB_H },
    close: {
      x: GUTTER + CLOSE_INSET,
      y: y + CLOSE_INSET,
      width: CLOSE_SIZE,
      height: CLOSE_SIZE,
    },
    box: { x: GUTTER, y: boxY, width, height: boxBottom - boxY },
  };
}
