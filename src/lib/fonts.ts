/**
 * Font family constants — Proxima Nova (3 weights)
 *
 * Usage:
 *   import { F } from '@/lib/fonts';
 *   style={{ fontFamily: F.display900, fontSize: 32 }}
 *
 * Font files: assets/fonts/ProximaNova-Regular.otf
 *                          ProximaNova-Bold.otf
 *                          ProximaNova-Black.otf
 */

export const F = {
  // ── Proxima Nova Regular (400) — body, captions, muted labels ──
  sans400: 'ProximaNova-Regular',
  sans500: 'ProximaNova-Regular',

  // ── Proxima Nova Bold (700) — sub-headings, labels, nav ──
  sans600:       'ProximaNova-Bold',
  sans700:       'ProximaNova-Bold',
  display700:    'ProximaNova-Bold',
  display700Italic: 'ProximaNova-Bold',

  // ── Proxima Nova Black (900) — hero titles, large display text ──
  sans800:       'ProximaNova-Black',
  sans900:       'ProximaNova-Black',
  display900:    'ProximaNova-Black',
  display900Italic: 'ProximaNova-Black',
} as const;
