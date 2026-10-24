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

import { foreign, inr } from './format';

const AnimatedInput = Animated.createAnimatedComponent(TextInput);

/** INR in, the display currency out (rate 1 + ₹ = plain rupees). */
function show(n: number, rate: number, symbol: string): string {
  'worklet';
  return symbol === '₹'
    ? inr(n)
    : foreign(Math.round(n * rate * 100) / 100, symbol);
}

/**
 * A rupee amount (shown converted when `rate`/`symbol` say so) that counts to its new value on the UI thread (no React
 * render per frame): a read-only TextInput whose `text` prop is animated.
 */
export function AnimatedTotal({
  value,
  suffix = '',
  rate = 1,
  symbol = '₹',
  style,
}: {
  value: number;
  suffix?: string;
  rate?: number;
  symbol?: string;
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
    const text = `${show(v.value, rate, symbol)}${suffix}`;
    return { text, defaultValue: text } as never;
  });
  return (
    <AnimatedInput
      editable={false}
      pointerEvents="none"
      underlineColorAndroid="transparent"
      defaultValue={`${show(value, rate, symbol)}${suffix}`}
      animatedProps={props}
      style={[st.input, style]}
    />
  );
}

const st = StyleSheet.create({ input: { padding: 0, margin: 0 } });
