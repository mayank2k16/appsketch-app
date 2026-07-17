/**
 * Font family constants — Inter (static weights via @expo-google-fonts/inter)
 *
 * Inter replaces Proxima Nova app-wide. Every screen references these `F`
 * tokens, so remapping here swaps the font globally. Weights are loaded in
 * `src/app/_layout.tsx` through `useFonts`.
 *
 * Usage:
 *   import { F } from '@/lib/fonts';
 *   style={{ fontFamily: F.display900, fontSize: 32 }}
 */

export const F = {
  // ── Inter Regular (400) — body, captions, muted labels ──
  sans400: 'Inter_400Regular',
  sans500: 'Inter_500Medium',

  // ── Inter SemiBold / Bold — sub-headings, labels, nav ──
  sans600:          'Inter_600SemiBold',
  sans700:          'Inter_700Bold',
  display700:       'Inter_700Bold',
  display700Italic: 'Inter_700Bold',

  // ── Inter ExtraBold / Black — hero titles, large display text ──
  sans800:          'Inter_800ExtraBold',
  sans900:          'Inter_900Black',
  display900:       'Inter_800ExtraBold',
  display900Italic: 'Inter_800ExtraBold',
} as const;
