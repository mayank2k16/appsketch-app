import { useIsFocused } from '@react-navigation/native';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

// Every dot on screen twinkles, exactly as before — but the field is painted
// as three tiled SVG layers instead of one animated view per dot.
//
// The old version created an Animated.Value and an Animated.View per grid
// cell, and `density` defaulted to 1: on a 390×844 screen at 31px spacing
// that is 406 live animation drivers and 406 animated views running
// permanently behind every section of the Home feed. It was the single
// largest source of scroll jank.
//
// Each layer is ONE <Svg> whose pattern tile spans a 3×3 block of cells and
// paints 3 of the 9 cells in that block. The three layers' cell positions form
// a Latin square, so together they cover all 9 — i.e. every dot in the grid
// belongs to exactly one layer. Animating each layer's opacity therefore
// twinkles the whole field, scattered rather than in lockstep, at a cost of
// three animation drivers and three SVG nodes.
const LAYERS: [number, number][][] = [
  [
    [0, 0],
    [1, 2],
    [2, 1],
  ],
  [
    [1, 0],
    [2, 2],
    [0, 1],
  ],
  [
    [2, 0],
    [0, 2],
    [1, 1],
  ],
];
const BLOCK = 3;

type Props = {
  width: number;
  height: number;
  color: string;
  spacing?: number;
  radius?: number;
  /** opacity of the constant background grid */
  baseOpacity?: number;
  /** brightest opacity a twinkling dot reaches */
  peakOpacity?: number;
};

function TwinkleLayer({
  index,
  cells,
  width,
  height,
  spacing,
  radius,
  color,
  baseOpacity,
  peakOpacity,
}: {
  index: number;
  cells: [number, number][];
  width: number;
  height: number;
  spacing: number;
  radius: number;
  color: string;
  baseOpacity: number;
  peakOpacity: number;
}) {
  const v = useSharedValue(0);

  React.useEffect(() => {
    // Staggered durations and delays keep the three layers permanently out of
    // phase, so the field shimmers instead of pulsing as one sheet.
    v.value = withDelay(
      index * 900,
      withRepeat(
        withTiming(1, {
          duration: 1900 + index * 650,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
    return () => cancelAnimation(v);
  }, [v, index]);

  const style = useAnimatedStyle(() => ({
    opacity: baseOpacity + (peakOpacity - baseOpacity) * v.value,
  }));

  const tile = spacing * BLOCK;
  const id = `twinkleLayer${index}`;

  return (
    <Reanimated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <Pattern
            id={id}
            x={0}
            y={0}
            width={tile}
            height={tile}
            patternUnits="userSpaceOnUse"
          >
            {cells.map(([cx, cy]) => (
              <Circle
                key={`${cx}-${cy}`}
                cx={cx * spacing}
                cy={cy * spacing}
                r={radius}
                fill={color}
              />
            ))}
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill={`url(#${id})`} />
      </Svg>
    </Reanimated.View>
  );
}

export function TwinkleDots({
  width,
  height,
  color,
  spacing = 34,
  radius = 1.4,
  baseOpacity = 0.6,
  peakOpacity = 0.9,
}: Props) {
  const isFocused = useIsFocused();

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {/* Constant base grid — holds the full dot field at rest, and is all
          that remains when the screen is not focused. */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id="twinkleGrid"
            x={0}
            y={0}
            width={spacing}
            height={spacing}
            patternUnits="userSpaceOnUse"
          >
            <Circle cx={0} cy={0} r={radius} fill={color} opacity={baseOpacity} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#twinkleGrid)" />
      </Svg>

      {/* Animations stop entirely when Home is not the focused screen */}
      {isFocused &&
        LAYERS.map((cells, i) => (
          <TwinkleLayer
            key={i}
            index={i}
            cells={cells}
            width={width}
            height={height}
            spacing={spacing}
            radius={radius}
            color={color}
            baseOpacity={baseOpacity}
            peakOpacity={peakOpacity}
          />
        ))}
    </View>
  );
}
