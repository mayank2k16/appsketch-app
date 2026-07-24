import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { toast } from '@/lib/toast';

import { useCodeEditor } from '../CodeEditorProvider';
import { ActivityStream, LiveActivity } from './ActivityStream';
import { ClarifyBlockView } from './ClarifyBlock';
import { PulsingDot } from './PulsingDot';
import { TokenMeter } from './TokenMeter';

const MAX_IMAGES = 3;

function AgentAvatar({
  size,
  iconSize,
  colors,
}: {
  size: number;
  iconSize: number;
  colors: ReturnType<typeof useAppTheme>;
}) {
  return (
    <LinearGradient
      colors={[colors.codeEditorUserBubbleFrom, colors.codeEditorUserBubbleTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        st.avatar,
        { width: size, height: size, borderRadius: size * 0.3 },
      ]}
    >
      <Ionicons name="sparkles" size={iconSize} color="#FFFFFF" />
    </LinearGradient>
  );
}

function ChatHeader({
  connected,
  busy,
  colors,
  onClose,
}: {
  connected: boolean;
  busy: boolean;
  colors: ReturnType<typeof useAppTheme>;
  onClose: () => void;
}) {
  return (
    <View style={[st.header, { borderColor: colors.codeEditorBorder }]}>
      <AgentAvatar size={30} iconSize={15} colors={colors} />
      <View style={st.headerTitleRow}>
        <Text style={[st.headerTitle, { color: colors.text }]}>Agent</Text>
        <PulsingDot
          active={connected && busy}
          color={
            connected
              ? colors.codeEditorConnectedDot
              : colors.codeEditorDisconnectedDot
          }
          size={7}
        />
      </View>
      <TouchableOpacity
        onPress={onClose}
        hitSlop={8}
        style={[
          st.closeBtn,
          {
            backgroundColor: colors.codeEditorTabBg,
            borderColor: colors.codeEditorBorder,
          },
        ]}
      >
        <Ionicons name="close" size={15} color={colors.textSub} />
      </TouchableOpacity>
    </View>
  );
}

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
        style={[st.assistantCard, { borderColor: colors.codeEditorBorder, backgroundColor: colors.codeEditorActivityBg }]}
      >
        <View
          style={[
            st.assistantCardHeader,

          ]}
        >
          <AgentAvatar size={20} iconSize={11} colors={colors} />
          <Text style={[st.assistantName, { color: colors.text }]}>
            Agent
          </Text>
          <View style={{ flex: 1 }} />
          <View
            style={[
              st.aiBadge,
              {
                backgroundColor: colors.codeEditorToolChipActiveBg,
                borderColor: colors.codeEditorToolChipActiveBorder,
              },
            ]}
          >
            <Ionicons
              name="flash"
              size={9}
              color={colors.codeEditorToolChipActiveText}
            />
            <Text
              style={[
                st.aiBadgeText,
                { color: colors.codeEditorToolChipActiveText },
              ]}
            >
              AI Agent
            </Text>
          </View>
        </View>
        <View
          style={[
            st.assistantCardBody,
            // { backgroundColor: colors.codeEditorChatAssistantBg },
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

function Composer({
  input,
  onChangeInput,
  onSend,
  disabled,
  images,
  onAttach,
  onRemoveImage,
  colors,
}: {
  input: string;
  onChangeInput: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  images: string[];
  onAttach: () => void;
  onRemoveImage: (index: number) => void;
  colors: ReturnType<typeof useAppTheme>;
}) {
  return (
    <View
      style={[
        st.composerWrap,
        {
          backgroundColor: colors.codeEditorActivityBg,
          borderColor: colors.codeEditorGlassBorder,
        },
      ]}
    >
      <TextInput
        value={input}
        onChangeText={onChangeInput}
        placeholder="Ask the agent to change something…"
        placeholderTextColor={colors.codeEditorTextMuted}
        multiline
        style={[st.input, { color: colors.text, fontFamily: F.sans400 }]}
      />

      {images.length > 0 ? (
        <View style={st.thumbRow}>
          {images.map((uri, i) => (
            <View
              key={`${uri}-${i}`}
              style={[st.thumb, { borderColor: colors.codeEditorGlassBorder }]}
            >
              <Image source={{ uri }} style={st.thumbImg} contentFit="cover" />
              <Pressable
                onPress={() => onRemoveImage(i)}
                style={[st.thumbRemove, { backgroundColor: colors.codeEditorTabBg }]}
                hitSlop={6}
              >
                <Ionicons name="close" size={11} color={colors.textSub} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={st.composerRow}>
        <TouchableOpacity
          onPress={onAttach}
          activeOpacity={0.7}
          disabled={images.length >= MAX_IMAGES}
          style={[
            st.attachBtn,
            {
              backgroundColor: colors.codeEditorTabBg,
              borderColor: colors.codeEditorBorder,
            },
          ]}
        >
          <Ionicons name="attach" size={18} color={colors.textSub} />
          {images.length > 0 ? (
            <View style={[st.countBadge, { backgroundColor: colors.accent }]}>
              <Text style={st.countBadgeText}>{images.length}</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

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
  // Clarify (the agent asking the user something) always sits above the
  // live "Working…" activity — the currently-in-flight step is the most
  // recent thing happening, so it stays last, closest to the composer.
  return (
    <>
      {clarifyBlock ? (
        <ClarifyBlockView
          block={clarifyBlock}
          colors={colors}
          onSubmit={onSubmitClarify}
          answers={clarifyAnswers}
        />
      ) : null}
      <LiveActivity steps={activity} colors={colors} />
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
  const router = useRouter();
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
  const [images, setImages] = React.useState<string[]>([]);
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

  async function handleAttach() {
    if (images.length >= MAX_IMAGES) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      toast.error('Media library permission is required to attach images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;
    setImages((prev) =>
      [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_IMAGES)
    );
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSend() {
    const text = input.trim();
    if (!text || !connected || busy) return;
    send(text, images.length > 0 ? { images } : undefined);
    setInput('');
    setImages([]);
  }

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <ChatHeader
        connected={connected}
        busy={busy}
        colors={t}
        onClose={() => router.back()}
      />

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
          images={images}
          onAttach={handleAttach}
          onRemoveImage={removeImage}
          colors={t}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginHorizontal: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  headerTitle: {
    fontFamily: F.sans600,
    fontSize: 15,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  list: { flex: 1 },
  listContent: { paddingVertical: 14 },
  bubbleRow: {
    paddingHorizontal: 14,
    marginBottom: 18,
    alignItems: 'flex-start',
  },
  bubbleRowUser: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {},
  userText: {
    fontFamily: F.sans400,
    fontSize: 14.5,
    lineHeight: 21,
    color: '#FFFFFF',
  },

  assistantCard: {
    maxWidth: '92%',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  assistantCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  assistantName: {
    fontFamily: F.sans600,
    fontSize: 13,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aiBadgeText: {
    fontFamily: F.sans700,
    fontSize: 9.5,
  },
  assistantCardBody: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    // margin: 7,
    borderRadius: 20,
    paddingTop: 6
  },
  assistantText: {
    fontFamily: F.sans400,
    fontSize: 14.5,
    lineHeight: 21,
  },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },

  composerWrap: {
    margin: 10,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  input: {
    fontSize: 14.5,
    maxHeight: 110,
    paddingBottom: 8,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: F.sans700,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },

  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 10,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
