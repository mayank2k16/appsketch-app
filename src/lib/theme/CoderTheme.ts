/**
 * CoderTheme — the app palette, ACHROMATIC.
 *
 * These screens are a PORT of the web workspace, not a native-looking cousin
 * of it, so they follow the web's achromatic ladder — `--ui-bg` #020202,
 * `--ui-surface` #0D0D0D, `--ui-ctl` #1E1E1E, one hairline #252525 — with
 * colour reserved for the two things that mean something: state (green ok, red
 * error) and a primary action.
 *
 * The rest of the app is branded electric indigo (`accent: #6C5CE7`), and
 * these screens inherited it by simply reading `colors.accent` — which is what
 * put violet on every button, switch, spinner and selected chip in a surface
 * that is otherwise black and grey. Rewriting ~30 call sites would have fixed
 * today's violet and none of tomorrow's, because the next `colors.accent`
 * someone types in there would be indigo again.
 *
 * So the SCOPE is the fix: a screen calls `useCoderTheme` instead of
 * `useAppTheme` and gets the same object with every chromatic token retuned.
 * `AppColors` is unchanged, so `colors` props typed as
 * `ReturnType<typeof useAppTheme>` keep working untouched.
 *
 * WHO USES IT: the coder screens (chat / code / preview / collections /
 * terminal), plus the Agent, Studio and Marketplace tabs and the bottom tab
 * bar. Home is the one surface still on the branded indigo — it is the
 * marketing face of the app, where the brand colour is the point.
 *
 * WHY GREY AND NOT BLUE: this file used to point `accent` at
 * `codeEditorFocus` (#4F7DFF), described as "the web's `--ui-accent`". The web
 * has since gone the rest of the way — `--ui-accent` is #d4d4d4 there now,
 * annotated "(was $blue)" — and this port never followed, so the app was blue
 * on a surface the web had already made grey. The values below track the web
 * again.
 */
import type { AppColors } from './AppTheme';
import { appTheme, useAppTheme } from './AppTheme';

function scope(base: (typeof appTheme)['dark'] | (typeof appTheme)['light']) {
  const dark = base.statusBar === 'light-content';
  // The web's `--ui-accent-soft` #eaeaea: the selected-chip fill and the
  // colour an active label takes. On light it has to invert — a near-white
  // "accent" is invisible on a white card.
  const accent = dark ? '#EAEAEA' : '#1A1A1A';
  return {
    ...base,
    accent,
    // Web: `.on { color: #010203; background: var(--ui-accent-soft) }` — the
    // fill is near-white, so what sits on it must be near-BLACK. This is the
    // whole reason `accentOn` exists; see AppTheme.
    accentOn: dark ? '#010203' : '#FFFFFF',
    // A wash, used as a background and never as text.
    accentSoft: dark ? 'rgba(234,234,234,0.12)' : 'rgba(26,26,26,0.08)',

    // ── the branded gradients, flattened ────────────────────────────────────
    // Each of these is a violet/blue ramp. Kept as ramps (the components
    // animate and mask them, so a single colour would break the effect) but
    // retuned to a light-to-dim grey sheen off the same ladder.
    tabLabelGradient: dark
      ? ['#FFFFFF', '#EAEAEA', '#C9C9C9', '#A8A8A8']
      : ['#111111', '#2A2A2A', '#444444', '#5C5C5C'],
    agentSendGradient: dark ? ['#3A3A3A', '#1E1E1E'] : ['#2A2A2A', '#111111'],
    agentBorderGradient: dark
      ? ['#3A3A3A', '#5A5A5A', '#2A2A2A']
      : ['#D4D4D4', '#B4B4B4', '#E4E4E4'],
    agentGlowBlue: dark ? 'rgba(255,255,255,0.10)' : 'rgba(17,17,17,0.08)',
    agentGlowOrange: dark ? 'rgba(255,255,255,0.06)' : 'rgba(17,17,17,0.05)',

    // The Web/App pill above the composer — a light fill with dark text, the
    // same "on" treatment the web gives a selected chip.
    agentTabActiveBg: accent,
    agentTabActiveText: dark ? '#010203' : '#FFFFFF',

    // Marketplace tag pills and the Studio section rail were both an indigo
    // wash; they become the same neutral raised surface the web uses
    // (`--ui-ctl`) rather than a tint.
    templatesTagBg: dark ? 'rgba(255,255,255,0.07)' : 'rgba(17,17,17,0.06)',
    templatesTagText: dark ? '#C9C9C9' : '#3A3A3A',
    studioRailActiveBg: dark ? 'rgba(255,255,255,0.10)' : 'rgba(17,17,17,0.08)',
  } as AppColors;
}

const coderTheme = { dark: scope(appTheme.dark), light: scope(appTheme.light) };

/** Drop-in replacement for `useAppTheme` on any screen that should be
 * achromatic — see WHO USES IT above. */
export function useCoderTheme(
  colorScheme: string | null | undefined
): AppColors {
  return coderTheme[colorScheme === 'dark' ? 'dark' : 'light'];
}

export { useAppTheme };
