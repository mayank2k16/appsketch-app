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

/**
 * The brand ramp — orange → magenta → violet, read left-to-right.
 *
 * The app's one chromatic identity. It started life inside HomeTheme, but the
 * bottom tab bar is a single component shared by all four tabs and the login
 * screen sits outside Home entirely, so a Home-local constant meant those
 * surfaces either drifted (the tab bar's own blue→indigo aura) or went flat
 * white. It lives here, at the base palette, because everything that carries
 * brand colour anywhere in the app has to read the same stops.
 *
 * Direction is part of the definition: warm first, cool last. Elements that
 * sit near each other — the hero heading over the prompt card's edge, the tab
 * bar under both — visibly disagree if one of them runs the ramp backwards.
 */
export const BRAND_RAMP = ['#F97316', '#EC4899', '#8B5CF6'] as const;

/** The ramp as a mutable triple, for `expo-linear-gradient`'s prop type. */
export const brandGradient = (): [string, string, string] => [...BRAND_RAMP];

export const appTheme = {
  dark: {
    // ── Core ──────────────────────────────────────────────────────────────────
    bg: '#0A0A0C', // near-black, matches video
    bgDeep: '#050510', // login / splash dark backdrop
    surface: '#141414',
    card: '#1C1C1C',
    text: '#F6F7FA',
    textSub: 'rgba(255,255,255,0.55)',
    textMuted: 'rgba(255,255,255,0.30)',
    accent: BRAND_RAMP[1], // brand magenta, the ramp's midpoint
    accentSoft: 'rgba(236,72,153,0.15)',
    /** What sits ON an `accent` fill — button labels, icons, spinners.
     * These call sites used to hardcode '#FFFFFF', which silently assumed the
     * accent would always be dark enough to carry white. It isn't: the
     * achromatic scope (see CoderTheme) sets a near-WHITE accent, and white on
     * near-white is an invisible button. Read this instead of typing a literal. */
    accentOn: '#FFFFFF',
    border: 'rgba(255,255,255,0.09)',
    statusBar: 'light-content' as const,

    // ── Global toast (bottom, swipe-to-dismiss — ToastContainer) ──────────────
    toastBg: '#141414',
    toastBorder: 'rgba(255,255,255,0.09)',
    toastText: '#F6F7FA',
    toastTextSub: 'rgba(255,255,255,0.55)',
    toastSuccess: '#3DDC84',
    toastError: '#FF5C5C',
    toastWarning: '#FFC24B',
    toastInfo: BRAND_RAMP[1],

    // ── Header ────────────────────────────────────────────────────────────────
    headerBg: 'rgba(10,10,12,0.96)',
    headerBorder: 'rgba(255,255,255,0.08)',

    // ── Hero dot background (twinkling grid) ──────────────────────────────────
    dotColor: '#36454f', // opacity animated
    glowColor: 'rgba(236,72,153,0.14)',
    pulseRing: 'rgba(236,72,153,0.40)',
    tagBorder: 'rgba(236,72,153,0.55)',
    tagText: BRAND_RAMP[1],

    // ── Home CTAs (video: white primary + dark secondary) ─────────────────────
    heroCtaBg: '#FFFFFF',
    heroCtaText: '#0A0A0A',
    heroSecondaryBg: '#141414',
    heroSecondaryText: '#FFFFFF',
    heroSecondaryBorder: 'rgba(255,255,255,0.10)',
    heroGhostBorder: 'rgba(255,255,255,0.24)',
    heroGhostText: '#FFFFFF',
    heroHeadingFade: '#4A4B50', // "apps." gradient end (white → this)

    // ── Gallery overlay ───────────────────────────────────────────────────────
    // Scrim behind the gallery's heading/CTA block ONLY — it fades to fully
    // transparent toward the top and bottom edges so the image masonry stays
    // undimmed and only the text band is darkened (no hard edge between them).
    // `galleryOverlay` is the solid mid-value, kept for any flat use.
    galleryOverlay: 'rgba(3,3,8,0.88)',
    galleryOverlayGradient: [
      'rgba(3,3,8,0)',
      'rgba(3,3,8,0.55)',
      'rgba(3,3,8,0.92)',
      'rgba(3,3,8,0.92)',
      'rgba(3,3,8,0.55)',
      'rgba(3,3,8,0)',
    ] as string[],
    galleryOverlayText: '#FFFFFF',
    galleryOverlayTextSub: 'rgba(255,255,255,0.72)',

    // ── Auth landing panel (login.tsx / AuthForm.tsx) ─────────────────────────
    authPanelBg: '#0B0B0D',
    authScrimTo: '#0B0B0D',
    authHeading: '#FFFFFF',
    authSub: 'rgba(255,255,255,0.55)',
    authFooter: 'rgba(255,255,255,0.34)',
    authFooterLink: 'rgba(255,255,255,0.72)',
    authPrimaryBg: '#FFFFFF',
    authPrimaryText: '#111111',
    authSecondaryBg: '#1B1B1F',
    authSecBorder: 'rgba(255,255,255,0.10)',
    authSecText: '#FFFFFF',
    authSecIcon: '#FFFFFF',
    authGuest: 'rgba(255,255,255,0.60)',

    // ── Auth bottom sheet (AuthSheet.tsx / FormControls.tsx) ──────────────────
    sheetOverlay: 'rgba(0,0,0,0.62)',
    sheetBg: '#151517',
    sheetTopBorder: 'rgba(255,255,255,0.10)',
    sheetHandle: 'rgba(255,255,255,0.22)',
    sheetCloseIcon: 'rgba(255,255,255,0.55)',
    sheetBrand: 'rgba(255,255,255,0.55)',
    sheetTitle: '#FFFFFF',
    sheetSub: 'rgba(255,255,255,0.55)',
    sheetDivider: 'rgba(255,255,255,0.10)',
    sheetLabel: 'rgba(255,255,255,0.50)',
    sheetInputBg: '#1F1F23',
    sheetInputBorder: 'rgba(255,255,255,0.12)',
    sheetInputText: '#FFFFFF',
    sheetPlaceholder: 'rgba(255,255,255,0.35)',
    sheetSelection: '#FFFFFF',
    sheetCtaBg: '#FFFFFF',
    sheetCtaText: '#111111',
    sheetGhostBorder: 'rgba(255,255,255,0.24)',
    sheetGhostText: 'rgba(255,255,255,0.65)',
    sheetFooter: 'rgba(255,255,255,0.34)',

    // ── Drawer ────────────────────────────────────────────────────────────────
    drawerOverlay: 'rgba(0,0,0,0.65)',
    drawerPanelBg: '#0C0C0C',
    drawerScrollBg: '#141414',
    drawerRowBg: '#1C1C1C',
    drawerRowBorder: 'transparent',
    // Lifted from 0.14: with a vivid glyph on it the badge has to read as a
    // container behind that glyph, not as a smudge the glyph sits near.
    drawerIconWrap: 'rgba(236,72,153,0.20)',
    drawerLabel: '#FFFFFF',
    drawerDim: 'rgba(255,255,255,0.45)',
    drawerWordmark: '#FFFFFF',
    drawerShimmer: 'rgba(255,255,255,0.45)',
    drawerAccentLine: BRAND_RAMP[1],
    drawerBottomBg: '#0C0C0C',
    drawerBottomText: 'rgba(255,255,255,0.28)',
    drawerBottomBorder: 'rgba(255,255,255,0.07)',
    drawerCloseIconBg: 'rgba(255,255,255,0.08)',
    drawerCloseIconBorder: 'rgba(255,255,255,0.12)',
    drawerCloseIconText: 'rgba(255,255,255,0.45)',
    drawerShadow: BRAND_RAMP[1],

    // ── Bottom tab bar (GlowTabBar — transparent tab, colour-only active state) ─
    tabBarBg: '#0A0A0C', // bar background behind the tabs
    // The active tab's icon + label aura. Four stops spanning the brand ramp
    // (BRAND_RAMP's three, plus a light violet tail so the label doesn't end
    // on the same value it passes through). Was a blue→indigo→violet run,
    // which was the last blue left in the chrome once Home went brand-orange
    // — the bar sits directly under every screen, so it read as belonging to
    // a different app.
    tabLabelGradient: ['#F97316', '#EC4899', '#8B5CF6', '#A78BFA'],
    tabIconInactive: 'rgba(255,255,255,0.50)',
    tabLabelInactive: 'rgba(255,255,255,0.45)',
    /** The ACTIVE tab's label. White, not the ramp: the icon above it already
     *  carries the gradient, and at 11px the ramp's stops sit close enough
     *  together that gradient type just reads as a muddier word than its
     *  neighbours. Contrast against `tabLabelInactive` is what marks the tab,
     *  colour is the icon's job. */
    tabLabelActive: '#FFFFFF',

    // ── Agent screen (CipherField + PromptBar) ────────────────────────────────
    // Backdrop fill uses the shared `bg` token (not a separate one) so the
    // Agent section sits seamlessly between Home's other sections (Hero,
    // Gallery) with zero colour seam when scrolled together.
    // The two glows are the ramp's two ENDS, warm and cool — which is what the
    // token names have always described, just in the pre-ramp palette's hues.
    // (`agentGlowBlue` briefly took the ramp's orange, which collapsed both
    // glows onto one colour and lost the field's depth entirely.)
    agentGlowOrange: BRAND_RAMP[0],
    agentGlowBlue: BRAND_RAMP[2],
    agentInputBg: 'rgba(20,20,24,0.92)',
    agentInputBorder: 'rgba(255,255,255,0.10)',
    agentInputText: '#FFFFFF',
    agentInputPlaceholder: 'rgba(255,255,255,0.38)',
    agentBtnBg: 'rgba(255,255,255,0.07)',
    agentBtnBorder: 'rgba(255,255,255,0.12)',
    agentBtnIcon: 'rgba(255,255,255,0.75)',
    agentSendGradient: [BRAND_RAMP[0], BRAND_RAMP[2]], // ramp ends: warm → cool

    // Prompt card border ring (rotating LinearGradient, see AgentV2) + the
    // glass tint behind its BlurView. Tint deliberately matches `bg` at
    // near-opaque alpha — the ring gradient sits behind the whole card body
    // (unavoidable given the masking technique), so the tint has to be
    // opaque enough to fully hide it there; only the unmasked ring shows it.
    agentBorderGradient: ['#8B5CF6', '#EC4899', '#F97316'], // violet → magenta → orange
    agentCardGlassTint: 'rgba(10,10,12,0.94)', // ≈ bg, near-opaque

    // App-type tabs (Web/Mobile/Game) above the prompt card
    agentTabBg: 'rgba(255,255,255,0.05)',
    agentTabBorder: 'rgba(255,255,255,0.10)',
    agentTabText: 'rgba(255,255,255,0.65)',
    agentTabIcon: 'rgba(255,255,255,0.65)',
    agentTabActiveBg: BRAND_RAMP[1],
    agentTabActiveText: '#FFFFFF',

    // ── Marketplace — AI Templates screen ──────────────────────────────────────
    // Glass cards reuse `card`/`agentSendGradient` for tint + wash (same
    // BlurView-plus-tint-overlay recipe as AgentV2's prompt card) — only the
    // category-chip and tag-pill treatments need dedicated tokens.
    templatesChipBg: 'rgba(255,255,255,0.05)',
    templatesChipBorder: 'rgba(255,255,255,0.10)',
    templatesChipText: 'rgba(255,255,255,0.65)',
    templatesTagBg: 'rgba(236,72,153,0.22)',
    templatesTagText: '#B4A9F5',
    templatesSkeletonBase: 'rgba(255,255,255,0.08)',
    templatesSkeletonHighlight: 'rgba(255,255,255,0.16)',

    // ── Studio — store cards + section rail ───────────────────────────────────
    // Store cards are a top-lit dark gradient (lighter at the top edge, sinking
    // to near-black) with a hairline that's brighter at the top than the body,
    // so the card reads as a lit surface rather than a flat fill.
    studioCardGradient: ['#232329', '#18181C', '#101013'],
    studioCardBorder: 'rgba(255,255,255,0.10)',
    studioCardTopEdge: 'rgba(255,255,255,0.16)',
    studioCardLogoBg: 'rgba(255,255,255,0.06)',
    studioRailBg: 'rgba(255,255,255,0.04)',
    studioRailActiveBg: 'rgba(236,72,153,0.18)',

    // ── Code editor (AI coder — chat/code/preview tabs) ───────────────────────
    // ACHROMATIC, and deliberately the same three depths as the web workspace
    // (CoderWorkspace.scss: --ui-bg / --ui-surface / --ui-ctl). The indigo this
    // section carried — violet bubbles, a violet glass tint, violet chips —
    // read as a different product next to the web build, and a coloured chat
    // is a coloured chat however tasteful the hue. Colour appears only where it
    // MEANS something now: success green, error red, the token counts.
    codeEditorTabBarBg: '#020202', // --ui-bg: a column's canvas
    codeEditorTabBg: '#1E1E1E', // --ui-ctl: a control or nested surface
    codeEditorTabBorder: '#252525', // --ui-line: the only hairline
    codeEditorTabText: '#8F8F8F', // --ui-dim
    codeEditorTabActiveText: '#EAEAEA', // --ui-txt
    codeEditorTabIndicator: '#EAEAEA',
    codeEditorSurface: '#0D0D0D', // --ui-surface: a message, card, composer
    codeEditorBg: '#020202',
    codeEditorBorder: '#252525',
    codeEditorGutterBg: '#0D0D0D',
    codeEditorLineNumber: 'rgba(255,255,255,0.28)',
    codeEditorText: '#EAEAEA',
    codeEditorTextMuted: '#8F8F8F',
    // Both bubbles are the SAME surface on the web — a user message is not a
    // different kind of object, it is the same card on the other side.
    codeEditorChatUserBg: '#0D0D0D',
    codeEditorChatUserText: '#EAEAEA',
    codeEditorChatAssistantBg: '#0D0D0D',
    codeEditorChatAssistantText: '#EAEAEA',
    codeEditorActivityBg: 'rgba(255,255,255,0.04)',
    codeEditorActivityBorder: '#252525',
    codeEditorActivityText: '#8F8F8F',
    codeEditorConnectedDot: '#3DDC84',
    codeEditorDisconnectedDot: 'rgba(255,255,255,0.30)',
    codeEditorDanger: '#FF5C5C',
    /** Focus rings, and the ONE solid fill the coder surface allows: a primary
     * action (send / submit / approve). The web's `--ui-accent`, which is
     * `#d4d4d4` — it was `$blue` there once and this port kept the blue for a
     * while after the web dropped it. Grey is now the correct answer. */
    codeEditorFocus: '#D4D4D4',
    /** A SELECTED thing — chip, pill, badge. The web never fills a selection
     * solid; it washes it and colours the label `--ui-accent-soft` (#eaeaea). */
    codeEditorAccentWash: 'rgba(234,234,234,0.14)',
    codeEditorAccentText: '#EAEAEA',

    // Chat glass surfaces (bubbles / composer) — BlurView + tint overlay. The
    // tint is a neutral of --ui-surface now, not the violet-cast
    // 'rgba(32,26,46,…)' that gave every bubble a purple wash.
    codeEditorGlassOverlay: 'rgba(13,13,13,0.72)',
    codeEditorGlassBorder: '#252525',
    codeEditorGlassBorderTop: 'rgba(255,255,255,0.14)',
    // Kept as a PAIR because several screens render a two-stop gradient, but
    // both stops are the surface — the gradient renders as a flat card.
    codeEditorUserBubbleFrom: '#0D0D0D',
    codeEditorUserBubbleTo: '#0D0D0D',

    // Activity step timeline
    codeEditorTimelineLine: '#252525',
    codeEditorTimelineDone: '#3DDC84',
    codeEditorTimelineActive: '#EAEAEA',
    codeEditorToolChipBg: '#1E1E1E',
    codeEditorToolChipBorder: '#252525',
    codeEditorToolChipText: '#8F8F8F',
    codeEditorToolChipActiveBg: '#262626', // --ui-ctl-h: raised, not tinted
    codeEditorToolChipActiveBorder: '#333333',
    codeEditorToolChipActiveText: '#EAEAEA',
    // The band that sweeps across the live activity row. PURE WHITE, not the
    // brand violet it used to be: a coloured sweep over grey text reads as a
    // colour change, and on a row that already carries a violet accent bar and
    // a violet tool chip it read as more of the same. White reads as *light*
    // moving across the text — which is what a shine is.
    codeEditorShimmerHighlight: '#FFFFFF',

    // Token meter + plan/todos/review activity rows
    codeEditorTokenIn: '#8FB2E8',
    codeEditorTokenOut: '#7DD3A8',
    codeEditorTokenCachedBg: 'rgba(217,184,92,0.10)',
    codeEditorTokenCachedText: '#D9B85C',
    codeEditorTodosBadgeBg: '#1E1E1E',
    codeEditorTodosBadgeText: '#EAEAEA',
    codeEditorReviewOkBg: 'rgba(61,220,132,0.16)',
    codeEditorReviewOkText: '#8CF0B4',
    codeEditorReviewWarnBg: 'rgba(252,211,77,0.16)',
    codeEditorReviewWarnText: '#FCD34D',
    codeEditorAmber: '#FCD34D',

    // Terminal — line-type colouring mirrors Vite's `lineClass` classifier
    terminalBg: '#020202',
    terminalText: 'rgba(255,255,255,0.82)',
    terminalCmd: '#8AB4FF',
    terminalOk: '#3DDC84',
    terminalErr: '#FF6B6B',
    terminalWarn: '#FFC24B',
    terminalInfo: 'rgba(255,255,255,0.50)',
    terminalInputBg: '#1E1E1E',
    terminalInputBorder: '#252525',

    // Collections / CMS — a selected chip RAISES (--ui-ctl-h) rather than
    // taking the brand fill, same as the web's Code/Collections/History pill.
    collectionsChipBg: '#1E1E1E',
    collectionsChipActiveBg: '#262626',
    collectionsBadgeBg: '#1E1E1E',
    collectionsBadgeText: '#EAEAEA',
    collectionsMethodGet: '#3DDC84',
    collectionsMethodPost: '#4C8BFF',
    collectionsMethodOther: '#FFC24B',

    // Changes / git diff
    diffAddedBg: 'rgba(61,220,132,0.14)',
    diffAddedText: '#3DDC84',
    diffRemovedBg: 'rgba(255,92,92,0.14)',
    diffRemovedText: '#FF5C5C',
    diffMeta: 'rgba(255,255,255,0.40)',
  },

  /**
   * PREMIUM WHITE — the default theme (dark is a setting).
   *
   * Rules every light token follows (see docs/white-theme.md):
   *  - No shadows and no glows. Depth comes from three flat surfaces —
   *    CANVAS (warm paper) → RAISED (pure white) → INSET (a grey well) — and
   *    one hairline.
   *  - Ink, not grey, for primary actions: a near-black pill with white text.
   *    Orange (the web's /templates white action colour) marks the ONE
   *    highlighted action on a screen; the brand ramp is kept for the logo,
   *    hero type and the active tab icon.
   *  - Text is three steps of the same ink, never a tinted grey.
   */
  light: {
    // ── Core ──────────────────────────────────────────────────────────────────
    bg: '#FAFAF8', // CANVAS: warm paper
    bgDeep: '#FFFFFF',
    surface: '#FFFFFF', // RAISED
    card: '#FFFFFF',
    text: '#0B0B0C', // ink
    textSub: '#5C5D63',
    textMuted: '#9C9DA3',
    accent: '#F2600C', // the one highlighted action
    accentSoft: 'rgba(242,96,12,0.08)',
    accentOn: '#FFFFFF',
    border: '#E7E7E4', // the one hairline
    statusBar: 'dark-content' as const,

    // ── Global toast ──────────────────────────────────────────────────────────
    toastBg: '#0B0B0C', // ink toast on paper: reads instantly, no shadow needed
    toastBorder: '#0B0B0C',
    toastText: '#FFFFFF',
    toastTextSub: 'rgba(255,255,255,0.64)',
    toastSuccess: '#12A150',
    toastError: '#E5484D',
    toastWarning: '#D97706',
    toastInfo: '#F2600C',

    // ── Header ────────────────────────────────────────────────────────────────
    headerBg: '#FAFAF8', // white: solid, no translucent veil
    headerBorder: '#EDEDEA',

    // ── Hero dot background ───────────────────────────────────────────────────
    dotColor: '#D4D4CF',
    glowColor: 'rgba(242,96,12,0)', // no glows in white
    pulseRing: 'rgba(11,11,12,0.14)',
    tagBorder: '#E7E7E4',
    tagText: '#0B0B0C',

    // ── Home CTAs ─────────────────────────────────────────────────────────────
    heroCtaBg: '#0B0B0C',
    heroCtaText: '#FFFFFF',
    heroSecondaryBg: '#FFFFFF',
    heroSecondaryText: '#0B0B0C',
    heroSecondaryBorder: '#E7E7E4',
    heroGhostBorder: '#D9D9D5',
    heroGhostText: '#0B0B0C',
    heroHeadingFade: '#0B0B0C', // white: no fades on text,

    // ── Gallery overlay — white has no scrims or fades; the band is solid
    // paper (Gallery renders `galleryOverlay` as a hard-edged strip and never
    // uses the gradient below in white).
    galleryOverlay: '#FAFAF8',
    galleryOverlayGradient: [
      'rgba(250,250,248,0)',
      'rgba(250,250,248,0.7)',
      'rgba(250,250,248,0.96)',
      'rgba(250,250,248,0.96)',
      'rgba(250,250,248,0.7)',
      'rgba(250,250,248,0)',
    ] as string[],
    galleryOverlayText: '#0B0B0C',
    galleryOverlayTextSub: '#5C5D63',

    // ── Auth landing panel ────────────────────────────────────────────────────
    authPanelBg: '#FFFFFF',
    authScrimTo: '#FFFFFF',
    authHeading: '#0B0B0C',
    authSub: '#5C5D63',
    authFooter: '#9C9DA3',
    authFooterLink: '#0B0B0C',
    authPrimaryBg: '#0B0B0C',
    authPrimaryText: '#FFFFFF',
    authSecondaryBg: '#FFFFFF',
    authSecBorder: '#E7E7E4',
    authSecText: '#0B0B0C',
    authSecIcon: '#0B0B0C',
    authGuest: '#5C5D63',

    // ── Auth bottom sheet ─────────────────────────────────────────────────────
    sheetOverlay: 'rgba(11,11,12,0.32)',
    sheetBg: '#FFFFFF',
    sheetTopBorder: '#E7E7E4',
    sheetHandle: '#D9D9D5',
    sheetCloseIcon: '#5C5D63',
    sheetBrand: '#5C5D63',
    sheetTitle: '#0B0B0C',
    sheetSub: '#5C5D63',
    sheetDivider: '#EDEDEA',
    sheetLabel: '#5C5D63',
    sheetInputBg: '#F4F4F2', // INSET
    sheetInputBorder: '#E7E7E4',
    sheetInputText: '#0B0B0C',
    sheetPlaceholder: '#9C9DA3',
    sheetSelection: '#F2600C',
    sheetCtaBg: '#0B0B0C',
    sheetCtaText: '#FFFFFF',
    sheetGhostBorder: '#D9D9D5',
    sheetGhostText: '#0B0B0C',
    sheetFooter: '#9C9DA3',

    // ── Drawer ────────────────────────────────────────────────────────────────
    drawerOverlay: 'rgba(11,11,12,0.28)',
    drawerPanelBg: '#FFFFFF',
    drawerScrollBg: '#FAFAF8',
    drawerRowBg: '#FFFFFF',
    drawerRowBorder: '#EDEDEA',
    drawerIconWrap: '#F4F4F2',
    drawerLabel: '#0B0B0C',
    drawerDim: '#5C5D63',
    drawerWordmark: '#0B0B0C',
    drawerShimmer: 'rgba(11,11,12,0.12)',
    drawerAccentLine: '#F2600C',
    drawerBottomBg: '#FFFFFF',
    drawerBottomText: '#9C9DA3',
    drawerBottomBorder: '#EDEDEA',
    drawerCloseIconBg: '#F4F4F2',
    drawerCloseIconBorder: '#E7E7E4',
    drawerCloseIconText: '#5C5D63',
    drawerShadow: 'transparent', // no shadows in white

    // ── Bottom tab bar ────────────────────────────────────────────────────────
    tabBarBg: '#FFFFFF',
    tabLabelGradient: ['#F97316', '#EC4899', '#8B5CF6', '#A78BFA'],
    tabIconInactive: '#9C9DA3',
    tabLabelInactive: '#9C9DA3',
    tabLabelActive: '#0B0B0C',

    // ── Agent screen ──────────────────────────────────────────────────────────
    agentGlowOrange: 'rgba(242,96,12,0)', // no glows in white
    agentGlowBlue: 'rgba(139,92,246,0)',
    agentInputBg: '#FFFFFF',
    agentInputBorder: '#E7E7E4',
    agentInputText: '#0B0B0C',
    agentInputPlaceholder: '#9C9DA3',
    agentBtnBg: '#F4F4F2',
    agentBtnBorder: '#E7E7E4',
    agentBtnIcon: '#0B0B0C',
    agentSendGradient: ['#0B0B0C', '#0B0B0C'], // ink send button
    agentBorderGradient: ['#E7E7E4', '#E7E7E4', '#E7E7E4'], // flat hairline ring
    agentCardGlassTint: 'rgba(255,255,255,1)',

    agentTabBg: '#F4F4F2',
    agentTabBorder: '#E7E7E4',
    agentTabText: '#5C5D63',
    agentTabIcon: '#5C5D63',
    agentTabActiveBg: '#0B0B0C',
    agentTabActiveText: '#FFFFFF',

    // ── Marketplace ───────────────────────────────────────────────────────────
    templatesChipBg: '#FFFFFF',
    templatesChipBorder: '#E7E7E4',
    templatesChipText: '#5C5D63',
    templatesTagBg: '#F4F4F2',
    templatesTagText: '#3A3B40',
    templatesSkeletonBase: '#EFEFEC',
    templatesSkeletonHighlight: '#F7F7F5',

    // ── Studio ────────────────────────────────────────────────────────────────
    studioCardGradient: ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
    studioCardBorder: '#E7E7E4',
    studioCardTopEdge: '#E7E7E4',
    studioCardLogoBg: '#F4F4F2',
    studioRailBg: '#F4F4F2',
    studioRailActiveBg: '#FFFFFF',

    // ── Code editor — the web workspace's light ladder ────────────────────────
    codeEditorTabBarBg: '#FAFAF8',
    codeEditorTabBg: '#F4F4F2',
    codeEditorTabBorder: '#E7E7E4',
    codeEditorTabText: '#7A7B81',
    codeEditorTabActiveText: '#0B0B0C',
    codeEditorTabIndicator: '#0B0B0C',
    codeEditorSurface: '#FFFFFF',
    codeEditorBg: '#FAFAF8',
    codeEditorBorder: '#E7E7E4',
    codeEditorGutterBg: '#F7F7F5',
    codeEditorLineNumber: '#B4B5BA',
    codeEditorText: '#0B0B0C',
    codeEditorTextMuted: '#7A7B81',
    codeEditorChatUserBg: '#F4F4F2',
    codeEditorChatUserText: '#0B0B0C',
    codeEditorChatAssistantBg: '#FFFFFF',
    codeEditorChatAssistantText: '#0B0B0C',
    codeEditorActivityBg: '#F7F7F5',
    codeEditorActivityBorder: '#E7E7E4',
    codeEditorActivityText: '#7A7B81',
    codeEditorConnectedDot: '#12A150',
    codeEditorDisconnectedDot: '#C4C5CA',
    codeEditorDanger: '#E5484D',
    codeEditorFocus: '#0B0B0C',
    codeEditorAccentWash: 'rgba(11,11,12,0.06)',
    codeEditorAccentText: '#0B0B0C',

    codeEditorGlassOverlay: '#FFFFFF', // white: solid, no translucent veil
    codeEditorGlassBorder: '#E7E7E4',
    codeEditorGlassBorderTop: '#E7E7E4',
    codeEditorUserBubbleFrom: '#F4F4F2',
    codeEditorUserBubbleTo: '#F4F4F2',

    codeEditorTimelineLine: '#E7E7E4',
    codeEditorTimelineDone: '#12A150',
    codeEditorTimelineActive: '#0B0B0C',
    codeEditorToolChipBg: '#F4F4F2',
    codeEditorToolChipBorder: '#E7E7E4',
    codeEditorToolChipText: '#5C5D63',
    codeEditorToolChipActiveBg: '#FFFFFF',
    codeEditorToolChipActiveBorder: '#D9D9D5',
    codeEditorToolChipActiveText: '#0B0B0C',
    codeEditorShimmerHighlight: '#9C9DA3',

    codeEditorTokenIn: '#2F6FDB',
    codeEditorTokenOut: '#12A150',
    codeEditorTokenCachedBg: 'rgba(217,119,6,0.08)',
    codeEditorTokenCachedText: '#B45309',
    codeEditorTodosBadgeBg: '#F4F4F2',
    codeEditorTodosBadgeText: '#0B0B0C',
    codeEditorReviewOkBg: 'rgba(18,161,80,0.08)',
    codeEditorReviewOkText: '#0E7A3E',
    codeEditorReviewWarnBg: 'rgba(217,119,6,0.08)',
    codeEditorReviewWarnText: '#B45309',
    codeEditorAmber: '#D97706',

    // Terminal stays a dark well in both themes: code reads best on ink.
    terminalBg: '#111113',
    terminalText: 'rgba(255,255,255,0.86)',
    terminalCmd: '#8AB4FF',
    terminalOk: '#3DDC84',
    terminalErr: '#FF6B6B',
    terminalWarn: '#FFC24B',
    terminalInfo: 'rgba(255,255,255,0.55)',
    terminalInputBg: '#1B1B1E',
    terminalInputBorder: '#2A2A2E',

    collectionsChipBg: '#F4F4F2',
    collectionsChipActiveBg: '#0B0B0C',
    collectionsBadgeBg: '#F4F4F2',
    collectionsBadgeText: '#0B0B0C',
    collectionsMethodGet: '#12A150',
    collectionsMethodPost: '#2F6FDB',
    collectionsMethodOther: '#D97706',

    diffAddedBg: 'rgba(18,161,80,0.08)',
    diffAddedText: '#0E7A3E',
    diffRemovedBg: 'rgba(229,72,77,0.08)',
    diffRemovedText: '#C2363B',
    diffMeta: '#9C9DA3',
  },
} as const;

export type AppScheme = keyof typeof appTheme;

/** Colour values are values, not discriminants. Inferred literally, `accent`
 * has the type `'#EC4899'` rather than `string`, so nothing may ever hand a
 * component a palette with a different accent — which is exactly what the
 * coder screens need to do (see CoderTheme.ts). Widen the leaves, keep the
 * shape. */
/** `statusBar` is the one entry that is NOT a colour — it is a StatusBarStyle
 * enum and its literal type is what makes `barStyle={t.statusBar}` typecheck. */
/** Widen one leaf: a colour string becomes `string`, and a gradient tuple
 * becomes a tuple of the same LENGTH holding `string`s — length matters,
 * because `LinearGradient`'s `colors` prop demands at least two entries. */
type Widen<V> = V extends readonly string[]
  ? { [I in keyof V]: string }
  : V extends string
    ? string
    : V;
type ColorValues<T> = {
  [K in keyof T]: K extends 'statusBar' ? T[K] : Widen<T[K]>;
};
export type AppColors =
  | ColorValues<typeof appTheme.dark>
  | ColorValues<typeof appTheme.light>;

/** One-liner hook helper — import & call at the top of any component. */
export function useAppTheme(colorScheme: string | null | undefined): AppColors {
  // dark/light share a shape but hold different literal values, so the indexed
  // access is a union — narrow it back to the common AppColors type.
  return appTheme[colorScheme === 'dark' ? 'dark' : 'light'] as AppColors;
}
