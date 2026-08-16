import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ActivityStep, ChatMessage, ClarifyBlock } from '@/api/coder';
import { GallerySheet } from '@/components/ui/GallerySheet';
import { ModelPickerModal } from '@/components/ui/ModelPickerModal';
import { UpgradeSheet } from '@/components/ui/UpgradeSheet';
import { DEFAULT_MODEL, fmtContext, MODELS } from '@/containers/Home/AgentV2';
import { F } from '@/lib/fonts';
import { useCoderQuota } from '@/lib/hooks/use-coder-quota';
import { useVoiceInput } from '@/lib/hooks/use-voice-input';
import { type useAppTheme, useCoderTheme } from '@/lib/theme';
import { toast } from '@/lib/toast';

import { useCodeEditor } from '../CodeEditorProvider';
import { ActivityStream, Lightbox, LiveActivity } from './ActivityStream';
import { ClarifyBlockView } from './ClarifyBlock';
import { PulsingDot } from './PulsingDot';
import { StatusBanner } from './StatusBanner';
import { ThinkingDots } from './ThinkingDots';
import { TokenMeter } from './TokenMeter';

const MAX_IMAGES = 3;
type Model = (typeof MODELS)[number];

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

/** Rename sheet. `Alert.prompt` would have been one line, but it is iOS-only —
 * on Android it silently renders a text-less alert with no input at all, which
 * is exactly the kind of half-working affordance this turn is meant to remove. */
function RenameModal({
  visible,
  initial,
  colors,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  initial: string;
  colors: ReturnType<typeof useAppTheme>;
  onClose: () => void;
  onSubmit: (next: string) => void;
}) {
  const [value, setValue] = React.useState(initial);
  // Re-seed each time it opens — otherwise a rename, a close, and a re-open
  // shows the stale draft rather than the name that is actually current.
  React.useEffect(() => {
    if (visible) setValue(initial);
  }, [visible, initial]);

  const trimmed = value.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={st.backdrop} onPress={onClose}>
        <Pressable
          style={[
            st.sheet,
            {
              backgroundColor: colors.sheetBg,
              borderColor: colors.codeEditorBorder,
            },
          ]}
        >
          <Text style={[st.sheetTitle, { color: colors.text }]}>
            Rename project
          </Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            autoFocus
            selectTextOnFocus
            placeholder="Project name"
            placeholderTextColor={colors.codeEditorTextMuted}
            style={[
              st.renameInput,
              {
                color: colors.text,
                backgroundColor: colors.codeEditorActivityBg,
                borderColor: colors.codeEditorBorder,
              },
            ]}
            returnKeyType="done"
            onSubmitEditing={() => trimmed && onSubmit(trimmed)}
          />
          <View style={st.sheetActions}>
            <TouchableOpacity onPress={onClose} style={st.sheetBtn} hitSlop={6}>
              <Text style={[st.sheetBtnText, { color: colors.textSub }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => trimmed && onSubmit(trimmed)}
              disabled={!trimmed}
              style={[st.sheetBtn, !trimmed && { opacity: 0.4 }]}
              hitSlop={6}
            >
              <Text style={[st.sheetBtnText, { color: colors.accent }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** The ⋮ menu from the design: Rename (pencil) and Delete (red trash). */
function WorkMenu({
  visible,
  colors,
  onClose,
  onRename,
  onDelete,
}: {
  visible: boolean;
  colors: ReturnType<typeof useAppTheme>;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={st.menuBackdrop} onPress={onClose}>
        <View
          style={[
            st.menu,
            {
              backgroundColor: colors.sheetBg,
              borderColor: colors.codeEditorBorder,
            },
          ]}
        >
          <TouchableOpacity
            style={st.menuRow}
            onPress={() => {
              onClose();
              onRename();
            }}
          >
            <Ionicons name="pencil-outline" size={16} color={colors.text} />
            <Text style={[st.menuText, { color: colors.text }]}>Rename</Text>
          </TouchableOpacity>
          <View
            style={[
              st.menuDivider,
              { backgroundColor: colors.codeEditorBorder },
            ]}
          />
          <TouchableOpacity
            style={st.menuRow}
            onPress={() => {
              onClose();
              onDelete();
            }}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={colors.codeEditorDanger}
            />
            <Text style={[st.menuText, { color: colors.codeEditorDanger }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

function ChatHeader({
  connected,
  busy,
  needsInput,
  title,
  colors,
  onClose,
  onMenu,
}: {
  connected: boolean;
  busy: boolean;
  needsInput: boolean;
  /** The agent-written project name — empty until it lands. */
  title: string;
  colors: ReturnType<typeof useAppTheme>;
  onClose: () => void;
  onMenu: () => void;
}) {
  const statusLabel = !connected
    ? 'Disconnected'
    : needsInput
      ? 'Waiting for your input'
      : busy
        ? 'Working…'
        : 'Idle';
  const dotColor = !connected
    ? colors.codeEditorDisconnectedDot
    : needsInput
      ? colors.accent
      : colors.codeEditorConnectedDot;

  return (
    <View style={[st.header, { borderColor: colors.codeEditorBorder }]}>
      <AgentAvatar size={30} iconSize={15} colors={colors} />
      <View style={{ flex: 1 }}>
        <View style={st.headerTitleRow}>
          {/* The heading is the agent's name for the work, not the word
           * "Agent" — until the naming call lands there is nothing better to
           * show, so it falls back rather than flashing an empty row. */}
          <Text
            style={[st.headerTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {title || 'Agent'}
          </Text>
          <PulsingDot
            active={connected && (busy || needsInput)}
            color={dotColor}
            size={7}
          />
        </View>
        <Text
          style={[
            st.headerStatus,
            { color: needsInput ? colors.accent : colors.textSub },
          ]}
        >
          {statusLabel}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onMenu}
        hitSlop={8}
        style={[
          st.closeBtn,
          {
            backgroundColor: colors.codeEditorTabBg,
            borderColor: colors.codeEditorBorder,
          },
        ]}
      >
        <Ionicons name="ellipsis-vertical" size={15} color={colors.textSub} />
      </TouchableOpacity>
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
  // Attachments the user sent with this prompt. The web draws them above the
  // bubble (`.cw-bubble-imgs`) and opens one in a lightbox on click; without
  // them the prompt reads as if no image was ever attached.
  const [zoom, setZoom] = React.useState<string | null>(null);
  const shots = message.images ?? [];

  if (isUser) {
    return (
      <View style={[st.bubbleRow, st.bubbleRowUser]}>
        <View style={st.userStack}>
          {shots.length > 0 ? (
            <View style={st.attachRow}>
              {shots.map((uri, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.85}
                  onPress={() => setZoom(uri)}
                  style={[st.attach, { borderColor: colors.codeEditorBorder }]}
                >
                  <Image
                    source={{ uri }}
                    style={st.attachImage}
                    contentFit="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          {text ? (
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
          ) : null}
        </View>
        <Lightbox uri={zoom} onClose={() => setZoom(null)} />
      </View>
    );
  }

  return (
    <View style={st.bubbleRow}>
      <View
        style={[
          st.assistantCard,
          {
            borderColor: colors.codeEditorBorder,
            backgroundColor: colors.codeEditorActivityBg,
          },
        ]}
      >
        <View style={[st.assistantCardHeader]}>
          <AgentAvatar size={20} iconSize={11} colors={colors} />
          <Text style={[st.assistantName, { color: colors.text }]}>Agent</Text>
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
  bottomInset,
  model,
  onModelChange,
  allowedModels,
  onLockedModelPress,
}: {
  input: string;
  onChangeInput: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  images: string[];
  onAttach: () => void;
  onRemoveImage: (index: number) => void;
  colors: ReturnType<typeof useAppTheme>;
  /** Home-indicator clearance — the composer sat flush against it before. */
  bottomInset: number;
  model: string;
  onModelChange: (value: string) => void;
  /** `null` fails open — see `useCoderQuota`. */
  allowedModels: string[] | null;
  onLockedModelPress: (m: Model) => void;
}) {
  const voice = useVoiceInput(input, onChangeInput);
  const [modelPickerOpen, setModelPickerOpen] = React.useState(false);
  const selectedModel = MODELS.find((m) => m.value === model) ?? MODELS[0];

  // Mic pulses while listening — same affordance as the Home/Agent composer.
  const micPulse = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    if (!voice.listening) {
      micPulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulse, {
          toValue: 1.18,
          duration: 550,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(micPulse, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [voice.listening, micPulse]);

  return (
    <View
      style={[
        st.composerWrap,
        {
          backgroundColor: colors.codeEditorActivityBg,
          borderColor: colors.codeEditorGlassBorder,
          marginBottom: 10 + bottomInset,
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
                style={[
                  st.thumbRemove,
                  { backgroundColor: colors.codeEditorTabBg },
                ]}
                hitSlop={6}
              >
                <Ionicons name="close" size={11} color={colors.textSub} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={st.composerRow}>
        {/* Follow-ups were stuck on whatever model started the thread — the
         * workspace chat is where most of a project's turns happen, so the
         * picker has to exist here too, not only on the launch composer. */}
        <TouchableOpacity
          onPress={() => setModelPickerOpen(true)}
          activeOpacity={0.7}
          style={[
            st.modelChip,
            {
              backgroundColor: colors.codeEditorTabBg,
              borderColor: colors.codeEditorBorder,
            },
          ]}
        >
          <Text
            style={[st.modelChipLabel, { color: colors.textSub }]}
            numberOfLines={1}
          >
            {selectedModel?.label}
          </Text>
          <Ionicons name="chevron-down" size={12} color={colors.textSub} />
        </TouchableOpacity>

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
          <Ionicons name="add" size={20} color={colors.textSub} />
          {images.length > 0 ? (
            <View style={[st.countBadge, { backgroundColor: colors.accent }]}>
              <Text style={st.countBadgeText}>{images.length}</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        {voice.supported ? (
          <TouchableOpacity
            onPress={voice.toggle}
            activeOpacity={0.7}
            style={[
              st.attachBtn,
              {
                backgroundColor: voice.listening
                  ? `${colors.codeEditorDanger}1A`
                  : colors.codeEditorTabBg,
                borderColor: voice.listening
                  ? colors.codeEditorDanger
                  : colors.codeEditorBorder,
              },
            ]}
          >
            <Animated.View style={{ transform: [{ scale: micPulse }] }}>
              <Ionicons
                name={voice.listening ? 'mic' : 'mic-outline'}
                size={17}
                color={
                  voice.listening ? colors.codeEditorDanger : colors.textSub
                }
              />
            </Animated.View>
          </TouchableOpacity>
        ) : null}

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

      <ModelPickerModal
        visible={modelPickerOpen}
        onClose={() => setModelPickerOpen(false)}
        t={colors}
        models={MODELS}
        value={model}
        onChange={onModelChange}
        formatContext={fmtContext}
        allowedModels={allowedModels}
        onLockedPress={onLockedModelPress}
      />
    </View>
  );
}

function ChatFooter({
  activity,
  clarifyBlock,
  clarifyAnswers,
  colors,
  onSubmitClarify,
  busy,
}: {
  activity: ActivityStep[];
  clarifyBlock: ClarifyBlock | null;
  clarifyAnswers: Record<string, string> | null;
  colors: ReturnType<typeof useAppTheme>;
  onSubmitClarify: (value: Record<string, string>) => void;
  busy: boolean;
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
      {/* Last thing in the feed while a turn is live: the only element that
       * keeps moving through the long silent gaps between steps. */}
      {busy ? (
        <View style={st.dotsRow}>
          <ThinkingDots colors={colors} />
        </View>
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
  const t = useCoderTheme(colorScheme);
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    title,
    eta,
    backgroundRun,
    rename,
    remove,
  } = useCodeEditor();

  const [input, setInput] = React.useState('');
  const [images, setImages] = React.useState<string[]>([]);
  const [model, setModel] = React.useState<string>(DEFAULT_MODEL);
  const [upgradeModel, setUpgradeModel] = React.useState<Model | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [galleryOpen, setGalleryOpen] = React.useState(false);
  const [renameOpen, setRenameOpen] = React.useState(false);
  const allowedModels = useCoderQuota();
  const listRef = React.useRef<ScrollView>(null);

  const needsInput = !!clarifyBlock && !clarifyAnswers;

  // Bottom-anchored, like iMessage/most chat UIs — follows new content as it
  // streams in, not just on a brand new message (a turn with many activity
  // steps would otherwise leave the view stuck wherever it last was while
  // the feed grows well past the fold). `clarifyBlock` is included on its
  // own — it doesn't touch `messages`/`activity`, so without it the design-
  // brief card could land off-screen with nothing pulling it into view.
  React.useEffect(() => {
    if (messages.length || activity.length || clarifyBlock)
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: true })
      );
  }, [messages.length, activity.length, clarifyBlock]);

  function handleAttach() {
    if (images.length >= MAX_IMAGES) return;
    setGalleryOpen(true);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSend() {
    const text = input.trim();
    if (!text || !connected || busy) return;
    send(text, { model, images: images.length > 0 ? images : undefined });
    setInput('');
    setImages([]);
  }

  // "Background" is a leave-and-be-told affordance, not a mode switch: a
  // durable run already survives this screen closing (see `runs.py`), and the
  // backend now pushes a notification when it lands (`notify.py`). So the
  // honest button is "go do something else", not a second kind of run.
  function handleBackground() {
    toast.success(
      "Running in the background — we'll notify you when it's done."
    );
    router.back();
  }

  async function handleRename(next: string) {
    setRenameOpen(false);
    try {
      await rename(next);
    } catch {
      toast.error("Couldn't rename this project.");
    }
  }

  function handleDelete() {
    // Deleting the conversation is not reversible from the app, so it asks
    // once. It does NOT delete the built site — see the backend endpoint.
    Alert.alert(
      'Delete this project?',
      'The chat and its history are removed. Your generated files stay on the server.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove();
              router.back();
            } catch {
              toast.error("Couldn't delete this project.");
            }
          },
        },
      ]
    );
  }

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <ChatHeader
        connected={connected}
        busy={busy}
        needsInput={needsInput}
        title={title}
        colors={t}
        onClose={() => router.back()}
        onMenu={() => setMenuOpen(true)}
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
            busy={busy}
          />
        </ScrollView>

        <TokenMeter
          tokens={tokens}
          colors={t}
          eta={eta}
          busy={busy}
          backgroundRun={backgroundRun}
          onBackground={handleBackground}
        />

        {needsInput ? (
          <StatusBanner
            icon="hand-left-outline"
            text="Agent needs your input above to continue — pick an option or type your own."
            colors={t}
          />
        ) : null}

        <Composer
          input={input}
          onChangeInput={setInput}
          onSend={handleSend}
          disabled={!connected || busy || !input.trim()}
          images={images}
          onAttach={handleAttach}
          onRemoveImage={removeImage}
          colors={t}
          bottomInset={insets.bottom}
          model={model}
          onModelChange={setModel}
          allowedModels={allowedModels}
          onLockedModelPress={setUpgradeModel}
        />
      </KeyboardAvoidingView>

      <WorkMenu
        visible={menuOpen}
        colors={t}
        onClose={() => setMenuOpen(false)}
        onRename={() => setRenameOpen(true)}
        onDelete={handleDelete}
      />
      <RenameModal
        visible={renameOpen}
        initial={title}
        colors={t}
        onClose={() => setRenameOpen(false)}
        onSubmit={handleRename}
      />
      <GallerySheet
        visible={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onConfirm={(uris) =>
          setImages((prev) => [...prev, ...uris].slice(0, MAX_IMAGES))
        }
        t={t}
        max={MAX_IMAGES - images.length}
      />
      <UpgradeSheet
        visible={!!upgradeModel}
        onClose={() => setUpgradeModel(null)}
        t={t}
        modelLabel={upgradeModel?.label}
      />
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
    // A generated name can be up to 60 chars — it has to give way to the
    // status dot and the two buttons rather than push them off-screen.
    flexShrink: 1,
  },
  headerStatus: {
    fontFamily: F.sans500,
    fontSize: 11,
    marginTop: 1,
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
  bubbleUser: {
    // The 85% cap now lives on `userStack`; nesting a second 85% inside it
    // would compound into ~72%.
    maxWidth: '100%',
  },
  userStack: {
    maxWidth: '85%',
    alignItems: 'flex-end',
    gap: 7,
  },
  attachRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
  },
  attach: {
    width: 92,
    height: 92,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  attachImage: {
    width: '100%',
    height: '100%',
  },
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
    paddingTop: 6,
  },
  assistantText: {
    fontFamily: F.sans400,
    fontSize: 14.5,
    lineHeight: 21,
  },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },

  dotsRow: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 4,
  },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  sheet: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  sheetTitle: {
    fontFamily: F.sans600,
    fontSize: 15,
    marginBottom: 12,
  },
  renameInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14.5,
    fontFamily: F.sans400,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
  },
  sheetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sheetBtnText: {
    fontFamily: F.sans600,
    fontSize: 14,
  },

  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    // Anchored under the ⋮, which lives in the header's top-right.
    alignItems: 'flex-end',
    paddingTop: 96,
    paddingRight: 12,
  },
  menu: {
    minWidth: 176,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  menuDivider: { height: StyleSheet.hairlineWidth },
  menuText: {
    fontFamily: F.sans500,
    fontSize: 14.5,
  },

  modelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 150,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 11,
  },
  modelChipLabel: {
    fontFamily: F.sans600,
    fontSize: 11.5,
    flexShrink: 1,
  },

  composerWrap: {
    marginHorizontal: 10,
    marginTop: 10,
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
    gap: 8,
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
