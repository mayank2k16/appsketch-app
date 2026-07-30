import * as React from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

import type { CmsThemeColors } from '../../theme';

type Props = {
  colors: CmsThemeColors;
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Pulsing placeholder block standing in for text/values/charts while
 * analytics data loads. Mirrors the base/highlight pulse pattern from
 * `Marketplace`'s `Skeleton`, re-implemented against `CmsThemeColors` since
 * the CMS shell doesn't share the app-wide theme's color tokens. */
export function Skeleton({ colors, width = '100%', height, borderRadius = 6, style }: Props) {
  const pulse = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: colors.border, opacity }, style]} />
  );
}
