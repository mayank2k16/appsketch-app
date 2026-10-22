import type { MarketTemplate } from '@/api/templates';

import { buildUrl } from '../../TemplateProduct/live-url';
import { isMobile } from '../TemplateReel/layout';
import {
  GAP,
  SHORT,
  SHOWCASE_AFTER,
  SHOWCASE_BODY_Y,
  showcaseHeight,
  TALL,
  WIDE_H,
} from './geometry';

/**
 * The studio feed as data — pure, no React.
 *
 * The feed is a list of ROWS, each a recipe that fills the 3 columns exactly
 * (iOS-widget-style bento: tall phones, a 2×2 live site, a big typographic
 * category word, a "Create yours" tile…). Recipes cycle in ORDER; a recipe
 * the remaining templates cannot fill is skipped, and small fallbacks always
 * finish the list, so there are never holes. Once the rows above are about
 * 1.6 screens tall, ONE black showcase goes in: its own curated bento of
 * phones and browser-framed websites (SHOWCASE_PLAN), under a heading.
 *
 * Deterministic: the same templates always give the same feed.
 */

export type CellKind =
  | 'phone'
  | 'large'
  | 'site'
  | 'small'
  | 'wide'
  | 'type'
  | 'action';

export type Cell =
  | { kind: 'phone' | 'large' | 'site' | 'small' | 'wide'; t: MarketTemplate }
  | { kind: 'type'; category: string; count: number }
  | { kind: 'action' };

export type Column = { span: 1 | 2 | 3; cells: Cell[] };

/** One bento row: a recipe's height and its filled columns. */
export type Row = { h: number; cols: Column[] };

export type FeedItem =
  | ({ kind: 'row'; key: string; recipe: string } & Row)
  | { kind: 'showcase'; key: string; h: number; rows: Row[] };

/** A tile that can host a live WebView, in list-content coordinates. */
export type LiveSpot = {
  key: string;
  url: string;
  y: number;
  h: number;
  /** Lower wins at equal distance — big tiles before strips. */
  rank: number;
};

type Recipe = { name: string; h: number; cols: [1 | 2 | 3, CellKind[]][] };

const r = (name: string, h: number, cols: Recipe['cols']): Recipe => ({
  name,
  h,
  cols,
});

const FEATURE_L = r('feature-l', TALL, [
  [2, ['large']],
  [1, ['phone']],
]);
const FEATURE_R = r('feature-r', TALL, [
  [1, ['phone']],
  [2, ['large']],
]);
const TRIO = r('trio', TALL, [
  [1, ['phone']],
  [1, ['phone']],
  [1, ['phone']],
]);
const BENTO = r('bento', TALL, [
  [1, ['phone']],
  [1, ['type', 'small']],
  [1, ['phone']],
]);
const BENTO_R = r('bento-r', TALL, [
  [1, ['small', 'small']],
  [1, ['phone']],
  [1, ['small', 'type']],
]);
const STACK = r('stack', TALL, [
  [2, ['large']],
  [1, ['small', 'small']],
]);
const STACK_R = r('stack-r', TALL, [
  [1, ['small', 'type']],
  [2, ['large']],
]);
const STRIP_L = r('strip-l', SHORT, [
  [2, ['site']],
  [1, ['small']],
]);
const STRIP_R = r('strip-r', SHORT, [
  [1, ['small']],
  [2, ['site']],
]);
const TYPE_ROW = r('type-row', SHORT, [
  [1, ['type']],
  [2, ['site']],
]);
const SMALLS = r('smalls', SHORT, [
  [1, ['small']],
  [1, ['action']],
  [1, ['small']],
]);
const WIDE = r('wide', WIDE_H, [[3, ['wide']]]);

const ORDER: Recipe[] = [
  FEATURE_L,
  STRIP_L,
  TRIO,
  WIDE,
  BENTO,
  STRIP_R,
  FEATURE_R,
  TYPE_ROW,
  BENTO_R,
  SMALLS,
  STACK,
  STRIP_L,
  WIDE,
  STACK_R,
];

/** Always-fillable tails for the last one or two phones. */
const TAIL_2 = r('tail-2', TALL, [
  [1, ['phone']],
  [1, ['phone']],
  [1, ['type', 'action']],
]);
const TAIL_1 = r('tail-1', TALL, [
  [1, ['phone']],
  [1, ['type', 'action']],
  [1, ['small', 'small']],
]);
const TAIL_1_BARE = r('tail-1b', TALL, [
  [1, ['phone']],
  [1, ['type', 'action']],
  [1, ['type', 'type']],
]);

const WEB_KINDS: CellKind[] = ['large', 'site', 'small', 'wide'];

function needs(recipe: Recipe) {
  let phones = 0;
  let webs = 0;
  for (const [, kinds] of recipe.cols) {
    for (const k of kinds) {
      if (k === 'phone') phones++;
      else if (WEB_KINDS.includes(k)) webs++;
    }
  }
  return { phones, webs };
}

type Pool = {
  phones: MarketTemplate[];
  webs: MarketTemplate[];
  p: number;
  w: number;
};

const fits = (pool: Pool, recipe: Recipe) => {
  const n = needs(recipe);
  return (
    pool.phones.length - pool.p >= n.phones &&
    pool.webs.length - pool.w >= n.webs
  );
};

export type TypeWord = { category: string; count: number };

/** Hands out category words in turn (never the category on screen). */
function wordCycle(words: TypeWord[]) {
  let i = 0;
  return () => {
    const w = words.length
      ? words[i++ % words.length]
      : { category: 'All', count: 0 };
    return { kind: 'type' as const, ...w };
  };
}

function fillCell(kind: CellKind, pool: Pool, word: () => Cell): Cell {
  if (kind === 'type') return word();
  if (kind === 'action') return { kind: 'action' };
  if (kind === 'phone') return { kind, t: pool.phones[pool.p++] };
  return { kind, t: pool.webs[pool.w++] } as Cell;
}

function pickRecipe(pool: Pool, turn: number): Recipe | null {
  for (let k = 0; k < ORDER.length; k++) {
    const recipe = ORDER[(turn + k) % ORDER.length];
    if (fits(pool, recipe)) return recipe;
  }
  const phonesLeft = pool.phones.length - pool.p;
  const websLeft = pool.webs.length - pool.w;
  if (phonesLeft >= 2) return TAIL_2;
  if (phonesLeft === 1) return websLeft >= 2 ? TAIL_1 : TAIL_1_BARE;
  return null;
}

export type Feed = {
  items: FeedItem[];
  /** Every template in display order — the product page swipes through it. */
  order: MarketTemplate[];
  live: LiveSpot[];
  /** The showcase's y and height in list-content coordinates, if any. */
  showcase: { y: number; h: number } | null;
};

const LIVEABLE: CellKind[] = ['large', 'wide', 'site'];

/** Display order and live spots for one cell at content y. */
function indexCell(cell: Cell, at: { y: number; h: number }, feed: Feed) {
  if (!('t' in cell)) return;
  const t = cell.t;
  feed.order.push(t);
  const spot = { key: t.key, y: at.y, h: at.h, rank: 0 };
  const url = buildUrl(t.kind === 'code' ? t.preview_url : undefined);
  if (url && LIVEABLE.includes(cell.kind)) {
    feed.live.push({ ...spot, url, rank: cell.kind === 'site' ? 1 : 0 });
  }
}

/** Collects display order + live spots for one row at content y. */
function indexRow(row: Row, y: number, feed: Feed) {
  for (const col of row.cols) {
    let cy = y;
    const cellH = col.cells.length > 1 ? SHORT : row.h;
    for (const cell of col.cells) {
      indexCell(cell, { y: cy, h: cellH }, feed);
      cy += cellH + GAP;
    }
  }
}

/** The showcase's curated bento, top to bottom: phones, a wide live site,
 *  a phone beside a large site, phones, a large site beside a phone, a
 *  wide live site, phones. A row the pool cannot fill is skipped. */
const SHOWCASE_PLAN: Recipe[] = [
  TRIO,
  WIDE,
  FEATURE_R,
  TRIO,
  FEATURE_L,
  WIDE,
  TRIO,
];

const fillRow = (recipe: Recipe, pool: Pool, word: () => Cell): Row => ({
  h: recipe.h,
  cols: recipe.cols.map(([span, kinds]) => ({
    span,
    cells: kinds.map((k) => fillCell(k, pool, word)),
  })),
});

/** The ONE black showcase at content y `y` (rows indexed in place), or
 *  null if the pool cannot fill at least two of its rows. */
function takeShowcase(pool: Pool, y: number, feed: Feed): FeedItem | null {
  const trial = { ...pool };
  const usable = SHOWCASE_PLAN.filter((r) => {
    if (!fits(trial, r)) return false;
    const n = needs(r);
    trial.p += n.phones;
    trial.w += n.webs;
    return true;
  });
  if (usable.length < 2) return null;
  const word = () => ({ kind: 'action' }) as Cell;
  const rows = usable.map((r) => fillRow(r, pool, word));
  let ry = y + SHOWCASE_BODY_Y;
  for (const row of rows) {
    indexRow(row, ry, feed);
    ry += row.h + GAP;
  }
  const h = showcaseHeight(rows.map((r) => r.h));
  return { kind: 'showcase', key: `showcase-${feed.items.length}`, h, rows };
}

export function buildFeed(
  templates: MarketTemplate[],
  words: TypeWord[],
  tag: string
): Feed {
  const pool: Pool = {
    phones: templates.filter(isMobile),
    webs: templates.filter((t) => !isMobile(t)),
    p: 0,
    w: 0,
  };
  const word = wordCycle(words);
  const feed: Feed = {
    items: [],
    order: [],
    live: [],
    showcase: null,
  };
  let y = 0;
  for (let turn = 0; ; turn++) {
    if (!feed.showcase && y >= SHOWCASE_AFTER) {
      const sc = takeShowcase(pool, y, feed);
      if (sc) {
        feed.items.push({ ...sc, key: `${tag}-${sc.key}` });
        feed.showcase = { y, h: sc.h };
        y += sc.h + GAP;
      }
    }
    const recipe = pickRecipe(pool, turn);
    if (!recipe) break;
    const row = fillRow(recipe, pool, word);
    feed.items.push({
      kind: 'row',
      key: `${tag}-${turn}`,
      recipe: recipe.name,
      ...row,
    });
    indexRow(row, y, feed);
    y += recipe.h + GAP;
  }
  return feed;
}

/** A row item's full height in the list (its own gap included). */
export const itemHeight = (item: FeedItem) => item.h + GAP;
