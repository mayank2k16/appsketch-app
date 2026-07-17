import * as React from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

/**
 * Custom line-icon set for the bottom tab bar. Ionicons (font glyphs) can
 * only ever be a single solid colour — there's no way to give a font glyph a
 * gradient fill without an extra masking dependency. Rendering the 4 tab
 * icons as plain react-native-svg paths instead means the active state can
 * just set `stroke` to a gradient url, same as the label text's gradient.
 */
export type TabIconKey = 'home' | 'agent' | 'studio' | 'market';

const SIZE = 23;
const STROKE_WIDTH = 1.9;
const GRADIENT_STOPS_PCT = [0, 40, 68, 100];

function IconShape({ iconKey }: { iconKey: TabIconKey }) {
  switch (iconKey) {
    case 'home':
      return (
        <>
          <Path d="M3 11.5 12 4l9 7.5" />
          <Path d="M5 10v9h5v-5h4v5h5v-9" />
        </>
      );
    case 'agent':
      return (
        <>
          <Path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
          <Path d="M18.6 15.6l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z" />
        </>
      );
    case 'studio':
      return (
        <>
          <Circle cx={12} cy={12} r={8.5} />
          <Circle cx={8.6} cy={10} r={1.05} />
          <Circle cx={12} cy={8} r={1.05} />
          <Circle cx={15.4} cy={10} r={1.05} />
          <Path d="M12 20.5c1.6 0 1.9-1.3 1.2-2.2-.7-.8-.5-2.1 1-2.1h1" />
        </>
      );
    case 'market':
      return (
        <>
          <Path d="M4 8h16l-1 3.2a3 3 0 0 1-2.9 2.2H7.9A3 3 0 0 1 5 11.2z" />
          <Path d="M4 8l1.4-3.5h13.2L20 8" />
          <Path d="M6.5 13.4V20h11v-6.6" />
        </>
      );
  }
}

export function TabIcon({
  iconKey,
  active,
  inactiveColor,
  gradientStops,
  gradientId,
}: {
  iconKey: TabIconKey;
  active: boolean;
  inactiveColor: string;
  gradientStops: readonly string[];
  gradientId: string;
}) {
  const stroke = active ? `url(#${gradientId})` : inactiveColor;

  return (
    <Svg
      width={SIZE}
      height={SIZE}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {active ? (
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {gradientStops.map((color, i) => (
              <Stop key={i} offset={`${GRADIENT_STOPS_PCT[i]}%`} stopColor={color} />
            ))}
          </LinearGradient>
        </Defs>
      ) : null}
      <IconShape iconKey={iconKey} />
    </Svg>
  );
}
