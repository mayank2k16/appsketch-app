import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { AppColors } from '@/lib/theme';

export function VideoListItem({
  title,
  duration,
  active,
  t,
  onPress,
}: {
  title: string;
  duration: string;
  active: boolean;
  t: AppColors;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        st.row,
        { backgroundColor: t.card, borderColor: active ? t.accent : t.border },
        active && st.rowActive,
      ]}
    >
      <View style={[st.thumb, { backgroundColor: t.agentTabBg }]}>
        <Ionicons name="videocam" size={18} color={t.textMuted} />
        <View style={st.durationBadge}>
          <Text style={st.durationText}>{duration}</Text>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[st.title, { color: t.text }]} numberOfLines={2}>
          {title}
        </Text>
        <View style={st.playRow}>
          <Ionicons name="play-circle" size={14} color={t.accent} />
          <Text style={[st.playText, { color: t.accent }]}>Play video</Text>
        </View>
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  rowActive: { borderWidth: 1.5 },
  thumb: {
    width: 96,
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  durationText: { color: '#fff', fontSize: 9.5, fontWeight: '700' },
  title: { fontSize: 13, fontWeight: '600', lineHeight: 17, marginBottom: 4 },
  playRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  playText: { fontSize: 12, fontWeight: '700' },
});
