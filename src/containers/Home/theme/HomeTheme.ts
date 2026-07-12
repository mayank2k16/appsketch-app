/**
 * HomeTheme — thin re-export from the global AppTheme.
 * All home/drawer consumers import from here; only AppTheme changes
 * when token values need updating.
 */
import { appTheme, type AppColors } from '@/lib/theme';

// ─── Home screen tokens ───────────────────────────────────────────────────────
export const homeTheme = appTheme;

export type HomeScheme = keyof typeof appTheme;
export type HomeColors = AppColors;

// ─── Drawer tokens (maps drawer* keys into the shape drawer-menu expects) ─────
const buildDrawerTheme = (scheme: 'dark' | 'light') => {
  const t = appTheme[scheme];
  return {
    overlay:            t.drawerOverlay,
    panelBg:            t.drawerPanelBg,
    headerBg:           t.drawerPanelBg,
    scrollBg:           t.drawerScrollBg,
    rowBg:              t.drawerRowBg,
    rowBorder:          t.drawerRowBorder,
    iconWrapBg:         t.drawerIconWrap,
    labelColor:         t.drawerLabel,
    dimColor:           t.drawerDim,
    wordmarkColor:      t.drawerWordmark,
    shimmerMid:         t.drawerShimmer,
    accentLine:         t.drawerAccentLine,
    bottomBg:           t.drawerBottomBg,
    bottomText:         t.drawerBottomText,
    bottomBorder:       t.drawerBottomBorder,
    closeIconBg:        t.drawerCloseIconBg,
    closeIconBorder:    t.drawerCloseIconBorder,
    closeIconText:      t.drawerCloseIconText,
    shadow:             t.drawerShadow,
  } as const;
};

export const drawerTheme = {
  dark:  buildDrawerTheme('dark'),
  light: buildDrawerTheme('light'),
} as const;

export type DrawerScheme = 'dark' | 'light';
export type DrawerColors = ReturnType<typeof buildDrawerTheme>;
