import { useIsFocused } from '@react-navigation/native';
import * as React from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';


type Twinkle = {
  key: string;
  x: number;
  y: number;
  val: Animated.Value;
  dur: number;
  delay: number;
  peak: number;
};

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
  /** fraction of grid cells that twinkle (0–1) */
  density?: number;
};

export function TwinkleDots({
  width,
  height,
  color,
  spacing = 34,
  radius = 1.4,
  baseOpacity = 0.6,
  peakOpacity = 0.9,
  density = 0.6,
}: Props) {
  const isFocused = useIsFocused();

  const cols = Math.max(1, Math.ceil(width / spacing) + 1);
  const rows = Math.max(1, Math.ceil(height / spacing) + 1);

  const twinkles = React.useMemo<Twinkle[]>(() => {
    const total = cols * rows;
    const count = Math.round(total * density);
    const used = new Set<number>();
    const arr: Twinkle[] = [];
    let guard = 0;
    while (arr.length < count && guard < count * 6) {
      guard++;
      const cell = Math.floor(Math.random() * total);
      if (used.has(cell)) continue;
      used.add(cell);
      const c = cell % cols;
      const r = Math.floor(cell / cols);
      arr.push({
        key: `${cell}`,
        x: c * spacing,
        y: r * spacing,
        val: new Animated.Value(Math.random()),
        dur: 1400 + Math.random() * 2200, // 1.4s – 3.6s per half-cycle
        delay: Math.random() * 2600,
        peak: peakOpacity * (0.6 + Math.random() * 0.4),
      });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols, rows, spacing, density, peakOpacity]);

  React.useEffect(() => {
    if (!isFocused) return;
    const running = twinkles.map((d) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(d.val, {
            toValue: 1,
            duration: d.dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
            isInteraction: false,
          }),
          Animated.timing(d.val, {
            toValue: 0,
            duration: d.dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
            isInteraction: false,
          }),
        ])
      );
      const t = setTimeout(() => loop.start(), d.delay);
      return { loop, t };
    });
    return () => {
      running.forEach(({ loop, t }) => {
        clearTimeout(t);
        loop.stop();
      });
    };
  }, [twinkles, isFocused]);

  const size = radius * 2;

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {/* Static base grid — one cheap SVG node */}
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

      {/* Sparse animated overlay — the actual twinkle */}
      {twinkles.map((d) => (
        <Animated.View
          key={d.key}
          style={{
            position: 'absolute',
            left: d.x - radius,
            top: d.y - radius,
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: color,
            opacity: d.val.interpolate({
              inputRange: [0, 1],
              outputRange: [baseOpacity, d.peak],
            }),
          }}
        />
      ))}
    </View>
  );
}
