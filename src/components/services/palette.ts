import { useColorScheme } from 'nativewind';

import { type AppColors, useAppTheme } from '@/lib/theme';

/**
 * Colours for the services screens (planner, cart, domains). White follows
 * docs/white-theme.md: canvas / raised / inset surfaces, one hairline, ink,
 * and orange only on the key action. Dark keeps the app's dark surfaces.
 */
export function servicesPalette(t: AppColors) {
  const dark = t.statusBar === 'light-content';
  const shared = {
    dark,
    text: t.text,
    sub: t.textSub,
    muted: t.textMuted,
    orange: '#F2600C',
    onOrange: '#0B0B0C',
    success: dark ? '#3DD68C' : '#12A150',
    error: '#E5484D',
    warning: dark ? '#F5A524' : '#D97706',
    barGrad: ['#17110D', '#0B0B12'] as const,
    barText: '#FFFFFF',
    barSub: 'rgba(255,255,255,0.62)',
  };
  return dark
    ? {
        ...shared,
        canvas: t.bg,
        raised: '#151517',
        inset: 'rgba(255,255,255,0.06)',
        hairline: 'rgba(255,255,255,0.10)',
        ink: '#F6F7FA',
        onInk: '#0B0B0C',
        plannerGrad: ['#1E1611', '#161314', '#121214'] as const,
        plannerBorder: 'rgba(255,255,255,0.10)',
        tile: 'rgba(255,255,255,0.04)',
      }
    : {
        ...shared,
        canvas: '#FAFAF8',
        raised: '#FFFFFF',
        inset: '#F4F4F2',
        hairline: '#E7E7E4',
        ink: '#0B0B0C',
        onInk: '#FFFFFF',
        plannerGrad: ['#FFF3EA', '#FFFAF6', '#FFFFFF'] as const,
        plannerBorder: '#F1E4D8',
        tile: '#FFFFFF',
      };
}

export type ServicesPalette = ReturnType<typeof servicesPalette>;

export function useServicesTheme() {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  return { t, s: servicesPalette(t) };
}

/** A status colour at ~8% for pill backgrounds. */
export const tint = (hex: string, alpha = 0.1) =>
  `${hex}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')}`;
