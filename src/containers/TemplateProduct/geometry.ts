import type { TileRect } from '@/lib/template-transition';

/**
 * Where everything sits, computed once from the window and the safe area —
 * absolute and deterministic, so the grow animation knows its landing rect
 * synchronously (no measuring, no first-frame jump).
 *
 *   ┌──────────────────────── status bar ────────────────────────┐
 *   │▐ ┌─ hero: a website's live site, edge to edge ───────┐ ▐│
 *   │▐ │ (X)          [ Mobile | Tablet | Desktop ]         │ ▐│
 *   │▐ │                                                    │ ▐│
 *   │▐ └─────────────── down to the box ─────────────────────┘ ▐│
 *   │ ┌─ box (frosted glass): highlights · count / blurb / CTAs ┐ │
 *   │ └─────────────────────────────────────────────────────────┘ │
 *   └─────────────────────── home indicator ─────────────────────┘
 *
 * An app instead sits in `phone`: the Home masonry's iPhone frame, as tall
 * as the hero and centred in it, so apps and websites read differently at a
 * glance. `▐` is the previous / next template peeking in at the edges.
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
const BOX_GAP = 8;
/** The hero's width : height — a little wider than a phone. */
const HERO_RATIO = 0.58;
/** The hero's least margin to the screen edge (the neighbours peek there). */
const HERO_MARGIN = 12;
/** Between neighbouring pages (so the side cards barely peek in). */
const PAGE_GAP = 12;
/** The close button, inside the hero's top-left corner. */
export const CLOSE_SIZE = 34;
export const CLOSE_INSET = 10;
/** The landing-page iPhone's height : width (phone-frame.tsx). */
const PHONE_ASPECT = 812 / 390;

export type Geometry = {
  W: number;
  H: number;
  insetTop: number;
  insetBottom: number;
  /** A website's hero: centred, from under the status bar to the box. */
  hero: TileRect;
  /** An app's iPhone frame: the hero's height, centred in it. */
  phone: TileRect;
  /** Page-to-page distance: one hero plus one gap. */
  stride: number;
  /** The device pills, inside the hero's top edge, right-aligned. */
  bar: TileRect;
  /** The close button, over the hero's top-left corner. */
  close: TileRect;
  /** An app's close button, just left of the phone's rim. */
  closeApp: TileRect;
  /** The details box at the bottom. */
  box: TileRect;
};

type Insets = { top: number; bottom: number };

export function pageGeometry(W: number, H: number, insets: Insets): Geometry {
  const full = W - GUTTER * 2;
  const y = insets.top + 4;
  // Down to the home indicator (it may overlap the box's bottom padding).
  const boxBottom = H - Math.max(GUTTER, insets.bottom - 12);
  const boxY = boxBottom - BOX_H;
  const height = boxY - BOX_GAP - y;
  const width = Math.min(W - HERO_MARGIN * 2, Math.round(height * HERO_RATIO));
  const x = Math.round((W - width) / 2);
  const pw = Math.min(width, Math.floor(height / PHONE_ASPECT));
  const ph = Math.round(pw * PHONE_ASPECT);
  const phone = { x: Math.round((W - pw) / 2), y, width: pw, height: ph };
  const closeX = x + CLOSE_INSET;
  const barX = closeX + CLOSE_SIZE + 8;
  return {
    W,
    H,
    insetTop: insets.top,
    insetBottom: insets.bottom,
    hero: { x, y, width, height },
    phone,
    stride: width + PAGE_GAP,
    bar: {
      x: barX,
      y: y + CLOSE_INSET,
      width: x + width - CLOSE_INSET - barX,
      height: CLOSE_SIZE,
    },
    close: {
      x: closeX,
      y: y + CLOSE_INSET,
      width: CLOSE_SIZE,
      height: CLOSE_SIZE,
    },
    closeApp: {
      x: Math.max(4, phone.x - CLOSE_SIZE - 6),
      y: y + CLOSE_INSET,
      width: CLOSE_SIZE,
      height: CLOSE_SIZE,
    },
    box: { x: GUTTER, y: boxY, width: full, height: boxBottom - boxY },
  };
}
