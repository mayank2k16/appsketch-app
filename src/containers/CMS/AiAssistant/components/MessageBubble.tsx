import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ChatMessage } from '@/api/ai-assistant';

import type { CmsThemeColors } from '../../theme';
import { AiChart } from './AiChart';
import { AiRichText } from './AiRichText';

type Props = {
  colors: CmsThemeColors;
  message: ChatMessage;
};

export function MessageBubble({ colors, message }: Props) {
  const isUser = message.role === 'user';
  return (
    <View style={[st.row, isUser && st.rowUser]}>
      <View
        style={[
          st.bubble,
          isUser
            ? { backgroundColor: colors.accent, borderColor: colors.accent }
            : { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {isUser ? (
          <Text style={{ color: colors.accentText, fontSize: 14, lineHeight: 20 }}>{message.content}</Text>
        ) : (
          <>
            <AiRichText colors={colors} content={message.content} textColor={colors.textPrimary} />
            {message.chart ? <AiChart colors={colors} spec={message.chart} /> : null}
          </>
        )}
        {message.streaming ? <Text style={{ color: colors.textSecondary }}>▋</Text> : null}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  row: { paddingHorizontal: 16, marginBottom: 10, alignItems: 'flex-start' },
  rowUser: { alignItems: 'flex-end' },
  bubble: { maxWidth: '85%', borderWidth: 1, borderRadius: 14, padding: 12 },
});
