import type { MarketTemplate } from '@/api/templates';

import { GAP, SHORT } from '../Home/Studio/geometry';
import {
  buildFeed,
  type Cell,
  type LiveSpot,
  type Row,
  type TypeWord,
} from '../Home/Studio/recipes';
import { buildUrl } from '../TemplateProduct/live-url';

/**
 * The category screen's bento — Home's recipes (`buildFeed`), with Home's one
 * black showcase flattened into ordinary rows (the black section and its
 * chrome tone belong to Home). Then every row is re-indexed: display order
 * (the product page swipes through it) and live spots, in list-content
 * coordinates. Pure, no React.
 */

export type DealRow = Row & {
  key: string;
  /** FlashList recycling type: the row's column/cell signature. */
  type: string;
};

export type Deal = {
  rows: DealRow[];
  order: MarketTemplate[];
  live: LiveSpot[];
};

const LIVEABLE = new Set(['large', 'wide', 'site']);

const signature = (row: Row) =>
  row.cols
    .map((c) => `${c.span}:${c.cells.map((k) => k.kind).join('+')}`)
    .join('|');

function indexCell(cell: Cell, at: { y: number; h: number }, deal: Deal) {
  if (!('t' in cell)) return;
  const t = cell.t;
  deal.order.push(t);
  const spot = { key: t.key, y: at.y, h: at.h, rank: 0 };
  const url = buildUrl(t.kind === 'code' ? t.preview_url : undefined);
  if (url && LIVEABLE.has(cell.kind)) {
    deal.live.push({ ...spot, url, rank: cell.kind === 'site' ? 1 : 0 });
  }
}

function indexRow(row: Row, y: number, deal: Deal) {
  for (const col of row.cols) {
    let cy = y;
    const cellH = col.cells.length > 1 ? SHORT : row.h;
    for (const cell of col.cells) {
      indexCell(cell, { y: cy, h: cellH }, deal);
      cy += cellH + GAP;
    }
  }
}

export function buildDeal(
  templates: MarketTemplate[],
  words: TypeWord[],
  tag: string
): Deal {
  const feed = buildFeed(templates, words, tag);
  const rows: DealRow[] = [];
  for (const item of feed.items) {
    if (item.kind === 'row') {
      rows.push({ key: item.key, h: item.h, cols: item.cols, type: '' });
    } else {
      item.rows.forEach((r, i) =>
        rows.push({ key: `${item.key}-${i}`, h: r.h, cols: r.cols, type: '' })
      );
    }
  }
  const deal: Deal = { rows, order: [], live: [] };
  let y = 0;
  for (const row of rows) {
    row.type = signature(row);
    indexRow(row, y, deal);
    y += row.h + GAP;
  }
  return deal;
}
