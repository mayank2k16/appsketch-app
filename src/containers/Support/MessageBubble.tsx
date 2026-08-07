import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { SupportMessage } from '@/api/support';
import { clockTime } from '@/containers/CMS/Support/utils';
import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

type Props = {
  t: AppColors;
  message: SupportMessage;
};

/** Pick an icon from the file extension so a PDF doesn't look like a
 * spreadsheet in the bubble. Falls back to a generic document. */
function fileIcon(name?: string): React.ComponentProps<typeof Ionicons>['name'] {
  const ext = (name || '').split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'document-text';
  if (['xls', 'xlsx', 'csv', 'numbers'].includes(ext)) return 'grid';
  if (['doc', 'docx', 'pages', 'rtf', 'txt'].includes(ext)) return 'document';
  if (['ppt', 'pptx', 'key'].includes(ext)) return 'easel';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'file-tray-full';
  return 'document-attach';
}

// Customer-side mirror of CMS's MessageBubble — "mine" is CUSTOMER here,
// not ADMIN, and colors come from the app's own theme rather than the CMS one.
export function MessageBubble({ t, message }: Props) {
  if (message.sender_type === 'SYSTEM') {
    return (
      <View style={st.systemRow}>
        <Text style={[st.systemText, { color: t.textSub }]}>{message.text}</Text>
      </View>
    );
  }

  const mine = message.sender_type === 'CUSTOMER';
  const open = () => message.attachment_url && Linking.openURL(message.attachment_url);

  return (
    <View style={[st.row, mine ? st.rowMine : st.rowTheirs]}>
      <View
        style={[
          st.bubble,
          mine
            ? { backgroundColor: t.accent, borderColor: t.accent }
            : { backgroundColor: t.surface, borderColor: t.border },
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
          <Pressable
            onPress={open}
            style={[
              st.fileChip,
              { borderColor: mine ? 'rgba(255,255,255,0.45)' : t.border },
            ]}
          >
            <Ionicons
              name={fileIcon(message.attachment_name)}
              size={20}
              color={mine ? '#FFFFFF' : t.accent}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[st.fileName, { color: mine ? '#FFFFFF' : t.text }]}
                numberOfLines={2}
              >
                {message.attachment_name || 'Attachment'}
              </Text>
              <Text
                style={[st.fileHint, { color: mine ? 'rgba(255,255,255,0.75)' : t.textSub }]}
              >
                Tap to open
              </Text>
            </View>
          </Pressable>
        ) : null}

        {message.text ? (
          <Text style={{ color: mine ? '#FFFFFF' : t.text, fontFamily: F.sans400, fontSize: 14, lineHeight: 19 }}>
            {message.text}
          </Text>
        ) : null}

        <View style={st.metaRow}>
          {message._pending ? (
            <Text style={[st.metaText, { color: mine ? 'rgba(255,255,255,0.75)' : t.textSub }]}>sending…</Text>
          ) : null}
          {message._failed ? <Text style={[st.metaText, { color: '#EF4444' }]}>failed</Text> : null}
          <Text style={[st.metaText, { color: mine ? 'rgba(255,255,255,0.75)' : t.textSub }]}>
            {clockTime(message.created_on)}
          </Text>
          {mine && !message._pending && !message._failed ? (
            <Text style={[st.metaText, { color: 'rgba(255,255,255,0.75)' }]}>{message.read ? '✓✓' : '✓'}</Text>
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
  systemText: { fontFamily: F.sans400, fontSize: 11.5, fontStyle: 'italic', textAlign: 'center' },
  row: { paddingHorizontal: 16, marginBottom: 8 },
  rowMine: { alignItems: 'flex-end' },
  rowTheirs: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', borderWidth: 1, borderRadius: 14, padding: 10, gap: 6 },
  media: { width: 220, height: 160, borderRadius: 10 },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    minWidth: 190,
  },
  fileName: { fontFamily: F.sans600, fontSize: 13 },
  fileHint: { fontFamily: F.sans400, fontSize: 11, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'flex-end' },
  metaText: { fontFamily: F.sans500, fontSize: 10.5 },
});
