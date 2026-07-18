import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { SupportMessage } from '@/api/support';

import type { CmsThemeColors } from '../../theme';
import { clockTime } from '../utils';

type Props = {
  colors: CmsThemeColors;
  message: SupportMessage;
};

export function MessageBubble({ colors, message }: Props) {
  if (message.sender_type === 'SYSTEM') {
    return (
      <View style={st.systemRow}>
        <Text style={[st.systemText, { color: colors.textSecondary }]}>{message.text}</Text>
      </View>
    );
  }

  const mine = message.sender_type === 'ADMIN';
  const open = () => message.attachment_url && Linking.openURL(message.attachment_url);

  return (
    <View style={[st.row, mine ? st.rowMine : st.rowTheirs]}>
      <View
        style={[
          st.bubble,
          mine
            ? { backgroundColor: colors.accent, borderColor: colors.accent }
            : { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {message.message_type === 'IMAGE' && message.attachment_url ? (
          <Pressable onPress={open}>
            <Image source={{ uri: message.attachment_url }} style={st.media} contentFit="cover" />
          </Pressable>
        ) : null}

        {message.message_type === 'VIDEO' && message.attachment_url ? (
          <VideoBubble uri={message.attachment_url} />
        ) : null}

        {message.message_type === 'FILE' && message.attachment_url ? (
          <Pressable onPress={open} style={[st.fileChip, { borderColor: mine ? colors.accentText : colors.border }]}>
            <Text style={{ color: mine ? colors.accentText : colors.textPrimary, fontSize: 12.5 }} numberOfLines={1}>
              📎 {message.attachment_name || 'Attachment'}
            </Text>
          </Pressable>
        ) : null}

        {message.text ? (
          <Text style={{ color: mine ? colors.accentText : colors.textPrimary, fontSize: 14, lineHeight: 19 }}>
            {message.text}
          </Text>
        ) : null}

        <View style={st.metaRow}>
          {message._pending ? <Text style={[st.metaText, { color: mine ? colors.accentText : colors.textSecondary }]}>sending…</Text> : null}
          {message._failed ? <Text style={[st.metaText, { color: colors.danger }]}>failed</Text> : null}
          <Text style={[st.metaText, { color: mine ? colors.accentText : colors.textSecondary }]}>
            {clockTime(message.created_on)}
          </Text>
          {mine && !message._pending && !message._failed ? (
            <Text style={[st.metaText, { color: colors.accentText }]}>{message.read ? '✓✓' : '✓'}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function VideoBubble({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  return <VideoView player={player} style={st.media} allowsFullscreen nativeControls />;
}

const st = StyleSheet.create({
  systemRow: { alignItems: 'center', marginVertical: 6, paddingHorizontal: 16 },
  systemText: { fontSize: 11.5, fontStyle: 'italic' },
  row: { paddingHorizontal: 16, marginBottom: 8 },
  rowMine: { alignItems: 'flex-end' },
  rowTheirs: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', borderWidth: 1, borderRadius: 14, padding: 10, gap: 6 },
  media: { width: 220, height: 160, borderRadius: 10 },
  fileChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, alignSelf: 'flex-start' },
  metaRow: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'flex-end' },
  metaText: { fontSize: 10.5 },
});
