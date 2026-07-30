import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { useMMKVString } from 'react-native-mmkv';

import { storage } from '@/lib/storage';

import type { CmsThemeName } from './cms-theme';
import { cmsThemes, DEFAULT_CMS_THEME } from './cms-theme';

const CMS_THEME_KEY = 'CMS_THEME';

// Backed directly by MMKV (same pattern as `useSelectedTheme`) rather than a
// React Context — `useMMKVString` already notifies every subscriber sharing
// the same key/instance, so every screen calling this hook re-renders live
// when the theme changes, with persistence for free.
//
// A CMS theme (e.g. "Sea Glass") only picks the sidebar/accent identity —
// it doesn't lock the screen into light or dark. Which of its two color
// sets (`.light`/`.dark`) is active follows the app's own light/dark mode
// (`useColorScheme` from nativewind, the same source `useSelectedTheme`
// writes to), exactly like Slack's sidebar theme picker is independent of
// its separate light/dark toggle.
export function useCmsTheme() {
  const [name, setName] = useMMKVString(CMS_THEME_KEY, storage);
  const { colorScheme } = useColorScheme();

  const themeName = (name ?? DEFAULT_CMS_THEME) as CmsThemeName;
  const theme = cmsThemes[themeName] ?? cmsThemes[DEFAULT_CMS_THEME];
  const colors = colorScheme === 'dark' ? theme.dark : theme.light;

  const setThemeName = React.useCallback(
    (next: CmsThemeName) => setName(next),
    [setName]
  );

  return {
    themeName,
    theme,
    colors,
    setThemeName,
  } as const;
}
