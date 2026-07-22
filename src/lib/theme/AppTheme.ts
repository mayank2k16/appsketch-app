/**
 * AppTheme — single source of truth for every colour token in the app.
 *
 * Usage in any component:
 *   import { useColorScheme } from 'nativewind';
 *   import { appTheme } from '@/lib/theme';
 *   const { colorScheme } = useColorScheme();
 *   const t = appTheme[colorScheme === 'dark' ? 'dark' : 'light'];
 *
 * AuthTheme.ts and HomeTheme.ts re-export the relevant slices so existing
 * imports in auth/home components continue to work without changes.
 */

export const appTheme = {
  dark: {
    // ── Core ──────────────────────────────────────────────────────────────────
    bg:                  '#0A0A0C',        // near-black, matches video
    bgDeep:              '#050510',        // login / splash dark backdrop
    surface:             '#141414',
    card:                '#1C1C1C',
    text:                '#F6F7FA',
    textSub:             'rgba(255,255,255,0.55)',
    textMuted:           'rgba(255,255,255,0.30)',
    accent:              '#6C5CE7',        // electric indigo
    accentSoft:          'rgba(108,92,231,0.15)',
    border:              'rgba(255,255,255,0.09)',
    statusBar:           'light-content' as const,

    // ── Header ────────────────────────────────────────────────────────────────
    headerBg:            'rgba(10,10,12,0.96)',
    headerBorder:        'rgba(255,255,255,0.08)',

    // ── Hero dot background (twinkling grid) ──────────────────────────────────
    dotColor:            '#C9CDD6',        // cool-gray dot; opacity animated
    glowColor:           'rgba(108,92,231,0.14)',
    pulseRing:           'rgba(108,92,231,0.40)',
    tagBorder:           'rgba(108,92,231,0.55)',
    tagText:             '#6C5CE7',

    // ── Home CTAs (video: white primary + dark secondary) ─────────────────────
    heroCtaBg:           '#FFFFFF',
    heroCtaText:         '#0A0A0A',
    heroSecondaryBg:     '#141414',
    heroSecondaryText:   '#FFFFFF',
    heroSecondaryBorder: 'rgba(255,255,255,0.10)',
    heroGhostBorder:     'rgba(255,255,255,0.24)',
    heroGhostText:       '#FFFFFF',
    heroHeadingFade:     '#4A4B50',        // "apps." gradient end (white → this)

    // ── Auth landing panel (login.tsx / AuthForm.tsx) ─────────────────────────
    authPanelBg:         '#0B0B0D',
    authScrimTo:         '#0B0B0D',
    authHeading:         '#FFFFFF',
    authSub:             'rgba(255,255,255,0.55)',
    authFooter:          'rgba(255,255,255,0.34)',
    authFooterLink:      'rgba(255,255,255,0.72)',
    authPrimaryBg:       '#FFFFFF',
    authPrimaryText:     '#111111',
    authSecondaryBg:     '#1B1B1F',
    authSecBorder:       'rgba(255,255,255,0.10)',
    authSecText:         '#FFFFFF',
    authSecIcon:         '#FFFFFF',
    authGuest:           'rgba(255,255,255,0.60)',

    // ── Auth bottom sheet (AuthSheet.tsx / FormControls.tsx) ──────────────────
    sheetOverlay:        'rgba(0,0,0,0.62)',
    sheetBg:             '#151517',
    sheetTopBorder:      'rgba(255,255,255,0.10)',
    sheetHandle:         'rgba(255,255,255,0.22)',
    sheetCloseIcon:      'rgba(255,255,255,0.55)',
    sheetBrand:          'rgba(255,255,255,0.55)',
    sheetTitle:          '#FFFFFF',
    sheetSub:            'rgba(255,255,255,0.55)',
    sheetDivider:        'rgba(255,255,255,0.10)',
    sheetLabel:          'rgba(255,255,255,0.50)',
    sheetInputBg:        '#1F1F23',
    sheetInputBorder:    'rgba(255,255,255,0.12)',
    sheetInputText:      '#FFFFFF',
    sheetPlaceholder:    'rgba(255,255,255,0.35)',
    sheetSelection:      '#FFFFFF',
    sheetCtaBg:          '#FFFFFF',
    sheetCtaText:        '#111111',
    sheetGhostBorder:    'rgba(255,255,255,0.24)',
    sheetGhostText:      'rgba(255,255,255,0.65)',
    sheetFooter:         'rgba(255,255,255,0.34)',

    // ── Drawer ────────────────────────────────────────────────────────────────
    drawerOverlay:       'rgba(0,0,0,0.65)',
    drawerPanelBg:       '#0C0C0C',
    drawerScrollBg:      '#141414',
    drawerRowBg:         '#1C1C1C',
    drawerRowBorder:     'transparent',
    drawerIconWrap:      'rgba(108,92,231,0.14)',
    drawerLabel:         '#FFFFFF',
    drawerDim:           'rgba(255,255,255,0.45)',
    drawerWordmark:      '#FFFFFF',
    drawerShimmer:       'rgba(255,255,255,0.45)',
    drawerAccentLine:    '#6C5CE7',
    drawerBottomBg:      '#0C0C0C',
    drawerBottomText:    'rgba(255,255,255,0.28)',
    drawerBottomBorder:  'rgba(255,255,255,0.07)',
    drawerCloseIconBg:   'rgba(255,255,255,0.08)',
    drawerCloseIconBorder:'rgba(255,255,255,0.12)',
    drawerCloseIconText: 'rgba(255,255,255,0.45)',
    drawerShadow:        '#6C5CE7',

    // ── Bottom tab bar (GlowTabBar — transparent tab, colour-only active state) ─
    tabBarBg:            '#0A0A0C',                 // bar background behind the tabs
    tabLabelGradient:    ['#4C8BFF', '#6C5CE7', '#8B5CF6', '#A78BFA'],   // blue → indigo → violet aura — active icon + label
    tabIconInactive:     'rgba(255,255,255,0.50)',
    tabLabelInactive:    'rgba(255,255,255,0.45)',

    // ── Agent screen (CipherField + PromptBar) ────────────────────────────────
    // Backdrop fill uses the shared `bg` token (not a separate one) so the
    // Agent section sits seamlessly between Home's other sections (Hero,
    // Gallery) with zero colour seam when scrolled together.
    agentGlowOrange:     '#FF6A33',
    agentGlowBlue:        '#4C8BFF',
    agentInputBg:        'rgba(20,20,24,0.92)',
    agentInputBorder:    'rgba(255,255,255,0.10)',
    agentInputText:      '#FFFFFF',
    agentInputPlaceholder:'rgba(255,255,255,0.38)',
    agentBtnBg:          'rgba(255,255,255,0.07)',
    agentBtnBorder:      'rgba(255,255,255,0.12)',
    agentBtnIcon:        'rgba(255,255,255,0.75)',
    agentSendGradient:   ['#3B82F6', '#8B5CF6'],    // blue → purple, matches reference

    // App-type tabs (Web/Mobile/Game) above the prompt card
    agentTabBg:          'rgba(255,255,255,0.05)',
    agentTabBorder:      'rgba(255,255,255,0.10)',
    agentTabText:        'rgba(255,255,255,0.65)',
    agentTabIcon:        'rgba(255,255,255,0.65)',
    agentTabActiveBg:    '#6C5CE7',
    agentTabActiveText:  '#FFFFFF',

    // ── Marketplace — AI Templates screen ──────────────────────────────────────
    // Glass cards reuse `card`/`agentSendGradient` for tint + wash (same
    // BlurView-plus-tint-overlay recipe as AgentV2's prompt card) — only the
    // category-chip and tag-pill treatments need dedicated tokens.
    templatesChipBg:     'rgba(255,255,255,0.05)',
    templatesChipBorder: 'rgba(255,255,255,0.10)',
    templatesChipText:   'rgba(255,255,255,0.65)',
    templatesTagBg:      'rgba(108,92,231,0.22)',
    templatesTagText:    '#B4A9F5',
    templatesSkeletonBase:      'rgba(255,255,255,0.08)',
    templatesSkeletonHighlight: 'rgba(255,255,255,0.16)',

    // ── Code editor (AI coder — chat/code/preview tabs) ───────────────────────
    codeEditorTabBarBg:      '#0A0A0C',
    codeEditorTabBg:         'rgba(255,255,255,0.05)',
    codeEditorTabBorder:     'rgba(255,255,255,0.10)',
    codeEditorTabText:       'rgba(255,255,255,0.55)',
    codeEditorTabActiveText: '#FFFFFF',
    codeEditorTabIndicator:  '#6C5CE7',
    codeEditorSurface:       '#141414',
    codeEditorBg:            '#101012',
    codeEditorBorder:        'rgba(255,255,255,0.09)',
    codeEditorGutterBg:      '#0D0D0F',
    codeEditorLineNumber:    'rgba(255,255,255,0.28)',
    codeEditorText:          '#F6F7FA',
    codeEditorTextMuted:     'rgba(255,255,255,0.45)',
    codeEditorChatUserBg:       '#6C5CE7',
    codeEditorChatUserText:     '#FFFFFF',
    codeEditorChatAssistantBg:  '#1C1C1C',
    codeEditorChatAssistantText:'#F6F7FA',
    codeEditorActivityBg:       'rgba(255,255,255,0.04)',
    codeEditorActivityBorder:   'rgba(255,255,255,0.08)',
    codeEditorActivityText:     'rgba(255,255,255,0.60)',
    codeEditorConnectedDot:     '#3DDC84',
    codeEditorDisconnectedDot:  'rgba(255,255,255,0.30)',
    codeEditorDanger:           '#FF5C5C',

    // Terminal — line-type colouring mirrors Vite's `lineClass` classifier
    terminalBg:        '#0A0A0C',
    terminalText:      'rgba(255,255,255,0.82)',
    terminalCmd:        '#8AB4FF',
    terminalOk:         '#3DDC84',
    terminalErr:        '#FF6B6B',
    terminalWarn:       '#FFC24B',
    terminalInfo:       'rgba(255,255,255,0.50)',
    terminalInputBg:    'rgba(255,255,255,0.06)',
    terminalInputBorder:'rgba(255,255,255,0.12)',

    // Collections / CMS
    collectionsChipBg:      'rgba(255,255,255,0.05)',
    collectionsChipActiveBg:'#6C5CE7',
    collectionsBadgeBg:     'rgba(108,92,231,0.20)',
    collectionsBadgeText:   '#B4A9F5',
    collectionsMethodGet:   '#3DDC84',
    collectionsMethodPost:  '#4C8BFF',
    collectionsMethodOther: '#FFC24B',

    // Changes / git diff
    diffAddedBg:   'rgba(61,220,132,0.14)',
    diffAddedText: '#3DDC84',
    diffRemovedBg: 'rgba(255,92,92,0.14)',
    diffRemovedText:'#FF5C5C',
    diffMeta:      'rgba(255,255,255,0.40)',
  },

  light: {
    // ── Core ──────────────────────────────────────────────────────────────────
    bg:                  '#F7F7F9',
    bgDeep:              '#FFFFFF',
    surface:             '#FFFFFF',
    card:                '#FFFFFF',
    text:                '#111111',
    textSub:             'rgba(17,17,17,0.55)',
    textMuted:           'rgba(17,17,17,0.35)',
    accent:              '#6C5CE7',
    accentSoft:          'rgba(108,92,231,0.10)',
    border:              'rgba(17,17,17,0.09)',
    statusBar:           'dark-content' as const,

    // ── Header ────────────────────────────────────────────────────────────────
    headerBg:            'rgba(247,247,249,0.96)',
    headerBorder:        'rgba(17,17,17,0.09)',

    // ── Hero dot background (twinkling grid) ──────────────────────────────────
    dotColor:            '#11121A',        // dark dot; opacity animated
    glowColor:           'rgba(108,92,231,0.10)',
    pulseRing:           'rgba(108,92,231,0.30)',
    tagBorder:           'rgba(108,92,231,0.40)',
    tagText:             '#6C5CE7',

    // ── Home CTAs (video look, inverted for light bg) ─────────────────────────
    heroCtaBg:           '#0A0A0A',
    heroCtaText:         '#FFFFFF',
    heroSecondaryBg:     '#FFFFFF',
    heroSecondaryText:   '#111111',
    heroSecondaryBorder: 'rgba(17,17,17,0.12)',
    heroGhostBorder:     'rgba(17,17,17,0.22)',
    heroGhostText:       '#111111',
    heroHeadingFade:     '#B8BAC0',        // "apps." gradient end

    // ── Auth landing panel ────────────────────────────────────────────────────
    authPanelBg:         '#FFFFFF',
    authScrimTo:         '#FFFFFF',
    authHeading:         '#111111',
    authSub:             'rgba(17,17,17,0.50)',
    authFooter:          'rgba(17,17,17,0.34)',
    authFooterLink:      'rgba(17,17,17,0.60)',
    authPrimaryBg:       '#111111',
    authPrimaryText:     '#FFFFFF',
    authSecondaryBg:     '#F4F4F6',
    authSecBorder:       'rgba(17,17,17,0.10)',
    authSecText:         '#111111',
    authSecIcon:         '#111111',
    authGuest:           'rgba(17,17,17,0.55)',

    // ── Auth bottom sheet ──────────────────────────────────────────────────────
    sheetOverlay:        'rgba(0,0,0,0.45)',
    sheetBg:             '#FFFFFF',
    sheetTopBorder:      'rgba(17,17,17,0.06)',
    sheetHandle:         'rgba(17,17,17,0.18)',
    sheetCloseIcon:      'rgba(17,17,17,0.40)',
    sheetBrand:          'rgba(17,17,17,0.50)',
    sheetTitle:          '#111111',
    sheetSub:            'rgba(17,17,17,0.50)',
    sheetDivider:        'rgba(17,17,17,0.10)',
    sheetLabel:          'rgba(17,17,17,0.45)',
    sheetInputBg:        '#F4F4F6',
    sheetInputBorder:    'rgba(17,17,17,0.12)',
    sheetInputText:      '#111111',
    sheetPlaceholder:    'rgba(17,17,17,0.30)',
    sheetSelection:      '#111111',
    sheetCtaBg:          '#111111',
    sheetCtaText:        '#FFFFFF',
    sheetGhostBorder:    'rgba(17,17,17,0.24)',
    sheetGhostText:      'rgba(17,17,17,0.55)',
    sheetFooter:         'rgba(17,17,17,0.30)',

    // ── Drawer ────────────────────────────────────────────────────────────────
    drawerOverlay:       'rgba(0,0,0,0.45)',
    drawerPanelBg:       '#FFFFFF',
    drawerScrollBg:      '#F4F4F6',
    drawerRowBg:         '#FFFFFF',
    drawerRowBorder:     'rgba(17,17,17,0.07)',
    drawerIconWrap:      'rgba(108,92,231,0.09)',
    drawerLabel:         '#111111',
    drawerDim:           'rgba(17,17,17,0.45)',
    drawerWordmark:      '#111111',
    drawerShimmer:       'rgba(17,17,17,0.12)',
    drawerAccentLine:    '#6C5CE7',
    drawerBottomBg:      '#FFFFFF',
    drawerBottomText:    'rgba(17,17,17,0.30)',
    drawerBottomBorder:  'rgba(17,17,17,0.09)',
    drawerCloseIconBg:   'rgba(17,17,17,0.06)',
    drawerCloseIconBorder:'rgba(17,17,17,0.10)',
    drawerCloseIconText: 'rgba(17,17,17,0.45)',
    drawerShadow:        'rgba(0,0,0,0.12)',

    // ── Bottom tab bar (GlowTabBar — transparent tab, colour-only active state) ─
    tabBarBg:            '#F7F7F9',
    tabLabelGradient:    ['#4C8BFF', '#6C5CE7', '#8B5CF6', '#A78BFA'],
    tabIconInactive:     'rgba(17,17,17,0.42)',
    tabLabelInactive:    'rgba(17,17,17,0.45)',

    // ── Agent screen (CipherField + PromptBar) ────────────────────────────────
    agentGlowOrange:     '#FF6A33',
    agentGlowBlue:        '#4C8BFF',
    agentInputBg:        '#FFFFFF',
    agentInputBorder:    'rgba(17,17,17,0.10)',
    agentInputText:      '#111111',
    agentInputPlaceholder:'rgba(17,17,17,0.38)',
    agentBtnBg:          'rgba(17,17,17,0.05)',
    agentBtnBorder:      'rgba(17,17,17,0.10)',
    agentBtnIcon:        'rgba(17,17,17,0.62)',
    agentSendGradient:   ['#3B82F6', '#8B5CF6'],

    // App-type tabs (Web/Mobile/Game) above the prompt card
    agentTabBg:          'rgba(17,17,17,0.04)',
    agentTabBorder:      'rgba(17,17,17,0.09)',
    agentTabText:        'rgba(17,17,17,0.60)',
    agentTabIcon:        'rgba(17,17,17,0.60)',
    agentTabActiveBg:    '#6C5CE7',
    agentTabActiveText:  '#FFFFFF',

    // ── Marketplace — AI Templates screen ──────────────────────────────────────
    templatesChipBg:     'rgba(17,17,17,0.04)',
    templatesChipBorder: 'rgba(17,17,17,0.09)',
    templatesChipText:   'rgba(17,17,17,0.60)',
    templatesTagBg:      'rgba(108,92,231,0.12)',
    templatesTagText:    '#6C5CE7',
    templatesSkeletonBase:      'rgba(17,17,17,0.06)',
    templatesSkeletonHighlight: 'rgba(17,17,17,0.11)',

    // ── Code editor (AI coder — chat/code/preview tabs) ───────────────────────
    codeEditorTabBarBg:      '#F7F7F9',
    codeEditorTabBg:         'rgba(17,17,17,0.04)',
    codeEditorTabBorder:     'rgba(17,17,17,0.09)',
    codeEditorTabText:       'rgba(17,17,17,0.55)',
    codeEditorTabActiveText: '#111111',
    codeEditorTabIndicator:  '#6C5CE7',
    codeEditorSurface:       '#FFFFFF',
    codeEditorBg:            '#FBFBFC',
    codeEditorBorder:        'rgba(17,17,17,0.09)',
    codeEditorGutterBg:      '#F1F1F3',
    codeEditorLineNumber:    'rgba(17,17,17,0.32)',
    codeEditorText:          '#111111',
    codeEditorTextMuted:     'rgba(17,17,17,0.45)',
    codeEditorChatUserBg:       '#6C5CE7',
    codeEditorChatUserText:     '#FFFFFF',
    codeEditorChatAssistantBg:  '#FFFFFF',
    codeEditorChatAssistantText:'#111111',
    codeEditorActivityBg:       'rgba(17,17,17,0.03)',
    codeEditorActivityBorder:   'rgba(17,17,17,0.08)',
    codeEditorActivityText:     'rgba(17,17,17,0.60)',
    codeEditorConnectedDot:     '#1FA971',
    codeEditorDisconnectedDot:  'rgba(17,17,17,0.25)',
    codeEditorDanger:           '#E0392B',

    // Terminal — light mode keeps a dark shell surface (real terminal
    // convention) even though the rest of the app is light, same as most
    // code editors' console panes.
    terminalBg:        '#16161A',
    terminalText:      'rgba(255,255,255,0.85)',
    terminalCmd:        '#6C9BFF',
    terminalOk:         '#1FA971',
    terminalErr:        '#E0392B',
    terminalWarn:       '#C9860A',
    terminalInfo:       'rgba(255,255,255,0.50)',
    terminalInputBg:    'rgba(255,255,255,0.08)',
    terminalInputBorder:'rgba(255,255,255,0.14)',

    // Collections / CMS
    collectionsChipBg:      'rgba(17,17,17,0.04)',
    collectionsChipActiveBg:'#6C5CE7',
    collectionsBadgeBg:     'rgba(108,92,231,0.12)',
    collectionsBadgeText:   '#6C5CE7',
    collectionsMethodGet:   '#1FA971',
    collectionsMethodPost:  '#3B82F6',
    collectionsMethodOther: '#C9860A',

    // Changes / git diff
    diffAddedBg:   'rgba(31,169,113,0.10)',
    diffAddedText: '#1FA971',
    diffRemovedBg: 'rgba(224,57,43,0.10)',
    diffRemovedText:'#E0392B',
    diffMeta:      'rgba(17,17,17,0.35)',
  },
} as const;

export type AppScheme = keyof typeof appTheme;
export type AppColors = typeof appTheme.dark | typeof appTheme.light;

/** One-liner hook helper — import & call at the top of any component. */
export function useAppTheme(colorScheme: string | null | undefined): AppColors {
  // dark/light share a shape but hold different literal values, so the indexed
  // access is a union — narrow it back to the common AppColors type.
  return appTheme[colorScheme === 'dark' ? 'dark' : 'light'] as AppColors;
}
