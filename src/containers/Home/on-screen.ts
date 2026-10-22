import * as React from 'react';

/**
 * Whether each of Home's always-mounted animated zones is on screen:
 * - `hero`: the hero's dot field, in the feed's list header (never unmounts);
 * - `header`: the header's dot field, which slides off when the header hides;
 * - `showcase`: the black showcase's floating story sheets.
 * Without this they kept ~35 looping animations ticking on the UI thread
 * through the whole masonry scroll. Off screen they freeze where they are
 * (nothing unmounts, so coming back costs nothing).
 *
 * Set from the UI thread (feed-list / CollapsingHeader) only when a zone
 * crosses the viewport edge — a handful of times per scroll at most.
 */

export type Zone = 'hero' | 'header' | 'showcase';

const live: Record<Zone, boolean> = {
  hero: true,
  header: true,
  showcase: true,
};
const listeners = new Set<() => void>();

export function setOnScreen(zone: Zone, on: boolean) {
  if (live[zone] === on) return;
  live[zone] = on;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useOnScreen(zone: Zone | undefined) {
  return React.useSyncExternalStore(subscribe, () =>
    zone ? live[zone] : true
  );
}
