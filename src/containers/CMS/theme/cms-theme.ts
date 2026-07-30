// Palette tokens for the CMS shell. Structural/brand colors vary per palette;
// status colors (success/danger/warning/info) stay constant across all of them
// since they carry semantic meaning (order/payment state) that shouldn't shift
// with the user's cosmetic theme choice.
//
// Every palette is light/dark-compatible by construction: a theme's identity
// lives in its sidebar + accent colors (`SidebarBrand`), which stay fixed,
// while the content-pane neutrals (background/surface/text/border) swap
// between `lightBody` and `darkBody` depending on the app's global
// light/dark mode (see `use-cms-theme.ts`). This mirrors how Slack's sidebar
// theme picker is independent from its separate light/dark mode toggle —
// picking "Sea Glass" doesn't fix you into light or dark, it just recolors
// the sidebar under whichever mode is active.

export type CmsThemeGroup = 'Classics' | 'Vision assistive' | 'Fun and new' | 'Updated classics';

export type CmsThemeName =
  // Classics
  | 'ocean-blue'
  | 'classic'
  | 'emerald-fresh'
  | 'charcoal-gray'
  | 'midnight-indigo'
  | 'gray'
  | 'mood-indigo'
  // Vision assistive
  | 'tritanopia'
  | 'protanopia-deuteranopia'
  // Fun and new
  | 'raspberry-beret'
  | 'big-business'
  | 'pog'
  | 'mint-chip'
  | 'pb-and-j'
  | 'chill-vibes'
  | 'forest-floor'
  | 'slackr'
  | 'sea-glass'
  | 'lemon-lime'
  | 'falling-leaves'
  | 'sunrise'
  // Updated classics
  | 'choco-mint'
  | 'cmyk'
  | 'haberdashery'
  | 'hoth'
  | 'ochin'
  | 'sweet-treat';

export type CmsThemeColors = {
  /** Mirrors this variant's light/dark mode — carried onto `colors` itself
   * so components that only receive `colors` (the established calling
   * convention, see `CmsConfirmModal`) can still tell light from dark
   * without a second prop. */
  kind: 'light' | 'dark';
  sidebarBg: string;
  sidebarActiveBg: string;
  sidebarText: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accent: string;
  accentText: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
};

export type CmsThemeMeta = {
  label: string;
  group: CmsThemeGroup;
  /** Colors for the content pane when the app is in light mode. */
  light: CmsThemeColors;
  /** Colors for the content pane when the app is in dark mode. */
  dark: CmsThemeColors;
};

const statusColors = {
  success: '#4CAF50',
  danger: '#F44336',
  warning: '#FF9800',
  info: '#2563EB',
};

// Shared content-pane neutrals — every palette uses these unless it has a
// bespoke tint (see `ocean-blue` / `classic` / `emerald-fresh` below,
// kept verbatim from before this palette expanded to cover light+dark).
const lightBody = {
  background: '#F7FAFC',
  surface: '#FFFFFF',
  textPrimary: '#1A202C',
  textSecondary: '#718096',
  border: '#E2E8F0',
};

const darkBody = {
  background: '#1A1D21',
  surface: '#24272B',
  textPrimary: '#F5F5F5',
  textSecondary: '#9CA3AF',
  border: '#34373C',
};

type SidebarBrand = {
  label: string;
  group: CmsThemeGroup;
  sidebarBg: string;
  sidebarActiveBg: string;
  sidebarText?: string;
  accent: string;
  accentText?: string;
  /** Only for palettes that need a bespoke content-pane tint instead of the
   * shared `lightBody`/`darkBody` neutrals (kept for the three original
   * palettes so their existing look doesn't regress). */
  lightOverride?: Partial<typeof lightBody>;
  darkOverride?: Partial<typeof darkBody>;
};

// A theme's identity is its sidebar + accent color, held constant across
// light/dark mode. Only the content-pane neutrals swap. This is what makes
// every entry below usable in both modes without a separate "dark version"
// theme to pick.
function sidebarBrand({
  label,
  group,
  sidebarBg,
  sidebarActiveBg,
  sidebarText = '#FFFFFF',
  accent,
  accentText = '#FFFFFF',
  lightOverride,
  darkOverride,
}: SidebarBrand): CmsThemeMeta {
  return {
    label,
    group,
    light: {
      kind: 'light',
      sidebarBg,
      sidebarActiveBg,
      sidebarText,
      accent,
      accentText,
      ...lightBody,
      ...lightOverride,
      ...statusColors,
    },
    dark: {
      kind: 'dark',
      sidebarBg,
      sidebarActiveBg,
      sidebarText,
      accent,
      accentText,
      ...darkBody,
      ...darkOverride,
      ...statusColors,
    },
  };
}

export const cmsThemes: Record<CmsThemeName, CmsThemeMeta> = {
  // ---- Classics -----------------------------------------------------
  'ocean-blue': sidebarBrand({
    label: 'Ocean Blue',
    group: 'Classics',
    sidebarBg: '#111827',
    sidebarActiveBg: '#1F2937',
    accent: '#2563EB',
    lightOverride: { background: '#F7FAFC', border: '#E2E8F0' },
  }),
  'classic': sidebarBrand({
    label: 'Classic',
    group: 'Classics',
    sidebarBg: '#3F0E40',
    sidebarActiveBg: '#522653',
    accent: '#2EB67D',
    lightOverride: {
      background: '#F8F8F8',
      textPrimary: '#1D1C1D',
      textSecondary: '#616061',
      border: '#E8E8E8',
    },
  }),
  'emerald-fresh': sidebarBrand({
    label: 'Emerald Fresh',
    group: 'Classics',
    sidebarBg: '#0B4F30',
    sidebarActiveBg: '#0F6B41',
    accent: '#10B981',
    lightOverride: {
      background: '#F4FAF6',
      textPrimary: '#122118',
      textSecondary: '#5C7A6C',
      border: '#DCEBE3',
    },
  }),
  'charcoal-gray': sidebarBrand({
    label: 'Charcoal Gray',
    group: 'Classics',
    sidebarBg: '#1A1D21',
    sidebarActiveBg: '#26292D',
    sidebarText: '#F5F5F5',
    accent: '#7C8CF8',
  }),
  'midnight-indigo': sidebarBrand({
    label: 'Midnight Indigo',
    group: 'Classics',
    sidebarBg: '#15132B',
    sidebarActiveBg: '#211D40',
    sidebarText: '#EDEBFA',
    accent: '#8B5CF6',
  }),
  gray: sidebarBrand({
    label: 'Gray',
    group: 'Classics',
    sidebarBg: '#4A4A4A',
    sidebarActiveBg: '#5C5C5C',
    accent: '#1264A3',
  }),
  'mood-indigo': sidebarBrand({
    label: 'Mood Indigo',
    group: 'Classics',
    sidebarBg: '#3D2E63',
    sidebarActiveBg: '#4C3B78',
    accent: '#8C7AE6',
  }),

  // ---- Vision assistive ----------------------------------------------
  // Built from the Okabe–Ito colorblind-safe palette so accent/status colors
  // stay distinguishable for the named deficiency.
  tritanopia: sidebarBrand({
    label: 'Tritanopia',
    group: 'Vision assistive',
    sidebarBg: '#1B2A4A',
    sidebarActiveBg: '#28395E',
    accent: '#D55E00',
  }),
  'protanopia-deuteranopia': sidebarBrand({
    label: 'Protanopia & Deuteranopia',
    group: 'Vision assistive',
    sidebarBg: '#20303F',
    sidebarActiveBg: '#2C4356',
    accent: '#E69F00',
  }),

  // ---- Fun and new -----------------------------------------------------
  'raspberry-beret': sidebarBrand({
    label: 'Raspberry Beret',
    group: 'Fun and new',
    sidebarBg: '#7B2D42',
    sidebarActiveBg: '#973A53',
    accent: '#E0567C',
  }),
  'big-business': sidebarBrand({
    label: 'Big Business',
    group: 'Fun and new',
    sidebarBg: '#1B2838',
    sidebarActiveBg: '#26384C',
    accent: '#3B82C4',
  }),
  pog: sidebarBrand({
    label: 'POG',
    group: 'Fun and new',
    sidebarBg: '#2D1B4E',
    sidebarActiveBg: '#3E2768',
    accent: '#00C2A8',
  }),
  'mint-chip': sidebarBrand({
    label: 'Mint Chip',
    group: 'Fun and new',
    sidebarBg: '#123C34',
    sidebarActiveBg: '#175042',
    accent: '#4FD1B5',
    accentText: '#0B231D',
  }),
  'pb-and-j': sidebarBrand({
    label: 'PB&J',
    group: 'Fun and new',
    sidebarBg: '#4A2F1A',
    sidebarActiveBg: '#5F3D23',
    accent: '#6B3FA0',
  }),
  'chill-vibes': sidebarBrand({
    label: 'Chill Vibes',
    group: 'Fun and new',
    sidebarBg: '#143B4C',
    sidebarActiveBg: '#1B4E63',
    accent: '#38BDF8',
    accentText: '#0B1E27',
  }),
  'forest-floor': sidebarBrand({
    label: 'Forest Floor',
    group: 'Fun and new',
    sidebarBg: '#22331B',
    sidebarActiveBg: '#2E4424',
    accent: '#7A9B57',
  }),
  slackr: sidebarBrand({
    label: 'Slackr',
    group: 'Fun and new',
    sidebarBg: '#2B2B2E',
    sidebarActiveBg: '#38383C',
    accent: '#FF6B35',
  }),
  'sea-glass': sidebarBrand({
    label: 'Sea Glass',
    group: 'Fun and new',
    sidebarBg: '#1F4E4E',
    sidebarActiveBg: '#296666',
    accent: '#7FD1C0',
    accentText: '#0B2624',
  }),
  'lemon-lime': sidebarBrand({
    label: 'Lemon Lime',
    group: 'Fun and new',
    sidebarBg: '#2F3B12',
    sidebarActiveBg: '#3E4D18',
    accent: '#C4D600',
    accentText: '#1A2005',
  }),
  'falling-leaves': sidebarBrand({
    label: 'Falling Leaves',
    group: 'Fun and new',
    sidebarBg: '#5C2E1A',
    sidebarActiveBg: '#743A21',
    accent: '#D97706',
  }),
  sunrise: sidebarBrand({
    label: 'Sunrise',
    group: 'Fun and new',
    sidebarBg: '#7A2E3B',
    sidebarActiveBg: '#963A4A',
    accent: '#FB923C',
    accentText: '#341407',
  }),

  // ---- Updated classics -------------------------------------------------
  'choco-mint': sidebarBrand({
    label: 'Choco Mint',
    group: 'Updated classics',
    sidebarBg: '#2E1D14',
    sidebarActiveBg: '#3D271A',
    accent: '#34D399',
    accentText: '#07211A',
  }),
  cmyk: sidebarBrand({
    label: 'CMYK',
    group: 'Updated classics',
    sidebarBg: '#1A1A1A',
    sidebarActiveBg: '#262626',
    accent: '#00AEEF',
  }),
  haberdashery: sidebarBrand({
    label: 'Haberdashery',
    group: 'Updated classics',
    sidebarBg: '#1F2A3D',
    sidebarActiveBg: '#2B3A52',
    accent: '#B08D57',
  }),
  hoth: sidebarBrand({
    label: 'Hoth',
    group: 'Updated classics',
    sidebarBg: '#17324A',
    sidebarActiveBg: '#20415F',
    accent: '#A8D8F0',
    accentText: '#0B1E2E',
  }),
  ochin: sidebarBrand({
    label: 'Ochin',
    group: 'Updated classics',
    sidebarBg: '#4A3410',
    sidebarActiveBg: '#5F4416',
    accent: '#D9A441',
    accentText: '#2E1F08',
  }),
  'sweet-treat': sidebarBrand({
    label: 'Sweet Treat',
    group: 'Updated classics',
    sidebarBg: '#6E1E45',
    sidebarActiveBg: '#8A2758',
    accent: '#F472B6',
    accentText: '#3A0F26',
  }),
};

export const DEFAULT_CMS_THEME: CmsThemeName = 'ocean-blue';

export const cmsThemeOrder: CmsThemeName[] = [
  'ocean-blue',
  'classic',
  'emerald-fresh',
  'charcoal-gray',
  'midnight-indigo',
  'gray',
  'mood-indigo',
  'tritanopia',
  'protanopia-deuteranopia',
  'raspberry-beret',
  'big-business',
  'pog',
  'mint-chip',
  'pb-and-j',
  'chill-vibes',
  'forest-floor',
  'slackr',
  'sea-glass',
  'lemon-lime',
  'falling-leaves',
  'sunrise',
  'choco-mint',
  'cmyk',
  'haberdashery',
  'hoth',
  'ochin',
  'sweet-treat',
];
