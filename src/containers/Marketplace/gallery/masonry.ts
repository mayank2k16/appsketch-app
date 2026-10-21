import type { MarketTemplate } from '@/api/templates';

/**
 * The web gallery's masonry, for a phone's two columns. Three shapes, as on
 * appsketch.ai/templates:
 *
 *   ''      a website      one column, one row      its screenshot at 16:10
 *   'tall'  a phone app    one column, two rows     a phone on a stage
 *   'wide'  a feature      both columns             every 5th published website
 *
 * A row is one website card's height, so a tall card is two rows and a gap,
 * and two websites stack beside one phone with nothing left over. The list
 * is cut into blocks for the FlatList: a feature on its own, or a run of
 * cards dealt into two columns, each card to the shorter one.
 */
export type Shape = '' | 'tall' | 'wide';

export type Placed = { template: MarketTemplate; shape: Shape; index: number };

export type Block =
  | { type: 'wide'; key: string; card: Placed }
  | { type: 'cols'; key: string; left: Placed[]; right: Placed[] };

const FEATURE_EVERY = 5;

export const isMobileApp = (t: MarketTemplate) =>
  t.kind === 'code' && t.app_type === 'mobile';

export function shapesOf(items: MarketTemplate[]): Shape[] {
  let websites = 0;
  return items.map((t): Shape => {
    if (isMobileApp(t)) return 'tall';
    if (t.kind !== 'code') return '';
    return websites++ % FEATURE_EVERY === 0 ? 'wide' : '';
  });
}

/** Rows a shape takes in a column. */
const rows = (shape: Shape) => (shape === 'tall' ? 2 : 1);

export function toBlocks(items: MarketTemplate[]): Block[] {
  const shapes = shapesOf(items);
  const blocks: Block[] = [];
  let left: Placed[] = [];
  let right: Placed[] = [];
  let lh = 0;
  let rh = 0;

  const flush = () => {
    if (!left.length && !right.length) return;
    const first = left[0] ?? right[0];
    blocks.push({ type: 'cols', key: `c-${first.template.key}`, left, right });
    left = [];
    right = [];
    lh = 0;
    rh = 0;
  };

  // A feature waits until the columns are level, so it never leaves a hole
  // under the shorter one (the web's `grid-auto-flow: dense`, by hand).
  let waiting: Placed[] = [];
  const placeWaiting = () => {
    flush();
    for (const card of waiting)
      blocks.push({ type: 'wide', key: `w-${card.template.key}`, card });
    waiting = [];
  };

  items.forEach((template, index) => {
    const shape = shapes[index];
    const card = { template, shape, index };
    if (shape === 'wide') {
      waiting.push(card);
    } else if (lh <= rh) {
      left.push(card);
      lh += rows(shape);
    } else {
      right.push(card);
      rh += rows(shape);
    }
    if (waiting.length && lh === rh) placeWaiting();
  });
  placeWaiting();
  return blocks;
}
