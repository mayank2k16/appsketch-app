/**
 * MicButton — the composer's voice control, with a slow breathing halo.
 *
 * This is the one control in the composer row that opens a live, LISTENING
 * surface, so it is the one that advertises itself. Everything either side of
 * it is a static circle, which is what lets a single moving element read as
 * "this is the voice one" rather than as noise. Shared by both composers so
 * the pulse is literally the same animation in Home and the Agent tab.
 */
import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { type AppColors, BRAND_MID } from '@/lib/theme';

export function MicButton({
  t,
  onPress,
  size = 34,
  iconSize = 18,
}: {
  t: AppColors;
  onPress: () => void;
  size?: number;
  iconSize?: number;
}) {
  const pulse = useSharedValue(0);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    // Fades as it grows, so the ring dissipates outward instead of pumping
    // between two visible sizes.
    opacity: 0.35 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.45 }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        s.btn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: t.agentBtnBg,
          borderColor: t.agentBtnBorder,
        },
      ]}
    >
      <Reanimated.View
        pointerEvents="none"
        style={[
          s.halo,
          { borderRadius: size / 2, backgroundColor: BRAND_MID },
          haloStyle,
        ]}
      />
      <Ionicons name="mic-outline" size={iconSize} color={BRAND_MID} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sits BEHIND the glyph, so the pulse reads as the button breathing rather
  // than as a ring drawn on top of it.
  halo: {
    ...StyleSheet.absoluteFillObject,
  },
});
