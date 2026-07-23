import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { ActivityStep, ChatMessage, ClarifyBlock } from '@/api/coder';
import { F } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

import { useCodeEditor } from '../CodeEditorProvider';
import { ActivityStream, LiveActivity } from './ActivityStream';
import { ClarifyBlockView } from './ClarifyBlock';
import { PulsingDot } from './PulsingDot';
import { TokenMeter } from './TokenMeter';

function MessageBubble({
  message,
  colors,
}: {
  message: ChatMessage;
  colors: ReturnType<typeof useAppTheme>;
}) {
  const isUser = message.role === 'user';
  const text = message.content || (message.streaming ? '…' : '');

  if (isUser) {
    return (
      <View style={[st.bubbleRow, st.bubbleRowUser]}>
        <LinearGradient
          colors={[
            colors.codeEditorUserBubbleFrom,
            colors.codeEditorUserBubbleTo,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[st.bubble, st.bubbleUser]}
        >
          <Text style={st.userText}>{text}</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={st.bubbleRow}>
      <View
        style={[
          st.bubble,
          st.bubbleAssistant,
          {
            backgroundColor: colors.codeEditorChatAssistantBg,
            borderColor: colors.codeEditorBorder,
          },
        ]}
      >
        <Text
          style={[
            st.assistantText,
            { color: colors.codeEditorChatAssistantText },
          ]}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

function MessageRow({
  message,
  colors,
}: {
  message: ChatMessage;
  colors: ReturnType<typeof useAppTheme>;
}) {
  return (
    <View>
      <MessageBubble message={message} colors={colors} />
      {message.activity && message.activity.length > 0 ? (
        <ActivityStream steps={message.activity} colors={colors} />
      ) : null}
    </View>
  );
}

function StatusBar({
  connected,
  busy,
  colors,
}: {
  connected: boolean;
  busy: boolean;
  colors: ReturnType<typeof useAppTheme>;
}) {
  return (
    <View style={[st.statusBar, { borderColor: colors.border }]}>
      <PulsingDot
        active={connected && busy}
        color={
          connected
            ? colors.codeEditorConnectedDot
            : colors.codeEditorDisconnectedDot
        }
        size={7}
      />
      <Text
        style={{ color: colors.textSub, fontSize: 11.5, fontFamily: F.sans600 }}
      >
        {connected ? (busy ? 'Agent is working…' : 'Connected') : 'Connecting…'}
      </Text>
    </View>
  );
}

function Composer({
  input,
  onChangeInput,
  onSend,
  disabled,
  colors,
}: {
  input: string;
  onChangeInput: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  colors: ReturnType<typeof useAppTheme>;
}) {
  return (
    <View style={[st.composer, { borderColor: colors.codeEditorGlassBorder }]}>
      <TextInput
        value={input}
        onChangeText={onChangeInput}
        placeholder="Ask the agent to change something…"
        placeholderTextColor={colors.codeEditorTextMuted}
        multiline
        style={[
          st.input,
          {
            color: colors.text,
            fontFamily: F.sans400,
            borderColor: colors.codeEditorGlassBorder,
            backgroundColor: colors.codeEditorActivityBg,
          },
        ]}
      />
      <TouchableOpacity
        onPress={onSend}
        disabled={disabled}
        style={disabled && st.sendBtnDisabled}
      >
        <LinearGradient
          colors={[
            colors.codeEditorUserBubbleFrom,
            colors.codeEditorUserBubbleTo,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={st.sendBtn}
        >
          <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function ChatFooter({
  activity,
  clarifyBlock,
  clarifyAnswers,
  colors,
  onSubmitClarify,
}: {
  activity: ActivityStep[];
  clarifyBlock: ClarifyBlock | null;
  clarifyAnswers: Record<string, string> | null;
  colors: ReturnType<typeof useAppTheme>;
  onSubmitClarify: (value: Record<string, string>) => void;
}) {
  return (
    <>
      <LiveActivity steps={activity} colors={colors} />
      {clarifyBlock ? (
        <ClarifyBlockView
          block={clarifyBlock}
          colors={colors}
          onSubmit={onSubmitClarify}
          answers={clarifyAnswers}
        />
      ) : null}
    </>
  );
}

function EmptyState({ colors }: { colors: ReturnType<typeof useAppTheme> }) {
  return (
    <View style={st.empty}>
      <Ionicons name="sparkles-outline" size={32} color={colors.textMuted} />
      <Text
        style={{
          color: colors.textSub,
          marginTop: 10,
          textAlign: 'center',
          paddingHorizontal: 24,
        }}
      >
        Your build is starting — the agent will walk through it here.
      </Text>
    </View>
  );
}

export function ChatPanel() {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const {
    connected,
    busy,
    messages,
    activity,
    tokens,
    clarifyBlock,
    clarifyAnswers,
    send,
    answerClarify,
  } = useCodeEditor();

  const [input, setInput] = React.useState('');
  const listRef = React.useRef<ScrollView>(null);

  // Bottom-anchored, like iMessage/most chat UIs — follows new content as it
  // streams in, not just on a brand new message (a turn with many activity
  // steps would otherwise leave the view stuck wherever it last was while
  // the feed grows well past the fold).
  React.useEffect(() => {
    if (messages.length || activity.length)
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: true })
      );
  }, [messages.length, activity.length]);

  function handleSend() {
    const text = input.trim();
    if (!text || !connected || busy) return;
    send(text);
    setInput('');
  }

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <StatusBar connected={connected} busy={busy} colors={t} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={listRef}
          style={st.list}
          contentContainerStyle={st.listContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <EmptyState colors={t} />
          ) : (
            messages.map((item, i) => (
              <MessageRow key={i} message={item} colors={t} />
            ))
          )}
          <ChatFooter
            activity={activity}
            clarifyBlock={clarifyBlock}
            clarifyAnswers={clarifyAnswers}
            colors={t}
            onSubmitClarify={answerClarify}
          />
        </ScrollView>

        <TokenMeter tokens={tokens} colors={t} />

        <Composer
          input={input}
          onChangeInput={setInput}
          onSend={handleSend}
          disabled={!connected || busy || !input.trim()}
          colors={t}
        />
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
  list: { flex: 1 },
  listContent: { paddingVertical: 14 },
  bubbleRow: {
    paddingHorizontal: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  bubbleRowUser: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '86%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAssistant: {
    borderWidth: 1,
    borderTopLeftRadius: 4,
    overflow: 'hidden',
  },
  bubbleUser: {
    borderTopRightRadius: 4,
  },
  assistantText: {
    fontFamily: F.sans400,
    fontSize: 14.5,
    lineHeight: 21,
  },
  userText: {
    fontFamily: F.sans400,
    fontSize: 14.5,
    lineHeight: 21,
    color: '#FFFFFF',
  },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 110,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
