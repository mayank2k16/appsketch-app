const API_ORIGIN = 'https://appsketch.ai';

/**
 * Normalizes a backend-supplied media URL (category/product images, etc.)
 * so native image loaders can actually fetch it.
 *
 * Two backend quirks slip through unnoticed on web but break on-device:
 * - A host-relative path (e.g. "/media/categories/x.jpg") resolves fine as
 *   an `<img src>` in a browser (against the page's own origin) but native
 *   `Image` loaders need an absolute URL with a scheme — without one the
 *   request never fires.
 * - A plain `http://` URL loads in a browser regardless, but iOS ATS
 *   (`NSAllowsArbitraryLoads: false` in Info.plist, no exception domain for
 *   appsketch.ai) and Android's release cleartext policy silently block it
 *   on-device.
 *
 * Both cases render as "nothing" natively with no visible error, which is
 * exactly the "works in web preview, blank on device" symptom this fixes.
 */
export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://'))
    return `https://${path.slice('http://'.length)}`;
  if (/^https:\/\//i.test(path)) return path;
  if (path.startsWith('data:') || path.startsWith('file:')) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}
