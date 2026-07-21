import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { ChatMessage } from '@/api/coder';
import { useAppTheme } from '@/lib/theme';

import { useCodeEditor } from '../CodeEditorProvider';
import { ActivityStream } from './ActivityStream';
import { ClarifyBlockView } from './ClarifyBlock';

function MessageBubble({ message, colors }: { message: ChatMessage; colors: ReturnType<typeof useAppTheme> }) {
  const isUser = message.role === 'user';
  return (
    <View style={[st.bubbleRow, isUser && st.bubbleRowUser]}>
      <View
        style={[
          st.bubble,
          isUser
            ? { backgroundColor: colors.codeEditorChatUserBg, borderTopRightRadius: 4 }
            : {
                backgroundColor: colors.codeEditorChatAssistantBg,
                borderColor: colors.codeEditorBorder,
                borderWidth: 1,
                borderTopLeftRadius: 4,
              },
        ]}
      >
        <Text style={{ color: isUser ? colors.codeEditorChatUserText : colors.codeEditorChatAssistantText, fontSize: 14, lineHeight: 20 }}>
          {message.content || (message.streaming ? '…' : '')}
        </Text>
      </View>
    </View>
  );
}

export function ChatPanel() {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const { connected, busy, messages, activity, clarifyBlock, send, answerClarify } = useCodeEditor();

  const [input, setInput] = React.useState('');
  const listRef = React.useRef<FlashList<ChatMessage>>(null);

  React.useEffect(() => {
    if (messages.length) requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length]);

  function handleSend() {
    const text = input.trim();
    if (!text || !connected || busy) return;
    send(text);
    setInput('');
  }

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <View style={[st.statusBar, { borderColor: t.border }]}>
        <View style={[st.dot, { backgroundColor: connected ? t.codeEditorConnectedDot : t.codeEditorDisconnectedDot }]} />
        <Text style={{ color: t.textSub, fontSize: 11.5, fontWeight: '600' }}>
          {connected ? (busy ? 'Agent is working…' : 'Connected') : 'Connecting…'}
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlashList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <MessageBubble message={item} colors={t} />}
          estimatedItemSize={80}
          contentContainerStyle={st.listContent}
          ListFooterComponent={
            <>
              <ActivityStream steps={activity} colors={t} />
              {clarifyBlock ? <ClarifyBlockView block={clarifyBlock} colors={t} onSubmit={answerClarify} /> : null}
            </>
          }
          ListEmptyComponent={
            <View style={st.empty}>
              <Ionicons name="sparkles-outline" size={32} color={t.textMuted} />
              <Text style={{ color: t.textSub, marginTop: 10, textAlign: 'center', paddingHorizontal: 24 }}>
                Your build is starting — the agent will walk through it here.
              </Text>
            </View>
          }
        />

        <View style={[st.composer, { borderColor: t.border, backgroundColor: t.bg }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask the agent to change something…"
            placeholderTextColor={t.codeEditorTextMuted}
            multiline
            style={[st.input, { color: t.text, borderColor: t.codeEditorBorder, backgroundColor: t.codeEditorSurface }]}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!connected || busy || !input.trim()}
            style={[
              st.sendBtn,
              { backgroundColor: t.accent },
              (!connected || busy || !input.trim()) && st.sendBtnDisabled,
            ]}
          >
            <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  listContent: { paddingVertical: 14 },
  bubbleRow: { paddingHorizontal: 14, marginBottom: 10, alignItems: 'flex-start' },
  bubbleRowUser: { alignItems: 'flex-end' },
  bubble: { maxWidth: '86%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, maxHeight: 110 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
