import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { Animated, LayoutChangeEvent, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, FeGaussianBlur, Filter, Rect } from 'react-native-svg';

import type { AppColors } from '@/lib/theme';

import { PROMPT_BORDER_W, PROMPT_CARD_RADIUS, type Rect as RectType, roundedRectPerimeter } from './orbits';

/**
 * PromptBar — the floating "Ask anything..." card over the CipherField.
 *
 * The border carries a travelling rim-light cloned from the validated
 * prototype: a soft blurred glow arc plus a crisp light-tint core arc per
 * colour, each following the exact same clocks as the background orbs (see
 * `./orbits`) as a fraction of this card's own perimeter — so the lit segment
 * is always exactly under wherever each orb currently is. Orange starts at the
 * top; blue is offset half a lap so it tracks the blue orb.
 *
 * Only the attachment (+) and send buttons live in the control row — no mode
 * picker for this pass.
 */
const RADIUS = PROMPT_CARD_RADIUS;
const BORDER_W = PROMPT_BORDER_W;
const RIM_INSET = 1.25;
const RIM_DASH_FRACTION = 0.16;

// Rim tints, cloned from the prototype: soft blurred glow + brighter crisp core.
const RIM_GLOW_ORANGE = '#FF8A4D';
const RIM_GLOW_BLUE = '#5FA0FF';
const RIM_CORE_ORANGE = '#FFC79A';
const RIM_CORE_BLUE = '#BFDBFF';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type Props = {
  t: AppColors;
  onCardWindowRect: (rect: RectType) => void;
  orangeClock: Animated.Value;
  blueClock: Animated.Value;
  onAttachPress?: () => void;
  onSendPress?: () => void;
};

export function PromptBar({ t, onCardWindowRect, orangeClock, blueClock, onAttachPress, onSendPress }: Props) {
  const cardRef = React.useRef<View>(null);
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null);

  function handleLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
    cardRef.current?.measureInWindow((x, y, w, h) => {
      onCardWindowRect({ x, y, width: w, height: h });
    });
  }

  const rimW = size ? size.width - RIM_INSET * 2 : 0;
  const rimH = size ? size.height - RIM_INSET * 2 : 0;
  const rimR = Math.max(0, RADIUS - RIM_INSET);
  const perimeter = size ? roundedRectPerimeter(rimW, rimH, rimR) : 0;
  const dashLen = perimeter * RIM_DASH_FRACTION;
  const dashArray = `${dashLen} ${Math.max(perimeter - dashLen, 0)}`;

  // Orange tracks its orb from the top; blue's orb is half a lap ahead, so its
  // rim segment starts half the perimeter along.
  const orangeOffset = orangeClock.interpolate({ inputRange: [0, 1], outputRange: [0, -perimeter] });
  const blueOffset = blueClock.interpolate({
    inputRange: [0, 1],
    outputRange: [-perimeter * 0.5, -perimeter * 1.5],
  });

  const rimBase = { x: RIM_INSET, y: RIM_INSET, width: rimW, height: rimH, rx: rimR, ry: rimR, fill: 'none' as const, strokeLinecap: 'round' as const, strokeDasharray: dashArray };

  return (
    <View
      ref={cardRef}
      style={[
        s.shadowWrap,
        Platform.select({
          ios: { shadowColor: t.agentGlowBlue },
          default: {},
        }),
      ]}
      onLayout={handleLayout}
    >
      <View style={[s.card, { backgroundColor: t.agentInputBg, borderColor: t.agentInputBorder }]}>
        <TextInput
          placeholder="Ask anything..."
          placeholderTextColor={t.agentInputPlaceholder}
          editable
          multiline
          style={[s.input, { color: t.agentInputText }]}
        />

        <View style={s.row}>
          <TouchableOpacity
            onPress={onAttachPress}
            activeOpacity={0.7}
            style={[s.circleBtn, { backgroundColor: t.agentBtnBg, borderColor: t.agentBtnBorder }]}
          >
            <Ionicons name="add" size={20} color={t.agentBtnIcon} />
          </TouchableOpacity>

          {/* Reserved for the future Normal / DeepThink / Research row (added above this one) */}
          <View style={{ flex: 1 }} />

          <TouchableOpacity onPress={onSendPress} activeOpacity={0.8}>
            <LinearGradient
              colors={[...t.agentSendGradient] as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.sendBtn}
            >
              <Ionicons name="arrow-up" size={19} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {size ? (
        <Svg
          width={size.width}
          height={size.height}
          style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
        >
          <Defs>
            <Filter id="rimBlur" x="-60%" y="-60%" width="220%" height="220%">
              <FeGaussianBlur stdDeviation="3.2" />
            </Filter>
          </Defs>

          {/* Soft blurred glow (behind), then crisp core (in front) — glows first
              so the bright cores sit on top. */}
          <AnimatedRect
            {...rimBase} stroke={RIM_GLOW_ORANGE} strokeWidth={7} strokeOpacity={0.55}
            filter="url(#rimBlur)" strokeDashoffset={orangeOffset}
          />
          <AnimatedRect
            {...rimBase} stroke={RIM_GLOW_BLUE} strokeWidth={7} strokeOpacity={0.55}
            filter="url(#rimBlur)" strokeDashoffset={blueOffset}
          />
          <AnimatedRect
            {...rimBase} stroke={RIM_CORE_ORANGE} strokeWidth={2.5} strokeDashoffset={orangeOffset}
          />
          <AnimatedRect
            {...rimBase} stroke={RIM_CORE_BLUE} strokeWidth={2.5} strokeDashoffset={blueOffset}
          />
        </Svg>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  shadowWrap: {
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 22,
      },
      android: { elevation: 10 },
    }),
  },
  card: {
    borderRadius: RADIUS,
    borderWidth: BORDER_W,
    padding: 14,
    gap: 10,
  },
  input: {
    fontSize: 15,
    lineHeight: 20,
    minHeight: 22,
    maxHeight: 90,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
