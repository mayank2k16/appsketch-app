import * as React from 'react';

import type { LiveSpot } from './recipes';

/**
 * The live-tile budget: which web tiles may mount a real WebView right now.
 *
 * - At most MAX live tiles at once.
 * - Chosen only once scrolling has been idle for IDLE_MS (every scroll event
 *   restarts the timer, momentum included), so nothing mounts during a fling.
 * - The tiles at least ~60% inside the viewport, nearest its centre (big
 *   tiles before strips), win.
 * - A live tile that leaves the viewport is dropped at once.
 * - `pause(true)` (product-page transition, screen blurred, app
 *   backgrounded) drops them all and blocks new ones.
 *
 * Plain JS store; each tile subscribes to its own key, so a change re-renders
 * only the one or two tiles whose state flipped.
 *
 * One instance per feed. Home's is `liveBudget` (the context default); the
 * category screen provides its own through `LiveBudgetContext`, so the two
 * never overwrite each other's spots. Tiles read the nearest one with
 * `useLiveBudget()` / `useIsLive()`.
 */

const MAX = 2;
const IDLE_MS = 400;
const MIN_VISIBLE = 0.6;

export class LiveBudget {
  private spots: LiveSpot[] = [];
  private listTop = 0;
  private offset = 0;
  private viewportH = 0;
  private paused = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();
  live = new Set<string>();

  setSpots(next: LiveSpot[]) {
    this.spots = next;
    this.emit(new Set());
    this.schedule();
  }

  setLayout(top: number, height: number) {
    this.listTop = top;
    this.viewportH = height;
    this.schedule();
  }

  onScroll(y: number) {
    this.offset = y;
    this.dropHidden();
    this.schedule();
  }

  pause(on: boolean) {
    this.paused = on;
    if (!on) return this.schedule();
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.emit(new Set());
  }

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };

  private emit(next: Set<string>) {
    const same =
      next.size === this.live.size && [...next].every((k) => this.live.has(k));
    if (same) return;
    this.live = next;
    this.listeners.forEach((l) => l());
  }

  private top(spot: LiveSpot) {
    return this.listTop + spot.y - this.offset;
  }

  private visibleShare(spot: LiveSpot) {
    const top = this.top(spot);
    const seen = Math.min(top + spot.h, this.viewportH) - Math.max(top, 0);
    return Math.max(0, seen) / spot.h;
  }

  private schedule() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.pick(), IDLE_MS);
  }

  private pick() {
    this.timer = null;
    if (this.paused || this.viewportH <= 0) return;
    const mid = this.viewportH / 2;
    const chosen = this.spots
      .filter((s) => this.visibleShare(s) >= MIN_VISIBLE)
      .map((s) => ({
        s,
        score:
          Math.abs(this.top(s) + s.h / 2 - mid) +
          s.rank * this.viewportH * 0.25,
      }))
      .sort((a, b) => a.score - b.score)
      .slice(0, MAX)
      .map((x) => x.s.key);
    this.emit(new Set(chosen));
  }

  /** Drops live tiles that have left the viewport (cheap: ≤ MAX lookups). */
  private dropHidden() {
    if (!this.live.size) return;
    const keep = [...this.live].filter((k) => {
      const spot = this.spots.find((s) => s.key === k);
      return !!spot && this.visibleShare(spot) > 0.05;
    });
    this.emit(new Set(keep));
  }
}

/** Home's budget. */
export const liveBudget = new LiveBudget();

export const LiveBudgetContext = React.createContext<LiveBudget>(liveBudget);

export const useLiveBudget = () => React.useContext(LiveBudgetContext);

/** True while this tile holds one of the nearest budget's live slots. */
export function useIsLive(key: string) {
  const budget = useLiveBudget();
  return React.useSyncExternalStore(
    budget.subscribe,
    () => budget.live.has(key),
    () => false
  );
}
