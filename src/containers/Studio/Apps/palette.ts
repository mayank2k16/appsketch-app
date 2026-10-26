import { useColorScheme } from 'nativewind';

import { useCoderTheme } from '@/lib/theme';

export const ORANGE = '#F2600C';

/** My apps' orange-on-white skin: white cards, a warm hairline, one orange
 *  for the primary action and the small accents. Dark keeps the theme's
 *  surfaces and the same orange. */
export function useAppsPalette() {
  const { colorScheme } = useColorScheme();
  const t = useCoderTheme(colorScheme);
  const dark = colorScheme === 'dark';
  return {
    t,
    dark,
    card: dark ? t.card : '#FFFFFF',
    border: dark ? t.studioCardBorder : '#F1E6DD',
    soft: dark ? 'rgba(242,96,12,0.16)' : '#FFF3EA',
    orange: ORANGE,
    onOrange: '#FFFFFF',
    ink: dark ? t.text : '#121214',
    sub: dark ? t.textMuted : '#6E6A67',
  };
}

export type AppsPalette = ReturnType<typeof useAppsPalette>;
