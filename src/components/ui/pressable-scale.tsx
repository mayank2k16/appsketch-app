import * as Haptics from 'expo-haptics';
import * as React from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Platform, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING = { damping: 18, stiffness: 420, mass: 0.6 };

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Scale while held. 0.96 for buttons, ~0.98 for big cards. */
  scaleTo?: number;
  /** Light tap on press-in. Off for rapid-fire controls (steppers, keys). */
  haptic?: boolean;
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
        if (haptic && Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {}
          );
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING);
        onPressOut?.(e);
      }}
      style={[style, animated, disabled ? { opacity: 0.5 } : null]}
    >
      {children}
    </AnimatedPressable>
  );
}
