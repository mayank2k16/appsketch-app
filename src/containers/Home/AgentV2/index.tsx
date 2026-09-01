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
import {
  type ModelOption,
  ModelPickerModal,
} from '@/components/ui/ModelPickerModal';
import { UpgradeSheet } from '@/components/ui/UpgradeSheet';
import { VoiceInputModal } from '@/components/ui/VoiceInputModal';
import { useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { useCoderQuota } from '@/lib/hooks/use-coder-quota';
import { pickImageFromCamera } from '@/lib/media/pickFromCamera';
import { toast } from '@/lib/toast';

import { homeTheme } from '../theme/HomeTheme';

const RADIUS = 15;
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

// TEMP: simple solid border/heading colour per tab, swapped in for the
// rotating gradient ring below while we look at a plain-border treatment.
// Purple for Web App, orange for Mobile App.
const TAB_ACCENT: Record<AppTypeKey, string> = {
  web: '#7C46BE',
  mobile: '#DF5231',
};

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

// Spins the border's lit gradient around the card, clockwise, forever. The
// gradient view is sized to the card's own diagonal and centered before it
// rotates — a square that size fully covers the card's bounding box at every
// angle (its inscribed circle, the one guarantee independent of rotation,
// has to reach the card's corners), so nothing outside the lit band is ever
// exposed as the sweep turns. `ringMask`'s `overflow: hidden` + `cardInner`
// on top still do the actual masking down to just the border stroke. The
// tail stop is forced to fully transparent and pulled in early (`locations`
// below) so most of the ring sits at flat zero alpha between sweeps, rather
// than a slow dissolve that reads as a faint border everywhere.
const BORDER_SPIN_MS = 6000;

function RotatingBorderGradient({
  colors,
  locations,
}: {
  colors: [string, string, ...string[]];
  locations: [number, number, ...number[]];
}) {
  const [box, setBox] = React.useState({ width: 0, height: 0 });
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: BORDER_SPIN_MS,
        easing: ReanimatedEasing.linear,
      }),
      -1,
      false
    );
    return () => cancelAnimation(rotation);
  }, [rotation]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const diag = Math.ceil(Math.hypot(box.width, box.height)) + 2;

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => setBox(e.nativeEvent.layout)}
    >
      {box.width > 0 && (
        <Reanimated.View
          style={[
            {
              position: 'absolute',
              width: diag,
              height: diag,
              left: (box.width - diag) / 2,
              top: (box.height - diag) / 2,
            },
            spinStyle,
          ]}
        >
          <LinearGradient
            colors={colors}
            locations={locations}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Reanimated.View>
      )}
    </View>
  );
}

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
          <View
            style={[
              s.ringMask,
              // TEMP: plain solid border in the active tab's colour instead
              // of the rotating gradient ring (see `RotatingBorderGradient`,
              // currently unused).
              { borderWidth: RING_W, borderColor: TAB_ACCENT[appType] },
            ]}
          >
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
                <View style={s.tabRow}>
                  {APP_TABS.map((tab, i) => {
                    const active = tab.key === appType;
                    return (
                      <React.Fragment key={tab.key}>
                        {/* Hairline rule separating the two halves. Sits
                              between them rather than around them, so the row
                              still reads as one control. */}
                        {i > 0 && (
                          <View
                            style={[
                              s.tabDivider,
                              // { backgroundColor: t.agentTabBorder },
                            ]}
                          />
                        )}
                        <TouchableOpacity
                          onPress={() => setAppType(tab.key)}
                          activeOpacity={0.7}
                          style={s.tabPill}
                        >
                          <Ionicons
                            name={tab.icon}
                            size={13}
                            color={
                              active ? TAB_ACCENT[tab.key] : t.agentTabIcon
                            }
                          />
                          <Text
                            style={[
                              s.tabPillLabel,
                              active && s.tabPillLabelActive,
                              {
                                color: active
                                  ? TAB_ACCENT[tab.key]
                                  : t.agentTabText,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {tab.label}
                          </Text>
                        </TouchableOpacity>
                      </React.Fragment>
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
                    <Text
                      style={[s.modelChipLabel, { color: t.agentBtnIcon }]}
                      numberOfLines={1}
                    >
                      {selectedModel.label}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={13}
                      color={t.agentBtnIcon}
                    />
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
                    <TouchableOpacity
                      onPress={() => setVoiceOpen(true)}
                      activeOpacity={0.7}
                      style={[
                        s.circleBtn,
                        {
                          backgroundColor: t.agentBtnBg,
                          borderColor: t.agentBtnBorder,
                        },
                      ]}
                    >
                      <Ionicons
                        name="mic-outline"
                        size={19}
                        color={t.agentBtnIcon}
                      />
                    </TouchableOpacity>
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
                        ? {
                          backgroundColor: t.agentTabActiveText,
                          borderColor: t.agentTabActiveText,
                        }
                        : {
                          backgroundColor: t.agentBtnBg,
                          borderColor: t.agentBtnBorder,
                          opacity: 0.5,
                        },
                    ]}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color={t.card} />
                    ) : (
                      <Ionicons
                        name="arrow-forward"
                        size={19}
                        color={canSend ? t.card : t.agentBtnIcon}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {showSuggestions && (
            <View style={s.suggestionCol}>
              {activeTab.suggestions.map((suggestion) => (
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
                  <Ionicons
                    name="sparkles-outline"
                    size={13}
                    color={t.agentTabIcon}
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
  wrap: {
    paddingHorizontal: 12,
    paddingTop: 40,
    paddingBottom: 70,
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
    gap: 10,
    marginBottom: 2,
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
    paddingVertical: 5,
    paddingHorizontal: 7,
  },
  tabPillLabel: {
    fontFamily: F.sans600,
    fontSize: 12,
  },
  // 1px vertical rule between the two tabs. Inset top and bottom so it reads
  // as a separator between labels, not a full-height column splitting the card.
  tabDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 2,
    backgroundColor: '#fff'
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
    maxWidth: 120,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  modelChipLabel: {
    fontFamily: F.sans600,
    fontSize: 11,
    flexShrink: 1,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
