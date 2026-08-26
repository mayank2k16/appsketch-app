import { colorScheme, useColorScheme } from 'nativewind';
import React from 'react';

/**
 * Theme selection — dark only.
 *
 * The app used to offer light / dark / system, persisted in MMKV and toggled
 * from the drawer. It ships a single dark theme now: the achromatic surface
 * ladder (see CoderTheme) is a DARK ladder, and the light palettes that
 * remain in the theme files were never brought along with it, so anything
 * that reached light mode rendered half-restyled.
 *
 * The hook keeps its old shape rather than being deleted, so callers reading
 * `selectedTheme` keep working — it just never reports anything but 'dark'.
 */
export type ColorSchemeType = 'light' | 'dark' | 'system';

export const useSelectedTheme = () => {
  const { setColorScheme } = useColorScheme();

  // Kept so existing call sites still type-check; every scheme collapses to
  // dark, so this is a no-op guard rather than a switch.
  const setSelectedTheme = React.useCallback(
    (_t: ColorSchemeType) => {
      setColorScheme('dark');
    },
    [setColorScheme]
  );

  return {
    selectedTheme: 'dark' as ColorSchemeType,
    setSelectedTheme,
  } as const;
};

/**
 * Called once from the root file, before React renders. Pinning the scheme
 * here is what makes the dark-only guarantee hold app-wide: every screen
 * resolves its palette with `colorScheme === 'dark' ? dark : light`, and with
 * this set there is no path that lands on the light branch.
 */
export const loadSelectedTheme = () => {
  colorScheme.set('dark');
};
