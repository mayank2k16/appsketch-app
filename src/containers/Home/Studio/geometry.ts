import { Dimensions } from 'react-native';

/**
 * The studio feed's geometry — pure numbers, no React.
 *
 * A 3-column bento with 8px outer padding and 6px gaps. A phone tile is one
 * column wide and its frame fills the column, so three phones fit a row
 * exactly. Every row height is one of a few values, and stacked cells inside
 * a tall row split it exactly, so no row is ever ragged.
 */

export const { width: W, height: H } = Dimensions.get('window');

export const PAD = 8;
export const GAP = 6;
export const COL_W = (W - PAD * 2 - GAP * 2) / 3;
export const SPAN2 = COL_W * 2 + GAP;
export const SPAN3 = W - PAD * 2;

/** The name row under a phone / small tile. */
export const LABEL_H = 22;
export const PHONE_W = COL_W;
export const PHONE_H = (PHONE_W * 812) / 390;

/** A tall row: a phone and its name. */
export const TALL = PHONE_H + LABEL_H;
/** Half a tall row (two of these + a gap = TALL); also the short row height. */
export const SHORT = (TALL - GAP) / 2;

/** Web screenshots are 16:10 desktop captures. */
export const WEB_RATIO = 1.6;
export const BAR_H = 14;
/** Full-width live site: browser bar + a 16:10 page + the name row. */
export const WIDE_H = BAR_H + SPAN3 / WEB_RATIO + LABEL_H;

/** Corner radius of every tile — square-ish. */
export const RADIUS = 10;

/** The black showcase: a heading, then its own bento rows (phones and
 *  browser-framed sites), then the "Create yours" pill. With its full plan
 *  it is about 2.5 screens tall, so for a long stretch of scroll the header
 *  and the tab bar are both over black. */
export const SHOWCASE_TOP = 28;
export const SHOWCASE_HEAD = 132;
/** Where the first bento row starts, from the showcase's top. */
export const SHOWCASE_BODY_Y = SHOWCASE_TOP + SHOWCASE_HEAD;
/** The pill and the space around it, under the last row. */
export const SHOWCASE_FOOT = 96;
export function showcaseHeight(rows: number[]) {
  const body = rows.reduce((a, h) => a + h, 0) + GAP * (rows.length - 1);
  return SHOWCASE_BODY_Y + body + SHOWCASE_FOOT;
}

/** The showcase goes in once the feed above it is about this tall. */
export const SHOWCASE_AFTER = H * 1.6;

/** The edge of every white / near-white card on the page, so it reads on
 *  the off-white canvas (matches the product page's panels). */
export const CARD_EDGE_W = 1.5;
export const cardEdge = (dark: boolean) =>
  dark ? 'rgba(255,255,255,0.16)' : '#CFCFCA';
