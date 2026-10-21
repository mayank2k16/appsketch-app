import { colorScheme, useColorScheme } from 'nativewind';
import React from 'react';
import { useMMKVString } from 'react-native-mmkv';

import { storage } from '../storage';

/**
 * Theme selection — premium WHITE by default, dark as a setting.
 *
 * The choice is persisted in MMKV and applied before React renders
 * (`loadSelectedTheme`), so the first frame is already in the right theme.
 * Every screen resolves its palette with `colorScheme === 'dark' ? dark :
 * light`; the white palette is the default branch, see docs/white-theme.md.
 *
 * 'system' is still accepted for old call sites and follows the phone.
 */
export type ColorSchemeType = 'light' | 'dark' | 'system';

const SELECTED_THEME = 'SELECTED_THEME';
const DEFAULT_THEME: ColorSchemeType = 'light';

function readTheme(value: string | undefined | null): ColorSchemeType {
  return value === 'dark' || value === 'system' || value === 'light'
    ? value
    : DEFAULT_THEME;
}

export const useSelectedTheme = () => {
  const { setColorScheme } = useColorScheme();
  const [theme, _setTheme] = useMMKVString(SELECTED_THEME, storage);

  const setSelectedTheme = React.useCallback(
    (t: ColorSchemeType) => {
      setColorScheme(t);
      _setTheme(t);
    },
    [setColorScheme, _setTheme]
  );

  return { selectedTheme: readTheme(theme), setSelectedTheme } as const;
};

/** Called once from the root file, before React renders. */
export const loadSelectedTheme = () => {
  colorScheme.set(readTheme(storage.getString(SELECTED_THEME)));
};
