import * as React from 'react';
import {
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { inr } from './format';

const AnimatedInput = Animated.createAnimatedComponent(TextInput);

/**
 * A rupee amount that counts to its new value on the UI thread (no React
 * render per frame): a read-only TextInput whose `text` prop is animated.
 */
export function AnimatedTotal({
  value,
  suffix = '',
  style,
}: {
  value: number;
  suffix?: string;
  style?: StyleProp<TextStyle>;
}) {
  const v = useSharedValue(value);
  React.useEffect(() => {
    v.value = withTiming(value, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, v]);
  const props = useAnimatedProps(() => {
    const text = `${inr(v.value)}${suffix}`;
    return { text, defaultValue: text } as never;
  });
  return (
    <AnimatedInput
      editable={false}
      pointerEvents="none"
      underlineColorAndroid="transparent"
      defaultValue={`${inr(value)}${suffix}`}
      animatedProps={props}
      style={[st.input, style]}
    />
  );
}

const st = StyleSheet.create({ input: { padding: 0, margin: 0 } });
