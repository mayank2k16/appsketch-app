import * as React from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

/** A solid dot with an expanding-ring "radar ping" behind it — the live
 * indicator for "this is happening right now" (status bar connection dot,
 * timeline's active step). Pure `Animated` (opacity + scale, native driver)
 * rather than reanimated, matching the loop pattern already used by
 * `Marketplace/components/Skeleton.tsx`. */
export function PulsingDot({
  color,
  size = 8,
  active = true,
}: {
  color: string;
  size?: number;
  active?: boolean;
}) {
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!active) return undefined;
    progress.setValue(0);
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [active, progress]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.4],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.55, 0.15, 0],
  });

  return (
    <View style={[st.wrap, { width: size, height: size }]}>
      {active ? (
        <Animated.View
          pointerEvents="none"
          style={[
            st.ring,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
              opacity,
              transform: [{ scale }],
            },
          ]}
        />
      ) : null}
      <View
        style={[
          st.core,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
  core: {},
});
