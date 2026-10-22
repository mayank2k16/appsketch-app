import type { AppColors } from '@/lib/theme';

/**
 * The white-theme answer to `scopeBrand` (src/lib/theme/BrandScope.ts) for the
 * Agent and Marketplace tabs.
 *
 * `scopeBrand` puts the magenta brand ramp on every action surface in BOTH
 * schemes. That is right for dark and wrong for white, where
 * docs/white-theme.md allows exactly one accent (orange, for the single key
 * action), ink-filled primary buttons, and the ramp only on the logo, a hero
 * word and the active tab icon. Dark passes through untouched.
 */
const WHITE_ACTIONS: Partial<AppColors> = {
  accent: '#F2600C',
  accentOn: '#FFFFFF',
  accentSoft: 'rgba(242,96,12,0.08)',
  tagText: '#5C5D63',
  tagBorder: '#E7E7E4',
  agentSendGradient: ['#0B0B0C', '#0B0B0C'],
  agentBorderGradient: ['#E7E7E4', '#E7E7E4', '#E7E7E4'],
  agentTabActiveBg: '#0B0B0C',
  agentTabActiveText: '#FFFFFF',
  codeEditorUserBubbleFrom: '#0B0B0C',
  codeEditorUserBubbleTo: '#0B0B0C',
  codeEditorToolChipActiveBg: '#F4F4F2',
  codeEditorToolChipActiveBorder: '#E7E7E4',
  codeEditorToolChipActiveText: '#0B0B0C',
  studioRailActiveBg: '#FFFFFF',
};

const cache = new WeakMap<AppColors, AppColors>();

/** Returns `t` unchanged in dark; in white, the same palette with the action
 *  tokens moved off the brand ramp onto ink + the one orange. */
export function whiteBrand(t: AppColors, isDark: boolean): AppColors {
  if (isDark) return t;
  let out = cache.get(t);
  if (!out) {
    out = { ...t, ...WHITE_ACTIONS } as AppColors;
    cache.set(t, out);
  }
  return out;
}
