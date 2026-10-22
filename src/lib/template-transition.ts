import type { useRouter } from 'expo-router';

import type { MarketTemplate } from '@/api/templates';

/**
 * The hand-off between a template tile (Home's studio mosaic, later the
 * Market) and the template product page (`/template/[key]`).
 *
 * The tile measures itself in window coordinates and parks the template plus
 * that rect here, then pushes the route. The product page reads it on mount
 * and grows the tile's image from `rect` into its hero frame, so the tap
 * reads as the tile itself opening — not as a new screen sliding in. On close
 * it shrinks back to the same rect.
 *
 * A module store rather than route params: a MarketTemplate is too big for a
 * URL, and the page must render its first frame from it synchronously (no
 * fetch, no flash). If the page is opened cold (deep link, restored state)
 * there is no pending entry and it opens without the grow-from-tile motion.
 */
type Router = ReturnType<typeof useRouter>;

export type TileRect = { x: number; y: number; width: number; height: number };

/** How the tile showed the template, so the hero can continue the frame. */
export type TileFrame = 'phone' | 'browser';

export type PendingTemplate = {
  template: MarketTemplate;
  rect: TileRect | null;
  frame: TileFrame;
  /** The tile's backdrop colours, so the page's backdrop can start from them. */
  backdrop?: readonly string[];
  /** The list the tile sat in (e.g. the studio's current category), in
   *  display order. The product page swipes left/right through it, starting
   *  at `template`. Absent → the page shows just this one template. */
  list?: readonly MarketTemplate[];
};

const pending = new Map<string, PendingTemplate>();

export function openTemplate(router: Router, entry: PendingTemplate) {
  pending.set(entry.template.key, entry);
  router.push({
    pathname: '/template/[key]',
    params: { key: entry.template.key },
  } as never);
}

/** The entry for this page, if a tile opened it. Kept (not deleted) so the
 *  close animation can shrink back to the same tile. */
export function getPendingTemplate(key: string): PendingTemplate | undefined {
  return pending.get(key);
}

export function clearPendingTemplate(key: string) {
  pending.delete(key);
}
