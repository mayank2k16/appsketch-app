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
export function useCmsTheme() {
  const [name, setName] = useMMKVString(CMS_THEME_KEY, storage);

  const themeName = (name ?? DEFAULT_CMS_THEME) as CmsThemeName;
  const theme = cmsThemes[themeName] ?? cmsThemes[DEFAULT_CMS_THEME];

  const setThemeName = React.useCallback(
    (next: CmsThemeName) => setName(next),
    [setName]
  );

  return {
    themeName,
    theme,
    colors: theme.colors,
    setThemeName,
  } as const;
}
