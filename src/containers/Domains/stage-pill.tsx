import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { DomainView } from '@/api/app-domains';
import { type ServicesPalette, tint } from '@/components/services';
import { F } from '@/lib/fonts';

import { stageLabel, stageTone } from './stage';

export function StagePill({ s, d }: { s: ServicesPalette; d: DomainView }) {
  const c = stageTone(d.stage, s);
  return (
    <View style={[st.pill, { backgroundColor: tint(c, 0.1) }]}>
      <View style={[st.dot, { backgroundColor: c }]} />
      <Text style={[st.text, { color: c }]} numberOfLines={1}>
        {stageLabel(d)}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontFamily: F.sans700, fontSize: 11 },
});
