import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { TokenUsage } from '@/api/coder';
import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

/** Live "tokens this turn" meter — sits between the message list and the
 * composer, matching the web workspace's `.cw-meter` position exactly.
 * Resets to 0/0 on every new user message ( see `useCoderSocket.send`). */
export function TokenMeter({
  tokens,
  colors,
}: {
  tokens: TokenUsage;
  colors: AppColors;
}) {
  if (tokens.in === 0 && tokens.out === 0) return null;

  const savedTokens = tokens.cached ? Math.round(tokens.cached * 0.75) : 0;

  return (
    <View style={[st.row, { borderColor: colors.border }]}>
      <View style={[st.chip, { backgroundColor: colors.codeEditorActivityBg }]}>
        <Text style={[st.chipText, { color: colors.codeEditorTokenIn }]}>
          ↑ {tokens.in.toLocaleString()}
        </Text>
      </View>
      <View style={[st.chip, { backgroundColor: colors.codeEditorActivityBg }]}>
        <Text style={[st.chipText, { color: colors.codeEditorTokenOut }]}>
          ↓ {tokens.out.toLocaleString()}
        </Text>
      </View>
      {savedTokens > 0 ? (
        <View
          style={[st.chip, { backgroundColor: colors.codeEditorTokenCachedBg }]}
        >
          <Text
            style={[st.chipText, { color: colors.codeEditorTokenCachedText }]}
          >
            ⚡ {savedTokens.toLocaleString()} saved
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  chip: {
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontFamily: F.sans600,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
});
