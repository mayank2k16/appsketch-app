import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  t: AppColors;
  /** Name of the locked model that triggered this, shown in the body copy. */
  modelLabel?: string;
  /** Overrides the default model-lock copy for other triggers (domain, token limit). */
  body?: string;
};

const UPGRADE_URL = 'https://appsketch.ai/pricing';

// There is no in-app purchase flow — plans and domains are bought on the
// web (appsketch.ai/pricing) and the app picks up the new plan/tokens the
// next time the same phone number signs in. This sheet just hands off to a
// browser instead of a checkout screen.
export function UpgradeSheet({ visible, onClose, t, modelLabel, body }: Props) {
  const message =
    body ?? (modelLabel ? `${modelLabel} is available on paid plans. Upgrade to unlock every AI model.` : 'Upgrade your plan to continue.');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: t.sheetBg, borderColor: t.agentInputBorder }]}>
          <View style={[s.iconWrap, { backgroundColor: `${t.accent}1A` }]}>
            <Ionicons name="lock-closed" size={22} color={t.accent} />
          </View>
          <Text style={[s.title, { color: t.text }]}>Upgrade your plan</Text>
          <Text style={[s.body, { color: t.textSub }]}>{message}</Text>
          <Text style={[s.hint, { color: t.textSub }]}>
            Upgrade from a browser, then sign in here with the same phone number — it unlocks instantly.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              onClose();
              Linking.openURL(UPGRADE_URL);
            }}
            style={[s.cta, { backgroundColor: t.accent }]}
          >
            <Text style={s.ctaText}>Upgrade in Browser</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={s.dismiss}>
            <Text style={[s.dismissText, { color: t.textSub }]}>Not now</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 22,
    paddingBottom: 36,
    alignItems: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: F.sans700,
    fontSize: 17,
    marginBottom: 6,
  },
  body: {
    fontFamily: F.sans400,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontFamily: F.sans400,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.85,
  },
  cta: {
    alignSelf: 'stretch',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: F.sans700,
    fontSize: 14.5,
    color: '#FFFFFF',
  },
  dismiss: {
    paddingVertical: 14,
  },
  dismissText: {
    fontFamily: F.sans600,
    fontSize: 13,
  },
});
