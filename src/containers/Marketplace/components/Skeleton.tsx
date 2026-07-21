import * as React from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

import type { AppColors } from '@/lib/theme';

type Props = {
  t: AppColors;
  width?: number | `${number}%`;
  /** Omit when `style` sets a size itself (e.g. aspectRatio). */
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Pulsing placeholder block — same base/highlight pair used everywhere a
 * skeleton stands in for text, an image, or a pill while data loads. */
export function Skeleton({ t, width = '100%', height, borderRadius = 6, style }: Props) {
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

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: t.templatesSkeletonBase, opacity },
        style,
      ]}
    />
  );
}
