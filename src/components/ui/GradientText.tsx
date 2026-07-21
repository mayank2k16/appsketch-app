import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import type { ColorValue } from 'react-native';
import * as React from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View, type TextStyle } from 'react-native';

type GradientColors = readonly [ColorValue, ColorValue, ...ColorValue[]];

function toPx(v: number | string | undefined): string | undefined {
  return typeof v === 'number' ? `${v}px` : v;
}

// `@react-native-masked-view`'s web shim is a no-op stub — it renders only
// `maskElement` and silently drops its `children` (confirmed by reading
// `MaskedView.web.js`: `React.createElement(View, props, maskElement)`).
// Real masking only exists on iOS/Android, so web falls back to the
// standard CSS `background-clip: text` trick with the same colours/stops.
type Props = {
  children: string;
  style: TextStyle;
  colors: string[];
  locations?: number[];
};

export function GradientText({ children, style, colors, locations }: Props) {
  if (Platform.OS === 'web') {
    const stops = colors
      .map((c, i) => `${c} ${((locations?.[i] ?? i / (colors.length - 1)) * 100).toFixed(0)}%`)
      .join(', ');
    return React.createElement(
      'span',
      {
        style: {
          display: 'block',
          fontFamily: style.fontFamily,
          fontSize: toPx(style.fontSize),
          letterSpacing: toPx(style.letterSpacing),
          lineHeight: toPx(style.lineHeight),
          textAlign: style.textAlign,
          backgroundImage: `linear-gradient(90deg, ${stops})`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        },
      },
      children
    );
  }

  return (
    <MaskedView maskElement={<Text style={style}>{children}</Text>}>
      <LinearGradient
        colors={colors as unknown as GradientColors}
        locations={locations as unknown as readonly [number, number, ...number[]] | undefined}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

// ─── Animated shimmer variant ───────────────────────────────────────────────
// A highlight band sweeps left→right across the text, then pauses, then
// repeats — vs. `GradientText` above, which is a static fade. `baseColor`
// is the constant muted tone the text sits at between sweeps; `highlightColor`
// is the brighter tone the moving band carries across it.
type AnimatedProps = {
  children: string;
  style: TextStyle;
  baseColor: string;
  highlightColor: string;
  /** ms for the band to cross the text once. */
  sweepDuration?: number;
  /** ms of stillness between sweeps. */
  pauseDuration?: number;
};

export function AnimatedGradientText({
  children,
  style,
  baseColor,
  highlightColor,
  sweepDuration = 4000,
  pauseDuration = 0,
}: AnimatedProps) {
  const [width, setWidth] = React.useState(0);
  const translateX = React.useRef(new Animated.Value(0)).current;
  const bandWidth = width * 0.9;

  React.useEffect(() => {
    if (Platform.OS === 'web' || !width) return;
    translateX.setValue(-bandWidth);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, { toValue: width, duration: sweepDuration, easing: Easing.linear, useNativeDriver: true }),
        Animated.delay(pauseDuration),
        Animated.timing(translateX, { toValue: -bandWidth, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, sweepDuration, pauseDuration]);

  if (Platform.OS === 'web') {
    const total = sweepDuration + pauseDuration;
    const sweepPct = ((sweepDuration / total) * 100).toFixed(1);
    // Keyframes can't be expressed as an inline style object, so this
    // injects an actual <style> tag — the sweep runs 0%→sweepPct%, then
    // holds still (same background-position) for the rest of the cycle,
    // which is what reads as the "pause" before it repeats.
    const css = `
      @keyframes gradientShimmerSweep {
        0% { background-position: 160% 0; }
        ${sweepPct}% { background-position: -60% 0; }
        100% { background-position: -60% 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        .gradient-shimmer-text { animation: none !important; background-position: 50% 0 !important; }
      }
    `;
    return React.createElement(
      React.Fragment,
      null,
      React.createElement('style', { key: 'gradient-shimmer-style' }, css),
      React.createElement(
        'span',
        {
          className: 'gradient-shimmer-text',
          style: {
            display: 'block',
            fontFamily: style.fontFamily,
            fontSize: toPx(style.fontSize),
            letterSpacing: toPx(style.letterSpacing),
            lineHeight: toPx(style.lineHeight),
            textAlign: style.textAlign,
            backgroundImage: `linear-gradient(90deg, ${baseColor} 0%, ${baseColor} 40%, ${highlightColor} 50%, ${baseColor} 60%, ${baseColor} 100%)`,
            backgroundSize: '400% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            animation: `gradientShimmerSweep ${total}ms linear infinite`,
          },
        },
        children
      )
    );
  }

  return (
    <MaskedView maskElement={<Text style={style}>{children}</Text>}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: baseColor }]} />
        {width > 0 && (
          <Animated.View
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: bandWidth, transform: [{ translateX }] }}
          >
            <LinearGradient
              colors={[baseColor, highlightColor, baseColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
      </View>
    </MaskedView>
  );
}
