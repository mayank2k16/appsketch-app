/**
 * HomeTheme — the app palette with Home's own two-tone surface ladder.
 *
 * Home used to be a straight re-export of `appTheme`, which meant it carried
 * that theme's generic dark ladder (`bg` #0A0A0C, `surface` #141414, `card`
 * #1C1C1C) plus a scattering of translucent `rgba(255,255,255,0.05)` fills for
 * pills and suggestion chips. Against the achromatic Agent/Studio/Coder
 * screens that read as a different product, and the translucent chips picked
 * up whatever was behind them (the twinkling dot grid) instead of sitting as
 * solid cards.
 *
 * So Home gets the SAME scoping treatment CoderTheme uses (see that file's
 * header): one function retunes the surface tokens, every Home section keeps
 * importing `homeTheme` untouched. Two values, applied consistently:
 *
 *   CANVAS  #030303 — the page background, the deepest value on screen.
 *   RAISED  #0A0E0E — anything sitting on it: cards, the prompt box, the
 *                     suggestion chips, the "Learn more" button, pills.
 *
 * Raised surfaces are the lighter of the two, so a card reads as lifted off
 * the page rather than cut into it.
 *
 * Brand colour is untouched. The accent, the logo and the "100X" badge all
 * still carry the indigo/violet identity — only the surfaces underneath them
 * went neutral. Home is still the marketing face of the app; this changes what
 * it's painted ON, not the paint.
 */
import {
  appTheme,
  BRAND_RAMP,
  brandGradient,
  SURFACE_CANVAS,
  SURFACE_RAISED,
  type AppColors,
} from '@/lib/theme';

// The same pair the achromatic screens use (see CoderTheme), imported rather
// than re-declared so Home and Agent/Studio/Marketplace cannot drift apart.
/** The page canvas — the deepest value on screen. */
const HOME_CANVAS = SURFACE_CANVAS;
/** Everything raised off the canvas — opaque, never a translucent wash. */
const HOME_RAISED = SURFACE_RAISED;

// The brand ramp used to be declared here. It now lives in AppTheme, because
// the bottom tab bar and the login screen carry it too and neither can import
// from a Home container. Re-exported under the old names so Home's own
// sections keep importing it from their local theme, same as `homeTheme`.
export { BRAND_RAMP as HOME_BRAND_RAMP, brandGradient as homeBrandGradient };

/** Ramp midpoint — the single flat colour to use where a gradient will not go.
 *  `accent` is read by dozens of Home call sites as a plain string (icon
 *  tints, borders, dots, `ActivityIndicator`), none of which can take three
 *  stops, so they all land here rather than each picking a favourite hue. */
const BRAND_MID = BRAND_RAMP[1];

/** Retunes the surface ladder and pulls Home's accent onto the brand ramp. */
function scopeHome(base: (typeof appTheme)['dark']): AppColors {
  return {
    ...base,

    // ── Accent ────────────────────────────────────────────────────────────────
    // `appTheme` still carries the original indigo #6C5CE7 for the rest of the
    // app. On Home that indigo was the only hue left that the ramp above does
    // not contain — the section eyebrows, the "how it works" icon tiles, the
    // step dots and the card glows all read `accent`, so the screen ran a
    // warm headline and a cold blue body. Retuned here rather than at the base
    // palette so the change stays scoped to the marketing face.
    //
    // The midpoint is used rather than an end stop: it is the hue the eye
    // already reads as the ramp's centre of mass, so a flat element tinted
    // with it sits inside the gradient's range instead of alongside it.
    accent: BRAND_MID,
    accentSoft: 'rgba(236,72,153,0.15)',
    tagText: BRAND_MID,
    tagBorder: 'rgba(236,72,153,0.55)',
    glowColor: 'rgba(236,72,153,0.14)',
    pulseRing: 'rgba(236,72,153,0.40)',

    // ── Canvas ────────────────────────────────────────────────────────────────
    bg: HOME_CANVAS,
    // The header sits directly on the canvas and must not seam against it.
    headerBg: HOME_CANVAS,
    tabBarBg: HOME_CANVAS,

    // ── Raised surfaces ───────────────────────────────────────────────────────
    // `card` is the widest of these: besides the section cards it is also the
    // fill laid over the prompt card's BlurView, which sits on top of the
    // rotating border gradient. Opaque is load-bearing there — a translucent
    // value lets that ring bleed through the whole card body instead of just
    // showing at its edge.
    surface: HOME_RAISED,
    card: HOME_RAISED,
    sheetBg: HOME_RAISED,
    toastBg: HOME_RAISED,

    // "Learn more" — the secondary CTA next to the white "Get started".
    heroSecondaryBg: HOME_RAISED,

    // App-type tabs (Web App / Mobile App), the suggestion chips under the
    // prompt card, and the composer's icon buttons. All three were translucent
    // white washes that let the twinkling dot grid show through; opaque now,
    // on the same secondary value as every other card.
    agentTabBg: HOME_RAISED,
    agentBtnBg: HOME_RAISED,
    templatesTagBg: HOME_RAISED,

    // ── Prompt-card ring ──────────────────────────────────────────────────────
    // The lit edge on the prompt card, and the fill on the selected app-type
    // pill and the send button beside it, all read from this one ramp (see
    // AgentV2) so the three elements stay in step. They used to be set
    // independently — a cyan→violet→blue gradient on the card, a hardcoded
    // violet on the tab — which is what put a stray blue edge next to a violet
    // tab wherever they met.
    //
    // This was a white ramp through the achromatic pass, which is what left
    // Home's prompt card as a grey box with a flat orange stroke. Home is the
    // marketing face of the app and the one screen that keeps its colour (see
    // this file's header, and the `CoderTheme` scoping note) — so the edge
    // runs the brand ramp, same three hues and same direction as the hero
    // heading directly above it.
    //
    // Three stops, not more: `AppColors` fixes this token's length, and the
    // shape wanted here is reachable by moving `locations` instead.
    agentBorderGradient: brandGradient(),
  };
}

// ─── Home screen tokens ───────────────────────────────────────────────────────
// Light mode is left on the shared palette — the two values above are a dark
// surface ladder, and Home's light theme has no equivalent complaint.
export const homeTheme = {
  dark: scopeHome(appTheme.dark),
  light: appTheme.light,
};

export type HomeScheme = keyof typeof appTheme;
export type HomeColors = AppColors;

// ─── Drawer tokens (maps drawer* keys into the shape drawer-menu expects) ─────
// The dark drawer is pulled onto the same ladder as everything else. Its own
// tokens were a third dark ramp (`drawerPanelBg` #0C0C0C, `drawerScrollBg`
// #141414, `drawerRowBg` #1C1C1C) with an indigo wash behind every icon, so
// sliding it open over an achromatic screen swapped in a greyer, violet-tinted
// panel. Rows now sit on RAISED over a CANVAS panel, same as a card on any
// other screen, and the icon badge is a neutral wash instead of a tint.
const buildDrawerTheme = (scheme: 'dark' | 'light') => {
  const t = appTheme[scheme];
  const dark = scheme === 'dark';
  return {
    overlay: t.drawerOverlay,
    panelBg: dark ? SURFACE_CANVAS : t.drawerPanelBg,
    headerBg: dark ? SURFACE_CANVAS : t.drawerPanelBg,
    scrollBg: dark ? SURFACE_CANVAS : t.drawerScrollBg,
    rowBg: dark ? SURFACE_RAISED : t.drawerRowBg,
    rowBorder: t.drawerRowBorder,
    iconWrapBg: dark ? 'rgba(255,255,255,0.07)' : t.drawerIconWrap,
    labelColor: t.drawerLabel,
    dimColor: t.drawerDim,
    wordmarkColor: t.drawerWordmark,
    shimmerMid: t.drawerShimmer,
    accentLine: dark ? 'rgba(255,255,255,0.14)' : t.drawerAccentLine,
    bottomBg: dark ? SURFACE_CANVAS : t.drawerBottomBg,
    bottomText: t.drawerBottomText,
    bottomBorder: t.drawerBottomBorder,
    closeIconBg: t.drawerCloseIconBg,
    closeIconBorder: t.drawerCloseIconBorder,
    closeIconText: t.drawerCloseIconText,
    shadow: dark ? '#000000' : t.drawerShadow,
  } as const;
};

export const drawerTheme = {
  dark: buildDrawerTheme('dark'),
  light: buildDrawerTheme('light'),
} as const;

export type DrawerScheme = 'dark' | 'light';
export type DrawerColors = ReturnType<typeof buildDrawerTheme>;
