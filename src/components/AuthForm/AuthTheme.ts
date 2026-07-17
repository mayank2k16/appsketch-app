/**
 * AuthTheme — thin re-export from the global AppTheme.
 * AuthForm, AuthSheet, and FormControls import loginTheme/sheetTheme
 * from here; only AppTheme.ts needs to change when values are updated.
 */
import { appTheme } from '@/lib/theme';

// ─── loginTheme (used by login.tsx + AuthForm.tsx) ────────────────────────────
const buildLoginTheme = (scheme: 'dark' | 'light') => {
  const t = appTheme[scheme];
  return {
    panel:           t.authPanelBg,
    montageBg:       t.authPanelBg,
    scrimTo:         t.authScrimTo,
    heading:         t.authHeading,
    sub:             t.authSub,
    footer:          t.authFooter,
    footerLink:      t.authFooterLink,
    primaryBg:       t.authPrimaryBg,
    primaryText:     t.authPrimaryText,
    secondaryBg:     t.authSecondaryBg,
    secondaryBorder: t.authSecBorder,
    secondaryText:   t.authSecText,
    secondaryIcon:   t.authSecIcon,
    guest:           t.authGuest,
    statusBar:       t.statusBar,
  } as const;
};

export const loginTheme = {
  dark:  buildLoginTheme('dark'),
  light: buildLoginTheme('light'),
} as const;

export type LoginTheme = typeof loginTheme.dark;

// ─── sheetTheme (used by AuthSheet.tsx + FormControls.tsx) ───────────────────
const buildSheetTheme = (scheme: 'dark' | 'light') => {
  const t = appTheme[scheme];
  return {
    overlay:      t.sheetOverlay,
    bg:           t.sheetBg,
    topBorder:    t.sheetTopBorder,
    handle:       t.sheetHandle,
    closeIcon:    t.sheetCloseIcon,
    brand:        t.sheetBrand,
    title:        t.sheetTitle,
    sub:          t.sheetSub,
    divider:      t.sheetDivider,
    label:        t.sheetLabel,
    inputBg:      t.sheetInputBg,
    inputBorder:  t.sheetInputBorder,
    inputText:    t.sheetInputText,
    placeholder:  t.sheetPlaceholder,
    selection:    t.sheetSelection,
    ctaBg:        t.sheetCtaBg,
    ctaText:      t.sheetCtaText,
    ghostBorder:  t.sheetGhostBorder,
    ghostText:    t.sheetGhostText,
    footer:       t.sheetFooter,
  } as const;
};

export const sheetTheme = {
  dark:  buildSheetTheme('dark'),
  light: buildSheetTheme('light'),
} as const;

export type SheetTheme = typeof sheetTheme.dark;

// ─── authColors (legacy; unused by any screen, kept for type safety) ──────────
export const authColors = {
  dark:  { RED: '#C41230', BLACK: '#0C0C0C', DARK: '#111111', MID: '#1A0005', GOLD: '#FFD166' },
  light: { RED: '#C41230', BLACK: '#0C0C0C', DARK: '#111111', MID: '#1A0005', GOLD: '#FFD166' },
} as const;
export type AuthColorScheme = keyof typeof authColors;
export type AuthColors = typeof authColors.dark;
