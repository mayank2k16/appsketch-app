import type { Theme } from '@react-navigation/native';
import { DarkTheme as _DarkTheme } from '@react-navigation/native';

import colors from '@/components/ui/colors';

const DarkTheme: Theme = {
  ..._DarkTheme,
  colors: {
    ..._DarkTheme.colors,
    primary: colors.primary[200],
    background: colors.charcoal[950],
    text: colors.charcoal[100],
    border: colors.charcoal[500],
    card: colors.charcoal[850],
  },
};

/**
 * The app is dark only (see use-selected-theme), so there is one theme and no
 * branch. This function used to read `useColorScheme()` and then return
 * `LightTheme` from BOTH sides of its `if` — navigation chrome was light even
 * in dark mode, which is a large part of why the light path looked broken.
 */
export function useThemeConfig() {
  return DarkTheme;
}
