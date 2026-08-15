/**
 * CoderTheme — the app palette, scoped to the AI coder surface.
 *
 * The coder screens (chat / code / preview / collections / terminal) are a
 * PORT of the web workspace, not a native-looking cousin of it, so they follow
 * the web's achromatic ladder — `--ui-bg` #020202, `--ui-surface` #0D0D0D,
 * `--ui-ctl` #1E1E1E, one hairline #252525 — with colour reserved for the two
 * things that mean something: state (green ok, red error) and a primary action.
 *
 * The rest of the app is branded electric indigo (`accent: #6C5CE7`), and the
 * coder screens inherited it by simply reading `colors.accent` — which is what
 * put violet on every button, switch, spinner and selected chip in a surface
 * that is otherwise black and grey. Rewriting ~30 call sites would have fixed
 * today's violet and none of tomorrow's, because the next `colors.accent`
 * someone types in here would be indigo again.
 *
 * So the scope is the fix: every coder screen calls `useCoderTheme` instead of
 * `useAppTheme` and gets the same object with `accent`/`accentSoft` retuned to
 * the web's blue. `AppColors` is unchanged, so `colors` props typed as
 * `ReturnType<typeof useAppTheme>` keep working untouched.
 */
import type { AppColors } from './AppTheme';
import { appTheme, useAppTheme } from './AppTheme';

function scope(base: (typeof appTheme)['dark'] | (typeof appTheme)['light']) {
  return {
    ...base,
    // The web's `--ui-accent` — a solid fill ONLY on a primary action.
    accent: base.codeEditorFocus,
    // The web's selected-chip wash. The app uses `accentSoft` as a background
    // (never as text), which is exactly what this is.
    accentSoft: base.codeEditorAccentWash,
  } as AppColors;
}

const coderTheme = { dark: scope(appTheme.dark), light: scope(appTheme.light) };

/** Drop-in replacement for `useAppTheme` inside `containers/CodeEditor`. */
export function useCoderTheme(
  colorScheme: string | null | undefined
): AppColors {
  return coderTheme[colorScheme === 'dark' ? 'dark' : 'light'];
}

export { useAppTheme };
