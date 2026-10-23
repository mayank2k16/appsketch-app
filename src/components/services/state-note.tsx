import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import type { ServicesPalette } from './palette';

/** Loading / error / empty block: one line, an optional note and action. */
export function StateNote({
  s,
  title,
  note,
  action,
  onAction,
  loading,
}: {
  s: ServicesPalette;
  title?: string;
  note?: string;
  action?: string;
  onAction?: () => void;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <View style={st.wrap}>
        <ActivityIndicator color={s.orange} />
      </View>
    );
  }
  return (
    <View style={[st.wrap, { backgroundColor: s.inset }]}>
      {title ? (
        <Text style={[st.title, { color: s.text }]}>{title}</Text>
      ) : null}
      {note ? <Text style={[st.note, { color: s.sub }]}>{note}</Text> : null}
      {action && onAction ? (
        <PressableScale
          onPress={onAction}
          style={[
            st.btn,
            { borderColor: s.hairline, backgroundColor: s.raised },
          ]}
        >
          <Text style={[st.btnText, { color: s.text }]}>{action}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  title: { fontFamily: F.sans700, fontSize: 14, textAlign: 'center' },
  note: {
    fontFamily: F.sans400,
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: 'center',
  },
  btn: {
    marginTop: 6,
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontFamily: F.sans600, fontSize: 13 },
});
