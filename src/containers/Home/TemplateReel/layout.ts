import { Dimensions } from 'react-native';

import type { MarketTemplate } from '@/api/templates';

/**
 * The reel's geometry and data shaping — pure functions, no React.
 *
 * The reel is the web /templates masonry turned sideways: a 3-row grid built
 * from packed COLUMNS, the whole strip drifting as one. Each column is one
 * of a few patterns (tall phone over a small site, three smalls, a big 2×2
 * site with two smalls under it…) so it reads as masonry, not rows. Every
 * height is a whole number of row units, so the grid's edges always line up.
 */

export const { width: W } = Dimensions.get('window');

/** Gap between cards, both ways. */
export const GAP = 6;
/** One row unit: a small card's full height, caption included. */
export const UNIT = 124;
export const GRID_H = UNIT * 3 + GAP * 2;
/** Card chrome: padding, caption row, gap between media and caption. */
export const CARD_PAD = 4;
export const CAPTION_H = 20;
export const MEDIA_GAP = 4;
/** Card widths: a narrow (phone) column, a small card, a big 2×2 card. */
export const NARROW_W = UNIT;
export const SMALL_W = Math.round(UNIT * 1.45);
export const BIG_W = SMALL_W * 2 + GAP;
/** px/s — slow enough to read the captions. */
export const SPEED = 14;
/** The phone frame's height as a share of its stage. */
export const PHONE_FILL = 0.95;
export const PHONE_RATIO = 390 / 812;

export type CardSpec = {
  key: string;
  template: MarketTemplate;
  w: number;
  h: number;
  mobile: boolean;
  /** Big tile showing a template the API marks as featured. */
  featured: boolean;
};
/** A column: cards stacked top to bottom; an array entry is a side-by-side
 *  pair (under or over a big card). */
export type Column = {
  key: string;
  w: number;
  items: (CardSpec | CardSpec[])[];
};

export const isMobile = (t: MarketTemplate) =>
  t.kind === 'code' && t.app_type === 'mobile';

/** The API's own thumbnail (never the full-size screenshot). */
export const thumbOf = (t: MarketTemplate) =>
  (t.kind === 'code' ? t.thumbnail_url : t.thumbnail_image) || '';

export const titleOf = (t: MarketTemplate) =>
  (t.kind === 'code' ? t.title : t.name) || 'Template';

/** The template's category label, if it has one. */
export function categoryOf(t: MarketTemplate): string | null {
  if (t.kind !== 'code') return null;
  if (t.ecosystem) return 'Ecosystem';
  return t.category || null;
}

export const kindOf = (t: MarketTemplate) => (isMobile(t) ? 'App' : 'Website');

/** Height of a card spanning `rows` row units. */
export const spanH = (rows: number) => UNIT * rows + GAP * (rows - 1);

type Want = 'mobile' | 'web';
/** One card slot in a pattern: preferred kind, width, rows spanned. */
type Slot = readonly [Want, number, number];
type Pattern = { w: number; items: (Slot | readonly Slot[])[] };

const tallPhone = (w: number): Slot => ['mobile', w, 2];
const site = (w: number): Slot => ['web', w, 1];
const bigSite: Slot = ['web', BIG_W, 2];
const pair = [site(SMALL_W), site(SMALL_W)] as const;

/** The column patterns, in order — varied so the grid reads as masonry. */
const PATTERNS: Pattern[] = [
  { w: NARROW_W, items: [tallPhone(NARROW_W), site(NARROW_W)] },
  { w: SMALL_W, items: [site(SMALL_W), site(SMALL_W), site(SMALL_W)] },
  { w: BIG_W, items: [bigSite, pair] },
  { w: NARROW_W, items: [site(NARROW_W), tallPhone(NARROW_W)] },
  { w: NARROW_W, items: [tallPhone(NARROW_W), site(NARROW_W)] },
  { w: SMALL_W, items: [site(SMALL_W), tallPhone(SMALL_W)] },
  { w: BIG_W, items: [pair, bigSite] },
  { w: NARROW_W, items: [site(NARROW_W), tallPhone(NARROW_W)] },
];
const MAX_COLUMNS = 14;

/** Hands out each template AT MOST ONCE: the preferred kind, else (phone
 *  slots only) a website, else null. */
function makePool(templates: MarketTemplate[]) {
  const lists = {
    mobile: templates.filter(isMobile),
    web: templates.filter((x) => !isMobile(x)),
  };
  let at = { mobile: 0, web: 0 };
  let n = 0;
  const take = ([want, w, rows]: Slot): CardSpec | null => {
    // A tall phone slot may take a website (a tall site card still looks
    // right); a website slot never takes a phone, which would shrink to a
    // speck in a one-row card.
    const kind: Want =
      at[want] < lists[want].length || want === 'web' ? want : 'web';
    const template = lists[kind][at[kind]];
    if (!template) return null;
    at = { ...at, [kind]: at[kind] + 1 };
    const featured =
      w === BIG_W && template.kind === 'code' && !!template.featured;
    const mobile = isMobile(template);
    return { key: `${n++}`, template, w, h: spanH(rows), mobile, featured };
  };
  return {
    take,
    save: () => at,
    restore: (saved: typeof at) => {
      at = saved;
    },
  };
}

/** Fills a pattern from the pool, or leaves the pool untouched and returns
 *  null if there aren't enough unused templates for every slot. */
function fill(pool: ReturnType<typeof makePool>, pattern: Pattern) {
  const saved = pool.save();
  let short = false;
  const items = pattern.items.map((item) => {
    if (isSlot(item)) {
      const spec = pool.take(item);
      if (!spec) short = true;
      return spec as CardSpec;
    }
    const specs = item.map((slot) => pool.take(slot));
    if (specs.some((x) => !x)) short = true;
    return specs as CardSpec[];
  });
  if (!short) return items;
  pool.restore(saved);
  return null;
}

const isSlot = (x: Slot | readonly Slot[]): x is Slot =>
  typeof x[0] === 'string';

/** One loop copy of the strip. No template appears twice in it: patterns are
 *  filled in order while unused templates remain, and a pattern that can't be
 *  filled is skipped — short data means fewer columns, never repeats. */
export function buildColumns(templates: MarketTemplate[]): Column[] {
  const pool = makePool(templates);
  const columns: Column[] = [];
  for (let pass = 0; pass < 3 && columns.length < MAX_COLUMNS; pass++) {
    const before = columns.length;
    for (const pattern of PATTERNS) {
      if (columns.length >= MAX_COLUMNS) break;
      const items = fill(pool, pattern);
      if (items) {
        columns.push({ key: `c${columns.length}`, w: pattern.w, items });
      }
    }
    if (columns.length === before) break;
  }
  return columns;
}

/** One copy's width: every column plus its gap. */
export function stripWidth(columns: Column[]) {
  return columns.reduce((x, c) => x + c.w + GAP, 0);
}

/** Real screenshots only, each template once (the two sources can overlap). */
export function pickTemplates(
  ...sources: ({ items: MarketTemplate[] }[] | undefined)[]
) {
  const seen = new Set<string>();
  return sources
    .flatMap((pages) => (pages ?? []).flatMap((p) => p.items))
    .filter((x) => {
      if (!thumbOf(x) || seen.has(x.key)) return false;
      seen.add(x.key);
      return true;
    });
}
