// Palette tokens for the CMS shell. Structural/brand colors vary per palette;
// status colors (success/danger/warning/info) stay constant across all of them
// since they carry semantic meaning (order/payment state) that shouldn't shift
// with the user's cosmetic theme choice.

export type CmsThemeName =
  | 'ocean-blue'
  | 'slack-classic'
  | 'emerald-fresh'
  | 'charcoal-gray'
  | 'midnight-indigo';

export type CmsThemeColors = {
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
  kind: 'light' | 'dark';
  colors: CmsThemeColors;
};

const statusColors = {
  success: '#4CAF50',
  danger: '#F44336',
  warning: '#FF9800',
  info: '#2563EB',
};

export const cmsThemes: Record<CmsThemeName, CmsThemeMeta> = {
  'ocean-blue': {
    label: 'Ocean Blue',
    kind: 'light',
    colors: {
      sidebarBg: '#111827',
      sidebarActiveBg: '#1F2937',
      sidebarText: '#FFFFFF',
      background: '#F7FAFC',
      surface: '#FFFFFF',
      textPrimary: '#1A202C',
      textSecondary: '#718096',
      border: '#E2E8F0',
      accent: '#2563EB',
      accentText: '#FFFFFF',
      ...statusColors,
    },
  },
  'slack-classic': {
    label: 'Slack Classic',
    kind: 'light',
    colors: {
      sidebarBg: '#3F0E40',
      sidebarActiveBg: '#522653',
      sidebarText: '#FFFFFF',
      background: '#F8F8F8',
      surface: '#FFFFFF',
      textPrimary: '#1D1C1D',
      textSecondary: '#616061',
      border: '#E8E8E8',
      accent: '#2EB67D',
      accentText: '#FFFFFF',
      ...statusColors,
    },
  },
  'emerald-fresh': {
    label: 'Emerald Fresh',
    kind: 'light',
    colors: {
      sidebarBg: '#0B4F30',
      sidebarActiveBg: '#0F6B41',
      sidebarText: '#FFFFFF',
      background: '#F4FAF6',
      surface: '#FFFFFF',
      textPrimary: '#122118',
      textSecondary: '#5C7A6C',
      border: '#DCEBE3',
      accent: '#10B981',
      accentText: '#FFFFFF',
      ...statusColors,
    },
  },
  'charcoal-gray': {
    label: 'Charcoal Gray',
    kind: 'dark',
    colors: {
      sidebarBg: '#1A1D21',
      sidebarActiveBg: '#26292D',
      sidebarText: '#F5F5F5',
      background: '#222529',
      surface: '#2C2F33',
      textPrimary: '#F5F5F5',
      textSecondary: '#9CA3AF',
      border: '#3A3D42',
      accent: '#7C8CF8',
      accentText: '#FFFFFF',
      ...statusColors,
    },
  },
  'midnight-indigo': {
    label: 'Midnight Indigo',
    kind: 'dark',
    colors: {
      sidebarBg: '#15132B',
      sidebarActiveBg: '#211D40',
      sidebarText: '#EDEBFA',
      background: '#181628',
      surface: '#211F35',
      textPrimary: '#EDEBFA',
      textSecondary: '#9891C4',
      border: '#332F52',
      accent: '#8B5CF6',
      accentText: '#FFFFFF',
      ...statusColors,
    },
  },
};

export const DEFAULT_CMS_THEME: CmsThemeName = 'ocean-blue';

export const cmsThemeOrder: CmsThemeName[] = [
  'ocean-blue',
  'slack-classic',
  'emerald-fresh',
  'charcoal-gray',
  'midnight-indigo',
];
