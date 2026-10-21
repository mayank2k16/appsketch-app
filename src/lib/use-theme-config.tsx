import type { Theme } from 'expo-router';
import {
  DarkTheme as _DarkTheme,
  DefaultTheme as _LightTheme,
} from 'expo-router';
import { useColorScheme } from 'nativewind';

import colors from '@/components/ui/colors';

import { appTheme } from './theme/AppTheme';

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

/** Navigation chrome for the premium white theme — the canvas, not pure
 * white, so screens never flash a different white during transitions. */
const LightTheme: Theme = {
  ..._LightTheme,
  colors: {
    ..._LightTheme.colors,
    primary: appTheme.light.text,
    background: appTheme.light.bg,
    text: appTheme.light.text,
    border: appTheme.light.border,
    card: appTheme.light.surface,
  },
};

export function useThemeConfig() {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? DarkTheme : LightTheme;
}
