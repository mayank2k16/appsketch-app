import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import type { AppColors } from '@/lib/theme';

import { PROMPT_BORDER_W, PROMPT_CARD_RADIUS, type Rect as RectType } from './orbits';

/**
 * PromptBar — the floating "Ask anything..." card over the CipherField.
 *
 * Previously had a travelling rim-light border (an SVG rect animated via
 * `Animated.createAnimatedComponent(Rect)` with `strokeDashoffset`). That
 * combination doesn't bridge correctly through react-native-svg's Animated
 * interop under Fabric on this device — every commit threw
 * `react_native_expect failure: value.hasType<std::vector<RawValue>>()`,
 * which was destabilizing the whole screen (multi-second/full freezes, taps
 * and navigation stalling app-wide). Removed until it can be rebuilt on
 * react-native-reanimated (already used successfully elsewhere in this app),
 * whose worklets don't have this interop problem. Plain border for now.
 *
 * Only the attachment (+) and send buttons live in the control row — no mode
 * picker for this pass.
 */
const RADIUS = PROMPT_CARD_RADIUS;
const BORDER_W = PROMPT_BORDER_W;

type Props = {
  t: AppColors;
  onCardWindowRect: (rect: RectType) => void;
  onAttachPress?: () => void;
  onSendPress?: () => void;
};

export function PromptBar({ t, onCardWindowRect, onAttachPress, onSendPress }: Props) {
  const cardRef = React.useRef<View>(null);

  function handleLayout() {
    cardRef.current?.measureInWindow((x, y, w, h) => {
      onCardWindowRect({ x, y, width: w, height: h });
    });
  }

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
    minHeight: 80,
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
