import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

/** Sticky, non-dismissing status strip anchored right above the composer —
 * unlike a toast, it stays on screen for as long as the condition holds
 * (agent waiting on the user, connection dropped, etc.) so the state is
 * never missed just because the user glanced away or scrolled the chat. */
export function StatusBanner({
  icon,
  text,
  tone = 'accent',
  colors,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
  tone?: 'accent' | 'danger';
  colors: AppColors;
}) {
  const tint = tone === 'danger' ? colors.codeEditorDanger : colors.accent;

  return (
    <View
      style={[st.wrap, { backgroundColor: `${tint}18`, borderColor: `${tint}40` }]}
    >
      <Ionicons name={icon} size={14} color={tint} />
      <Text style={[st.text, { color: tint }]} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: {
    flex: 1,
    fontFamily: F.sans600,
    fontSize: 12.5,
    lineHeight: 17,
  },
});
