import { type AppColors, BRAND_RAMP } from '@/lib/theme';

/** Screen-local roles. White follows docs/white-theme.md — raised white
 *  cards on the warm canvas, one hairline, an inset price well, ink for
 *  ticks/toggle/secondary CTAs, and orange ONLY on the highlighted plan's
 *  Subscribe. Dark keeps the app's dark surfaces and accent. */
export function pricingPalette(t: AppColors) {
  const dark = t.statusBar === 'light-content';
  return dark
    ? {
        dark,
        eyebrow: t.accent,
        titleColors: ['#C084FC', '#F9A8D4', '#60A5FA'],
        cardBg: t.agentTabBg,
        cardBorder: t.agentTabBorder,
        popularBorder: t.accent,
        popularBadgeBg: t.accent,
        popularBadgeText: '#FFFFFF',
        priceBg: t.card,
        mark: t.accent,
        thumb: t.accent,
        thumbText: '#FFFFFF',
        track: t.agentTabBg,
        trackBorder: t.agentTabBorder,
        saveBg: `${t.accent}22`,
        saveText: t.accent,
        primaryBg: t.accent,
        secondaryBg: '#FFFFFF',
        secondaryText: '#0B0B0C',
        noticeBg: 'rgba(255,255,255,0.05)',
        error: '#E0392B',
        success: '#3DD68C',
      }
    : {
        dark,
        eyebrow: t.textSub,
        titleColors: [...BRAND_RAMP] as string[],
        cardBg: '#FFFFFF',
        cardBorder: '#E7E7E4',
        popularBorder: '#0B0B0C',
        popularBadgeBg: '#0B0B0C',
        popularBadgeText: '#FFFFFF',
        priceBg: '#F4F4F2',
        mark: '#0B0B0C',
        thumb: '#0B0B0C',
        thumbText: '#FFFFFF',
        track: '#F4F4F2',
        trackBorder: '#E7E7E4',
        saveBg: 'rgba(18,161,80,0.08)',
        saveText: '#12A150',
        primaryBg: '#F2600C',
        secondaryBg: '#0B0B0C',
        secondaryText: '#FFFFFF',
        noticeBg: '#F4F4F2',
        error: '#E5484D',
        success: '#12A150',
      };
}

export type PricingPalette = ReturnType<typeof pricingPalette>;
