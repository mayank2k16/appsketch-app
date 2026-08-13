import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  t: AppColors;
  /** Name of the locked model that triggered this, shown in the body copy. */
  modelLabel?: string;
};

// Mobile's equivalent of the web's `UpgradeModal.jsx` — shown when a
// free-tier user taps a locked (paid) model in the picker. Pushes to the
// existing full-screen `/pricing` route rather than duplicating its plan
// cards here.
export function UpgradeSheet({ visible, onClose, t, modelLabel }: Props) {
  const router = useRouter();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: t.sheetBg, borderColor: t.agentInputBorder }]}>
          <View style={[s.iconWrap, { backgroundColor: `${t.accent}1A` }]}>
            <Ionicons name="lock-closed" size={22} color={t.accent} />
          </View>
          <Text style={[s.title, { color: t.text }]}>Upgrade your plan</Text>
          <Text style={[s.body, { color: t.textSub }]}>
            {modelLabel ? `${modelLabel} is` : 'This model is'} available on paid plans. Upgrade to unlock
            every AI model.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              onClose();
              router.push('/pricing' as never);
            }}
            style={[s.cta, { backgroundColor: t.accent }]}
          >
            <Text style={s.ctaText}>View Plans</Text>
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
    marginBottom: 20,
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
