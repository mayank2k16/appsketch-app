import type { MarketTemplate } from '@/api/templates';
import { isMobile, thumbOf } from '@/containers/Home/TemplateReel/layout';

/**
 * What the hero renders.
 *
 * - Anything with a web build (`preview_url`), ecosystem or not: the live
 *   site (`/builds/<uuid>`).
 * - Mobile (Expo) apps (`app_type === 'mobile'`): no live site. The hero shows the app's screenshot instead
 *   (`hero-shot.tsx`); "Run it live" is how an app is tried. The web-runner's
 *   `/preview/<uuid>/` render is not used here: a cold one costs the server
 *   a Metro start and a ~9MB dev bundle (7-45s).
 * - Layout templates: none.
 */

/**
 * A web build's URL without the trailing slash: `/builds/<uuid>/` answers
 * with a 308 to `/builds/<uuid>` (one wasted round trip, ~100ms), and the
 * build's assets are absolute paths, so the slash-less URL is safe.
 */
export function buildUrl(url: string | null | undefined): string {
  return (url || '').replace(/(\/builds\/[^/?#]+)\/$/, '$1');
}

/** Mobile apps only: the hero shows their screenshot, not a live render.
 *  (An ecosystem whose lead app is a website is a website.) */
export function isAppShot(t: MarketTemplate): boolean {
  return isMobile(t);
}

export function liveUrlOf(t: MarketTemplate): string {
  if (t.kind !== 'code' || isMobile(t)) return '';
  return buildUrl(t.preview_url);
}

/** Whether the hero has something to show: a live site, or an app's
 *  screenshot. */
export function hasHero(t: MarketTemplate): boolean {
  return isAppShot(t) ? !!thumbOf(t) : !!liveUrlOf(t);
}

export type Device = 'mobile' | 'tablet' | 'desktop';

export const DEVICES: readonly { key: Device; label: string }[] = [
  { key: 'mobile', label: 'Mobile' },
  { key: 'tablet', label: 'Tablet' },
  { key: 'desktop', label: 'Desktop' },
];

/** The CSS viewport width each device renders at (then scaled to fit). */
export const VIEWPORT: Record<Device, number> = {
  mobile: 390,
  tablet: 820,
  desktop: 1280,
};
