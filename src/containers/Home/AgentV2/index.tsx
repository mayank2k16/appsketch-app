import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '@/lib/theme';

const RADIUS = 26;
const BORDER_W = 1.5;

export function AgentV2({
  onAttachPress,
  onSendPress,
}: {
  onAttachPress?: () => void;
  onSendPress?: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);

  return (
    <View style={s.wrap}>
      <View
        style={[
          s.shadowWrap,
          Platform.select({
            ios: { shadowColor: t.agentGlowBlue },
            default: {},
          }),
        ]}
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
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
    paddingVertical: 40,
  },
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

export default AgentV2;
