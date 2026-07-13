import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import type { AppColors } from '@/lib/theme';

import { PROMPT_BORDER_W, PROMPT_CARD_RADIUS, type Rect } from './orbits';

/**
 * PromptBar — the floating "Ask anything..." card over the CipherField.
 *
 * The card itself just has a plain neutral border. The "border lights up as
 * the glow passes" look isn't drawn here at all — it's `CipherField`'s soft
 * glow orbs (built from this card's own measured rect, see `onCardLayout`)
 * naturally bleeding their halo into the area around the edge as they orbit
 * past, the same way the reference's ambient glow works.
 *
 * For this pass the input and buttons are static: no submit wiring, no mode
 * picker. The middle spacer in the button row is intentional — a future
 * Normal/DeepThink/Research row will sit ABOVE this one (not inline with it),
 * so the spacer just keeps + and send pinned to the card edges like the
 * reference and needs no relayout when that row is added.
 */
const RADIUS = PROMPT_CARD_RADIUS;
const BORDER_W = PROMPT_BORDER_W;

type Props = {
  t: AppColors;
  onCardLayout: (rect: Rect) => void;
  onAttachPress?: () => void;
  onSendPress?: () => void;
};

export function PromptBar({ t, onCardLayout, onAttachPress, onSendPress }: Props) {
  function handleLayout(e: LayoutChangeEvent) {
    const { x, y, width, height } = e.nativeEvent.layout;
    onCardLayout({ x, y, width, height });
  }

  return (
    <View
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
