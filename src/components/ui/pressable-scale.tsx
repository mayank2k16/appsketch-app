import * as React from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { haptic as hapticFx, type HapticKind } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING = { damping: 18, stiffness: 420, mass: 0.6 };

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Scale while held. 0.96 for buttons, ~0.98 for big cards. */
  scaleTo?: number;
  /** Haptic on press-in: true = a light tap, or a kind from
   *  `@/lib/haptics` ('press' for a screen's primary action). False for
   *  rapid-fire controls (steppers, keys). */
  haptic?: boolean | HapticKind;
  /** Opacity while disabled; 1 keeps a read-only control looking as is. */
  disabledOpacity?: number;
};

/**
 * The app's press feedback (docs/white-theme.md): a spring scale-down plus a
 * light haptic, so every CTA answers the finger. Use it instead of
 * TouchableOpacity for anything tappable. No shadow, no colour change — the
 * motion is the feedback, which keeps the white theme flat.
 */
export function PressableScale({
  scaleTo = 0.96,
  haptic = true,
  disabledOpacity = 0.5,
  disabled,
  onPressIn,
  onPressOut,
  style,
  children,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityRole={rest.accessibilityRole ?? 'button'}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, SPRING);
        if (haptic) hapticFx[haptic === true ? 'tap' : haptic]();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING);
        onPressOut?.(e);
      }}
      style={[style, animated, disabled ? { opacity: disabledOpacity } : null]}
    >
      {children}
    </AnimatedPressable>
  );
}
