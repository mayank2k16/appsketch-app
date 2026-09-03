import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing as ReanimatedEasing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { createCoderTenant } from '@/api/coder';
import { AuthGateModal } from '@/components/AuthForm/AuthGateModal';
import { MicButton } from '@/components/ui/MicButton';
import {
  type ModelOption,
  ModelPickerModal,
} from '@/components/ui/ModelPickerModal';
import { PROMPT_RADIUS } from '@/components/ui/prompt-metrics';
import { RotatingBorderGradient } from '@/components/ui/RotatingBorderGradient';
import { SlidingFill } from '@/components/ui/SlidingFill';
import { UpgradeSheet } from '@/components/ui/UpgradeSheet';
import { VoiceInputModal } from '@/components/ui/VoiceInputModal';
import { useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { useCoderQuota } from '@/lib/hooks/use-coder-quota';
import { pickImageFromCamera } from '@/lib/media/pickFromCamera';
import { toast } from '@/lib/toast';

import { homeTheme } from '../theme/HomeTheme';

const RADIUS = PROMPT_RADIUS;
/** Thickness of the prompt card's lit gradient edge — see `ringMask`. */
const RING_W = 1.5;
const MAX_IMAGES = 3;
// Characters are revealed in chunks rather than one per tick. Per-character
// at 28ms meant ~36 setState calls a second, permanently, on the JS thread —
// the placeholder animation alone was re-rendering this card more often than
// the display refreshes a scroll frame. Same perceived speed, ~4x the work.
const TYPE_MS = 100; // ms per chunk while "typing"
const TYPE_CHARS = 4;
const DELETE_MS = 40; // ms per chunk while "deleting"
const DELETE_CHARS = 6;
const TYPE_HOLD_MS = 1500; // pause once a phrase is fully typed
const TYPE_GAP_MS = 300; // pause once a phrase is fully deleted, before the next

type AppTypeKey = 'web' | 'mobile';

/** Where the ring's three brand stops land. Even thirds — a continuous
 *  gradient edge all the way round, which is what the reference shows. The
 *  ring component's own docstring describes an early-cut transparent tail;
 *  that shape belongs to a sweeping-highlight treatment, and passing it here
 *  would leave most of the outline at zero alpha instead of coloured. */
const RING_STOPS: [number, number, number] = [0, 0.5, 1];

export const APP_TABS: {
  key: AppTypeKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  // Starter prompts, both the suggestion-pill text below the card and the
  // rotating typewriter placeholder inside it — one list, two uses.
  suggestions: string[];
}[] = [
  {
    key: 'web',
    label: 'Web App',
    icon: 'globe-outline',
    suggestions: [
      'Build a landing page for my product launch with an email signup and countdown timer',
      'Build an online store for my clothing brand with product listings and a shopping cart',
    ],
  },
  {
    key: 'mobile',
    label: 'Mobile App',
    icon: 'phone-portrait-outline',
    suggestions: [
      'Build a habit tracker app with daily reminders and streak tracking',
      'Build a food delivery app with restaurant listings and live order tracking',
    ],
  },
];

/** Cycles through `phrases`, typing then deleting each in turn, forever —
 * restarts from scratch whenever `phrases` or `enabled` changes (tab switch,
 * or the real input gaining text/focus interrupts it).
 *
 * Char count is derived from actual elapsed time (`Date.now()` deltas), not
 * incremented by a fixed amount per tick. A naive "+TYPE_CHARS every tick"
 * loop never recovers from a late tick — if the JS thread is busy for one
 * beat, that tick still only adds its usual chunk, so the reveal falls
 * behind and stays behind for the rest of the phrase. That's what read as
 * "not smooth": not the chunk size, but the pace silently drifting under any
 * JS-thread hiccup. Deriving from elapsed time means a late tick just
 * catches up to where it should already be — same tick rate, same number of
 * setState calls, no extra work added, just no accumulated drift. */
function useTypewriter(phrases: string[], enabled: boolean): string {
  const [text, setText] = React.useState('');

  React.useEffect(() => {
    if (!enabled || phrases.length === 0) {
      setText('');
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let phraseIndex = 0;
    // null means "this phase hasn't rendered its first frame yet" — set to
    // Date.now() lazily, on the phase's own first tick, not when it's
    // scheduled. Stamping it at schedule time would count the setTimeout
    // delay itself as elapsed phase time, so the very first tick after any
    // wait would jump several chars in instead of starting from zero.
    let phaseStart: number | null = null;

    const schedule = (fn: () => void, ms: number) => {
      timer = setTimeout(fn, ms);
    };

    const typeStep = () => {
      if (cancelled) return;
      const phrase = phrases[phraseIndex % phrases.length];
      phaseStart ??= Date.now();
      const elapsed = Date.now() - phaseStart;
      const chars = Math.min(
        phrase.length,
        Math.floor((elapsed / TYPE_MS) * TYPE_CHARS)
      );
      setText(phrase.slice(0, chars));
      if (chars < phrase.length) {
        schedule(typeStep, TYPE_MS);
      } else {
        phaseStart = null;
        schedule(deleteStep, TYPE_HOLD_MS);
      }
    };
    const deleteStep = () => {
      if (cancelled) return;
      const phrase = phrases[phraseIndex % phrases.length];
      phaseStart ??= Date.now();
      const elapsed = Date.now() - phaseStart;
      const removed = Math.min(
        phrase.length,
        Math.floor((elapsed / DELETE_MS) * DELETE_CHARS)
      );
      const chars = Math.max(0, phrase.length - removed);
      setText(phrase.slice(0, chars));
      if (chars > 0) {
        schedule(deleteStep, DELETE_MS);
      } else {
        phraseIndex += 1;
        phaseStart = null;
        schedule(typeStep, TYPE_GAP_MS);
      }
    };

    schedule(typeStep, TYPE_GAP_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phrases, enabled]);

  return text;
}

// Blinks on the UI thread. Was two React re-renders a second, forever, to
// toggle the opacity of a single pipe character.
function BlinkingCursor({ color }: { color: string }) {
  const v = useSharedValue(1);
  React.useEffect(() => {
    v.value = withRepeat(
      withTiming(0, { duration: 500, easing: ReanimatedEasing.linear }),
      -1,
      true
    );
    return () => cancelAnimation(v);
  }, [v]);
  const style = useAnimatedStyle(() => ({ opacity: v.value }));
  return <Reanimated.Text style={[{ color }, style]}>|</Reanimated.Text>;
}

// Isolates the typewriter's per-chunk setState churn (every TYPE_MS/DELETE_MS)
// to this small subtree. It used to live inline in AgentV2, which meant every
// chunk re-rendered the whole card — including the BlurView (intensity 80 on
// Android, genuinely expensive to redraw) and the animated border ring —
// dozens of times a minute for no visual reason. That's what "typewriter
// feels janky, not smooth" actually was: the text itself was fine, everything
// around it was repainting along with it.
function TypewriterPlaceholder({
  phrases,
  enabled,
  color,
  textStyle,
}: {
  phrases: string[];
  enabled: boolean;
  color: string;
  textStyle: (typeof s)['input'];
}) {
  const text = useTypewriter(phrases, enabled);
  if (!enabled) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={s.typewriterOverlay}
    >
      <Text style={[textStyle, { color }]}>
        {text}
        <BlinkingCursor color={color} />
      </Text>
    </View>
  );
}

// The prompt card's lit, spinning edge now lives in components/ui — the
// bottom tab bar was asked for "the same as the prompt", and the only way to
// make that literally true is for both to render this one component. See
// RotatingBorderGradient.tsx for how the spin covers the box at every angle.

// Mirrors the web builder's model list (`coderModels.js`) exactly, including
// the paywall: DeepSeek runs on every tier (Flash is the default for every
// user, Pro a free upgrade anyone can pick); every GPT model is PAID-ONLY.
// The old open-source NVIDIA NIM pool (MiniMax / GLM / Nemotron) is RETIRED —
// zero-cost but unreliable under load and a weaker tool-caller than DeepSeek.
// Exported so the standalone Agent tab screen (../Agent) reuses the same
// list/picker instead of maintaining a second copy.
export const MODELS = [
  {
    value: 'deepseek-v4-flash',
    label: 'Default · fast & free',
    context: 1_000_000,
  },
  {
    value: 'deepseek-v4-pro',
    label: 'Default Pro · deeper reasoning',
    context: 128_000,
  },
  {
    value: 'gpt-4.1',
    label: 'GPT-4.1 · best quality (Pro)',
    context: 1_047_576,
  },
  {
    value: 'gpt-4.1-mini',
    label: 'GPT-4.1 mini · fast (Pro)',
    context: 1_047_576,
  },
  {
    value: 'gpt-4o-mini',
    label: 'GPT-4o mini · cheapest (Pro)',
    context: 128_000,
  },
  { value: 'gpt-5-mini', label: 'GPT-5 mini · advanced', context: 400_000 },
  { value: 'gpt-5', label: 'GPT-5 · most capable', context: 400_000 },
];
export const DEFAULT_MODEL = MODELS[0].value;

export function fmtContext(tokens: number): string {
  if (tokens >= 1_000_000)
    return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M ctx`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K ctx`;
  return `${tokens} ctx`;
}

export function AgentV2({
  onAttachPress,
  onSendPress,
  showSuggestions = true,
}: {
  onAttachPress?: () => void;
  onSendPress?: () => void;
  /** The suggestion pills below the card — on by default (the Hero-section
   *  usage), off for other placements (e.g. ClosingCTA) that just want the
   *  prompt card itself. */
  showSuggestions?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  const router = useRouter();

  const [appType, setAppType] = React.useState<AppTypeKey>('web');
  const [tabRowW, setTabRowW] = React.useState(0);
  const [prompt, setPrompt] = React.useState('');
  const [model, setModel] = React.useState(DEFAULT_MODEL);
  const [images, setImages] = React.useState<string[]>([]);
  const [modelPickerOpen, setModelPickerOpen] = React.useState(false);
  const [upgradeModel, setUpgradeModel] = React.useState<ModelOption | null>(
    null
  );
  const [sending, setSending] = React.useState(false);
  const [inputFocused, setInputFocused] = React.useState(false);
  const [gateOpen, setGateOpen] = React.useState(false);
  const [voiceOpen, setVoiceOpen] = React.useState(false);

  const allowedModels = useCoderQuota();

  const activeTab = APP_TABS.find((tab) => tab.key === appType) ?? APP_TABS[0];
  const selectedModel = MODELS.find((m) => m.value === model) ?? MODELS[0];
  // "Name \u00B7 qualifier" shown at two weights — see PromptComposer.
  const [modelName, ...modelRest] = (selectedModel?.label ?? '').split(
    '\u00B7'
  );
  const modelQualifier = modelRest.join('\u00B7').trim();

  // The palette declares this ramp readonly; `expo-linear-gradient` wants a
  // mutable tuple. Copied once here rather than cast at each of the three
  // places that paint with it (card edge, selected pill, send button).
  const ringColors = React.useMemo(
    () => [...t.agentBorderGradient] as [string, string, ...string[]],
    [t.agentBorderGradient]
  );

  const voiceSupported = Platform.OS !== 'web';

  // Drives the send button's inverted state — filled the moment there is
  // something to send, including while that send is in flight.
  const canSend = prompt.trim().length > 0;

  const showTypewriter = !inputFocused && prompt.length === 0;

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
    onAttachPress?.();
  }

  async function handleCamera() {
    if (images.length >= MAX_IMAGES) return;
    const uri = await pickImageFromCamera();
    if (!uri) return;
    setImages((prev) => [...prev, uri].slice(0, MAX_IMAGES));
    onAttachPress?.();
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? prompt).trim();
    if (!text || sending) return;

    if (useAuth.getState().status !== 'signIn') {
      setGateOpen(true);
      return;
    }

    setSending(true);
    try {
      const tenant = await createCoderTenant({
        title: text.slice(0, 60),
        appType,
      });
      router.push({
        pathname: '/code-editor/chat',
        params: {
          tenantId: String(tenant.id),
          tenantUid: tenant.uuid,
          appType,
          userPrompt: text,
          model,
          images: JSON.stringify(images),
        },
      });
      onSendPress?.();
    } catch {
      toast.error("Couldn't start your build. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={s.wrap}>
      <View style={s.stage}>
        <View style={s.promptStack}>
          <View style={s.ringMask}>
            {/* The lit gradient edge, restored from the flat single-colour
                stroke that stood in for it. `ringMask` reserves RING_W of
                padding and clips; this fills that padding and `cardInner`
                below covers everything except the edge itself. */}
            <RotatingBorderGradient
              colors={ringColors}
              locations={RING_STOPS}
            />
            <View style={s.cardInner}>
              <BlurView
                intensity={Platform.OS === 'android' ? 80 : 60}
                tint={colorScheme === 'dark' ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, { backgroundColor: t.card }]}
              />

              <View style={s.cardContent}>
                {/* App-type switch, inside the card and above the field.
                      No border, no fill, no indicator bar — selection is
                      carried entirely by the label and icon going full white
                      against the muted unselected pair. */}
                <View
                  style={s.tabRow}
                  onLayout={(e) => setTabRowW(e.nativeEvent.layout.width)}
                >
                  {/* Hairline rule between the two halves, drawn BEFORE the
                      fill so the fill passes over it rather than being cut
                      by it. Absolute, so it does not take a slot in the row
                      and throw the two halves off equal width — which is
                      what the old in-flow divider did, and what would leave
                      the sliding fill short of the segment it fills. */}
                  <View style={s.tabDivider} pointerEvents="none" />

                  {/* One fill that TRAVELS between the halves, rather than
                      one pill lighting as the other goes out. */}
                  <SlidingFill
                    count={APP_TABS.length}
                    index={APP_TABS.findIndex((tab) => tab.key === appType)}
                    trackWidth={tabRowW}
                    radius={PROMPT_RADIUS}
                  />
                  {APP_TABS.map((tab) => {
                    const active = tab.key === appType;
                    return (
                      <TouchableOpacity
                        key={tab.key}
                        onPress={() => setAppType(tab.key)}
                        activeOpacity={0.7}
                        style={s.tabPill}
                      >
                        <Ionicons
                          name={tab.icon}
                          size={13}
                          color={active ? '#FFFFFF' : t.agentTabIcon}
                        />
                        <Text
                          style={[
                            s.tabPillLabel,
                            active && s.tabPillLabelActive,
                            { color: active ? '#FFFFFF' : t.agentTabText },
                          ]}
                          numberOfLines={1}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={s.inputWrap}>
                  <TextInput
                    placeholder={activeTab.suggestions[0]}
                    placeholderTextColor={
                      showTypewriter ? 'transparent' : t.agentInputPlaceholder
                    }
                    editable
                    multiline
                    value={prompt}
                    onChangeText={setPrompt}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    style={[s.input, { color: t.agentInputText }]}
                  />
                  <TypewriterPlaceholder
                    phrases={activeTab.suggestions}
                    enabled={showTypewriter}
                    color={t.agentInputPlaceholder}
                    textStyle={s.input}
                  />
                </View>

                {images.length > 0 && (
                  <View style={s.thumbRow}>
                    {images.map((uri, i) => (
                      <View
                        key={`${uri}-${i}`}
                        style={[s.thumb, { borderColor: t.agentInputBorder }]}
                      >
                        <Image
                          source={{ uri }}
                          style={s.thumbImg}
                          contentFit="cover"
                        />
                        <Pressable
                          onPress={() => removeImage(i)}
                          style={[
                            s.thumbRemove,
                            { backgroundColor: t.agentBtnBg },
                          ]}
                          hitSlop={6}
                        >
                          <Ionicons
                            name="close"
                            size={11}
                            color={t.agentBtnIcon}
                          />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}

                <View style={s.row}>
                  <TouchableOpacity
                    onPress={() => setModelPickerOpen(true)}
                    activeOpacity={0.7}
                    style={[
                      s.modelChip,
                      {
                        backgroundColor: t.agentBtnBg,
                        borderColor: t.agentBtnBorder,
                      },
                    ]}
                  >
                    {/* Live dot, name, qualifier — see PromptComposer, which
                        renders the same three parts for the Agent tab's
                        copy of this control. */}
                    <View
                      style={[
                        s.modelDot,
                        { backgroundColor: t.codeEditorConnectedDot },
                      ]}
                    />
                    <Text
                      style={[s.modelChipLabel, { color: t.text }]}
                      numberOfLines={1}
                    >
                      {modelName}
                    </Text>
                    {!!modelQualifier && (
                      <Text
                        style={[s.modelChipQualifier, { color: t.textMuted }]}
                        numberOfLines={1}
                      >
                        {modelQualifier}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleAttach}
                    activeOpacity={0.7}
                    disabled={images.length >= MAX_IMAGES}
                    style={[
                      s.circleBtn,
                      {
                        backgroundColor: t.agentBtnBg,
                        borderColor: t.agentBtnBorder,
                      },
                    ]}
                  >
                    <Ionicons name="add" size={20} color={t.agentBtnIcon} />
                    {images.length > 0 && (
                      <View
                        style={[
                          s.countBadge,
                          { backgroundColor: t.agentTabActiveBg },
                        ]}
                      >
                        <Text style={s.countBadgeText}>{images.length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleCamera}
                    activeOpacity={0.7}
                    disabled={images.length >= MAX_IMAGES}
                    style={[
                      s.circleBtn,
                      {
                        backgroundColor: t.agentBtnBg,
                        borderColor: t.agentBtnBorder,
                      },
                    ]}
                  >
                    <Ionicons
                      name="camera-outline"
                      size={19}
                      color={t.agentBtnIcon}
                    />
                  </TouchableOpacity>

                  {voiceSupported && (
                    <MicButton
                      t={t}
                      onPress={() => setVoiceOpen(true)}
                      size={36}
                      iconSize={19}
                    />
                  )}

                  <View style={{ flex: 1 }} />

                  {/* Idle, this is the same shape, fill and border as the +
                        and mic buttons to its left. The moment there is
                        something to send it inverts to a solid fill with a
                        dark glyph — the one high-contrast element in the row,
                        so the action to take next is obvious. Both values come
                        from the tab tokens, which already flip with the
                        scheme, rather than hardcoded black/white that would
                        vanish in light mode. */}
                  <TouchableOpacity
                    onPress={() => handleSend()}
                    activeOpacity={0.7}
                    disabled={sending || !prompt.trim()}
                    style={[
                      s.circleBtn,
                      canSend
                        ? { borderColor: 'transparent' }
                        : {
                            backgroundColor: t.agentBtnBg,
                            borderColor: t.agentBtnBorder,
                            opacity: 0.5,
                          },
                    ]}
                  >
                    {/* Armed, this fills with the brand ramp — the same run
                        as the card's edge and the selected pill, so the one
                        button worth pressing is also the one carrying the
                        colour. Idle it stays the plain outlined circle its
                        neighbours are. */}
                    {canSend && (
                      <LinearGradient
                        colors={ringColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    {sending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons
                        name="arrow-forward"
                        size={19}
                        color={canSend ? '#FFFFFF' : t.agentBtnIcon}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {showSuggestions && (
            <View style={s.suggestionCol}>
              {activeTab.suggestions.map((suggestion, i) => (
                <TouchableOpacity
                  key={suggestion}
                  onPress={() => setPrompt(suggestion)}
                  activeOpacity={0.7}
                  style={[
                    s.suggestionPill,
                    {
                      backgroundColor: t.agentTabBg,
                      borderColor: t.agentTabBorder,
                    },
                  ]}
                >
                  {/* Each chip's sparkle takes the next stop along the ramp
                      rather than all of them sharing one grey. Indexing the
                      ramp (rather than hardcoding a colour per chip) means
                      the list can grow without anyone picking new hues. */}
                  <Ionicons
                    name="sparkles-outline"
                    size={13}
                    color={ringColors[i % ringColors.length]}
                    style={s.suggestionIcon}
                  />
                  <Text style={[s.suggestionText, { color: t.agentTabText }]}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <ModelPickerModal
        visible={modelPickerOpen}
        onClose={() => setModelPickerOpen(false)}
        t={t}
        models={MODELS}
        value={model}
        onChange={setModel}
        formatContext={fmtContext}
        allowedModels={allowedModels}
        onLockedPress={setUpgradeModel}
      />

      <UpgradeSheet
        visible={!!upgradeModel}
        onClose={() => setUpgradeModel(null)}
        t={t}
        modelLabel={upgradeModel?.label}
      />

      <AuthGateModal
        visible={gateOpen}
        onClose={() => setGateOpen(false)}
        onSuccess={() => {
          setGateOpen(false);
          handleSend();
        }}
      />

      <VoiceInputModal
        visible={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onSubmit={(text) => {
          setPrompt(text);
          setVoiceOpen(false);
          handleSend(text);
        }}
        t={t}
      />
    </View>
  );
}

const s = StyleSheet.create({
  // Density pass: 40 above and 70 below put most of a screen of empty black
  // between the hero copy and the suggestion chips, so the card floated alone
  // with its neighbours out of frame. Tightened to sit as one block with the
  // hero above it.
  wrap: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 28,
  },
  stage: {
    alignItems: 'center',
  },
  // Concentric low-opacity circles standing in for a radial gradient —
  // React Native has no primitive to blur a shape, only a view.
  washOuter: {
    position: 'absolute',
    top: 18,
    width: 230,
    height: 230,
    borderRadius: 115,
    opacity: 0.1,
  },
  washMid: {
    position: 'absolute',
    top: 55,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.16,
  },
  washInner: {
    position: 'absolute',
    top: 85,
    width: 88,
    height: 88,
    borderRadius: 44,
    opacity: 0.22,
  },
  // Tabs float above the card as a separate control — no shared border or
  // background with it, deliberately not "attached". The gap between the two
  // comes from `tabRow`'s own marginBottom, and the gap below the card from
  // `suggestionCol`, so this stack adds none of its own.
  promptStack: {
    alignSelf: 'stretch',
    gap: 0,
    justifyContent: 'center',
  },
  // Lives INSIDE the card now, above the field — so the card keeps one clean
  // unbroken outline and nothing sits on top of it. Full width, split evenly
  // between the two tabs (see `tabPill`).
  tabRow: {
    flexDirection: 'row',
    // No gap: the sliding fill covers exactly 1/n of this row, so any gap
    // would leave it short of the segment it is meant to fill.
    marginBottom: 2,
    // Anchors the absolutely-positioned divider below.
    position: 'relative',
  },
  // 1px vertical rule at the row's midpoint. Inset top and bottom so it reads
  // as a separator between labels, not a full-height column splitting the
  // card. Kept faint: a separator only has to be findable, not read as an
  // element in its own right — and the fill slides straight over it.
  tabDivider: {
    position: 'absolute',
    left: '50%',
    width: 1,
    top: 4,
    bottom: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  // Bare text + icon. No border, no fill, no radius — the tap target is padded
  // out but draws nothing of its own, so the only thing distinguishing the
  // selected tab is that its label and icon go full white.
  tabPill: {
    // Each tab takes exactly half the row, so Web App and Mobile App sit as
    // two equal halves with a gap between rather than bunching left at
    // whatever width their labels happen to need.
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 7,
  },
  tabPillLabel: {
    fontFamily: F.sans600,
    fontSize: 12,
  },
  tabPillLabelActive: {
    fontFamily: F.sans700,
  },
  // Suggested-prompt cards below the card — one full prompt per row (not a
  // wrapping row of short labels), same glass tokens as the tabs above.
  suggestionCol: {
    marginTop: 12,
    gap: 8,
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
  },
  suggestionIcon: {
    marginTop: 2,
  },
  suggestionText: {
    flex: 1,
    fontFamily: F.sans500,
    fontSize: 12.5,
    lineHeight: 17,
  },
  // Gradient-ring border: `ringMask` clips to the rounded rect and reserves
  // RING_W of padding, `RotatingBorderGradient` fills it (rendered as the
  // first child, see JSX), and `cardInner` — sized to fill everything inside
  // that padding — covers the gradient everywhere except the edge, so only
  // the border shows it.
  ringMask: {
    alignSelf: 'stretch',
    // All four corners round: the tabs are a separate row above now, so
    // nothing lands on the card's top edge and the outline stays one closed,
    // unbroken shape.
    borderRadius: RADIUS,
    padding: RING_W,
    overflow: 'hidden',
  },
  cardInner: {
    borderRadius: RADIUS - RING_W,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 14,
    gap: 10,
  },
  inputWrap: {
    position: 'relative',
  },
  typewriterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  input: {
    fontFamily: F.sans400,
    fontSize: 14,
    lineHeight: 18,
    paddingTop: 0,
    minHeight: 90,
    maxHeight: 120,
    paddingHorizontal: 4,
  },
  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbRemove: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    // Was 120, which truncated the qualifier the moment one was shown.
    maxWidth: 200,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  modelChipLabel: {
    fontFamily: F.sans600,
    fontSize: 11,
    flexShrink: 0,
  },
  // No mono family is loaded app-wide (see lib/fonts), so the qualifier gets
  // its "code-ish" feel from tracking and a lighter weight instead.
  modelChipQualifier: {
    fontFamily: F.sans400,
    fontSize: 10,
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  modelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Keeps the send button's gradient fill inside the circle.
    overflow: 'hidden',
  },
  countBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontFamily: F.sans700,
    fontSize: 9,
    color: '#FFFFFF',
  },
});

export default AgentV2;
