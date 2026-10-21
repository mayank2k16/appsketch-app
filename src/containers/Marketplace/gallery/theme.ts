import { Platform } from 'react-native';

/**
 * The colours of appsketch.ai/templates, so the Market tab and the web
 * gallery are one place. White is the web page's default theme; black is its
 * `.tpl-dark`. Values are copied from the variables at the top of the web
 * page's AITemplates.css; change them there first.
 */
export type GalleryTheme = {
  bg: string;
  ink: string;
  muted: string;
  faint: string;
  line: string;
  lineStrong: string;
  panel: string;
  /** The filled button, the active chip and the active type pill. */
  orange: string;
  /** The card's border and fill. */
  cardBorder: string;
  cardBg: string;
  /** The orange-and-blue light round a card (none on black, as on the web). */
  cardGlow: string;
  /** The pale stage a phone app stands on, and its two lights. */
  stage: string;
  stageTop: string;
  stageBottom: string;
  /** Things floated over a screenshot: white glass on white, dark on black. */
  glass: string;
  glassBorder: string;
  /** An ecosystem's badge, the one filled badge. */
  ecoBg: string;
  ecoText: string;
  skeleton: string;
  statusBar: 'light-content' | 'dark-content';
};

const WHITE: GalleryTheme = {
  bg: '#f6f6f8',
  ink: '#0b0b0c',
  muted: 'rgba(11, 11, 12, 0.62)',
  faint: 'rgba(11, 11, 12, 0.42)',
  line: 'rgba(11, 11, 12, 0.09)',
  lineStrong: 'rgba(11, 11, 12, 0.2)',
  panel: '#ffffff',
  orange: '#f2600c',
  cardBorder: 'rgba(14, 18, 30, 0.1)',
  cardBg: '#ffffff',
  cardGlow: [
    '-10px -8px 30px -12px rgba(255, 122, 38, 0.36)',
    '10px 12px 32px -12px rgba(31, 98, 232, 0.32)',
    '0px 10px 26px -16px rgba(14, 18, 30, 0.12)',
  ].join(', '),
  stage: '#f5f6f8',
  stageTop: 'rgba(255, 122, 38, 0.13)',
  stageBottom: 'rgba(31, 98, 232, 0.12)',
  glass: 'rgba(255, 255, 255, 0.86)',
  glassBorder: 'rgba(11, 11, 12, 0.1)',
  ecoBg: '#0b0b0c',
  ecoText: '#ffffff',
  skeleton: 'rgba(11, 11, 12, 0.06)',
  statusBar: 'dark-content',
};

const BLACK: GalleryTheme = {
  bg: '#08070e',
  ink: '#fafafa',
  muted: 'rgba(250, 250, 250, 0.62)',
  faint: 'rgba(250, 250, 250, 0.4)',
  line: 'rgba(255, 255, 255, 0.1)',
  lineStrong: 'rgba(255, 255, 255, 0.22)',
  panel: '#100e18',
  orange: '#f2600c',
  cardBorder: 'rgba(226, 222, 255, 0.13)',
  cardBg: 'rgba(226, 222, 255, 0.035)',
  cardGlow: 'none',
  stage: '#0c0a13',
  stageTop: 'rgba(122, 43, 255, 0.26)',
  stageBottom: 'rgba(255, 58, 130, 0.12)',
  glass: 'rgba(0, 0, 0, 0.62)',
  glassBorder: 'rgba(255, 255, 255, 0.16)',
  ecoBg: '#fafafa',
  ecoText: '#0b0b0c',
  skeleton: 'rgba(255, 255, 255, 0.07)',
  statusBar: 'light-content',
};

export const galleryTheme = (isDark: boolean): GalleryTheme =>
  isDark ? BLACK : WHITE;

/** The web page's mono face, for badges and the eyebrow. */
export const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });
