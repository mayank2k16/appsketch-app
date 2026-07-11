// Colour tokens for the auth flow (LoginScreen / AuthSheet), pulled out of
// the component file so a future light-mode design has one place to change
// values instead of hunting through inline hex codes. Light === dark for now
// (no visual change) — the auth screens don't yet re-render on scheme change,
// so wiring up live switching is a separate follow-up once light mode exists.
export const authColors = {
  dark: {
    RED:   '#C41230',
    BLACK: '#0C0C0C',
    DARK:  '#111111', // dark text on white
    MID:   '#1A0005', // dark panel background
    GOLD:  '#FFD166',
  },
  light: {
    RED:   '#C41230',
    BLACK: '#0C0C0C',
    DARK:  '#111111',
    MID:   '#1A0005',
    GOLD:  '#FFD166',
  },
} as const;

export type AuthColorScheme = keyof typeof authColors;
export type AuthColors = typeof authColors.dark;

// ─────────────────────────────────────────────────────────────
// Login landing (montage chooser) — full token set per scheme.
// Kept separate from `authColors` so the sheet/form primitives that
// destructure { RED, DARK } keep working untouched. Pick with
// nativewind's useColorScheme(): loginTheme[scheme].
// ─────────────────────────────────────────────────────────────
export const loginTheme = {
  dark: {
    panel:          '#0B0B0D', // bottom panel + montage backdrop
    montageBg:      '#0B0B0D',
    scrimTo:        '#0B0B0D', // gradient end colour (= panel)
    heading:        '#FFFFFF',
    sub:            'rgba(255,255,255,0.55)',
    footer:         'rgba(255,255,255,0.34)',
    footerLink:     'rgba(255,255,255,0.72)',
    primaryBg:      '#FFFFFF',
    primaryText:    '#111111',
    secondaryBg:    '#1B1B1F',
    secondaryBorder:'rgba(255,255,255,0.10)',
    secondaryText:  '#FFFFFF',
    secondaryIcon:  '#FFFFFF',
    guest:          'rgba(255,255,255,0.60)',
    statusBar:      'light-content' as const,
  },
  light: {
    panel:          '#FFFFFF',
    montageBg:      '#F1F1F4',
    scrimTo:        '#FFFFFF',
    heading:        '#111111',
    sub:            'rgba(17,17,17,0.50)',
    footer:         'rgba(17,17,17,0.34)',
    footerLink:     'rgba(17,17,17,0.60)',
    primaryBg:      '#111111',
    primaryText:    '#FFFFFF',
    secondaryBg:    '#F4F4F6',
    secondaryBorder:'rgba(17,17,17,0.10)',
    secondaryText:  '#111111',
    secondaryIcon:  '#111111',
    guest:          'rgba(17,17,17,0.55)',
    statusBar:      'dark-content' as const,
  },
} as const;

export type LoginTheme = typeof loginTheme.dark;

// ─────────────────────────────────────────────────────────────
// Auth bottom-sheet (AuthSheet + shared FormControls) — themed to
// match the login landing rather than the old Chinese-Corner red.
// Pick with useColorScheme(): sheetTheme[scheme].
// ─────────────────────────────────────────────────────────────
export const sheetTheme = {
  dark: {
    overlay:      'rgba(0,0,0,0.62)',
    bg:           '#151517',
    topBorder:    'rgba(255,255,255,0.10)',
    handle:       'rgba(255,255,255,0.22)',
    closeIcon:    'rgba(255,255,255,0.55)',
    brand:        'rgba(255,255,255,0.55)',
    title:        '#FFFFFF',
    sub:          'rgba(255,255,255,0.55)',
    divider:      'rgba(255,255,255,0.10)',
    label:        'rgba(255,255,255,0.50)',
    inputBg:      '#1F1F23',
    inputBorder:  'rgba(255,255,255,0.12)',
    inputText:    '#FFFFFF',
    placeholder:  'rgba(255,255,255,0.35)',
    selection:    '#FFFFFF',
    ctaBg:        '#FFFFFF',
    ctaText:      '#111111',
    ghostBorder:  'rgba(255,255,255,0.24)',
    ghostText:    'rgba(255,255,255,0.65)',
    footer:       'rgba(255,255,255,0.34)',
  },
  light: {
    overlay:      'rgba(0,0,0,0.45)',
    bg:           '#FFFFFF',
    topBorder:    'rgba(17,17,17,0.06)',
    handle:       'rgba(17,17,17,0.18)',
    closeIcon:    'rgba(17,17,17,0.40)',
    brand:        'rgba(17,17,17,0.50)',
    title:        '#111111',
    sub:          'rgba(17,17,17,0.50)',
    divider:      'rgba(17,17,17,0.10)',
    label:        'rgba(17,17,17,0.45)',
    inputBg:      '#F4F4F6',
    inputBorder:  'rgba(17,17,17,0.12)',
    inputText:    '#111111',
    placeholder:  'rgba(17,17,17,0.30)',
    selection:    '#111111',
    ctaBg:        '#111111',
    ctaText:      '#FFFFFF',
    ghostBorder:  'rgba(17,17,17,0.24)',
    ghostText:    'rgba(17,17,17,0.55)',
    footer:       'rgba(17,17,17,0.30)',
  },
} as const;

export type SheetTheme = typeof sheetTheme.dark;
