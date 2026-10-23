import * as React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { TenantSummary } from '@/api/studio';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import { AppPicker } from './app-picker';
import type { ServicesPalette } from './palette';

/** A native page sheet with "My apps" — picks the app a domain serves. */
export function AppSheet({
  s,
  open,
  title,
  value,
  onClose,
  onPick,
}: {
  s: ServicesPalette;
  open: boolean;
  title: string;
  value: number | string | null;
  onClose: () => void;
  onPick: (app: TenantSummary) => void;
}) {
  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[st.root, { backgroundColor: s.canvas }]}>
        <View style={st.head}>
          <Text style={[st.title, { color: s.text }]}>{title}</Text>
          <PressableScale onPress={onClose} hitSlop={10}>
            <Text style={[st.done, { color: s.text }]}>Done</Text>
          </PressableScale>
        </View>
        <ScrollView contentContainerStyle={st.body}>
          <AppPicker s={s} value={value} onChange={onPick} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },
  title: { fontFamily: F.sans700, fontSize: 17 },
  done: { fontFamily: F.sans600, fontSize: 15 },
  body: { padding: 16, paddingBottom: 40 },
});
