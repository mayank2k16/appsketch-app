import * as React from 'react';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

/**
 * Custom line-icon set for the bottom tab bar. Ionicons (font glyphs) can
 * only ever be a single solid colour — there's no way to give a font glyph a
 * gradient fill without an extra masking dependency. Rendering the 4 tab
 * icons as plain react-native-svg paths instead means the active state can
 * just set `stroke` to a gradient url, same as the label text's gradient.
 */
export type TabIconKey = 'home' | 'agent' | 'myApps' | 'pricing';

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
    case 'myApps':
      // An app grid: four rounded tiles.
      return (
        <>
          <Rect x={3.5} y={3.5} width={7} height={7} rx={2} />
          <Rect x={13.5} y={3.5} width={7} height={7} rx={2} />
          <Rect x={3.5} y={13.5} width={7} height={7} rx={2} />
          <Rect x={13.5} y={13.5} width={7} height={7} rx={2} />
        </>
      );
    case 'pricing':
      // A price tag: rounded body, punched hole.
      return (
        <>
          <Path d="M3.6 12.4V5.1a1.5 1.5 0 0 1 1.5-1.5h7.3a1.5 1.5 0 0 1 1.06.44l7 7a1.5 1.5 0 0 1 0 2.12l-7.3 7.3a1.5 1.5 0 0 1-2.12 0l-7-7a1.5 1.5 0 0 1-.44-1.06z" />
          <Circle cx={8.4} cy={8.4} r={1.5} />
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
              <Stop
                key={i}
                offset={`${GRADIENT_STOPS_PCT[i]}%`}
                stopColor={color}
              />
            ))}
          </LinearGradient>
        </Defs>
      ) : null}
      <IconShape iconKey={iconKey} />
    </Svg>
  );
}
