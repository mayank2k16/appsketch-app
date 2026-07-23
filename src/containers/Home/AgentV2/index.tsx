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
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Reanimated, {
  Easing as ReanimatedEasing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { createCoderTenant } from '@/api/coder';
import { F } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';
import { toast } from '@/lib/toast';

const RADIUS = 15;
const BORDER_W = 1.75;
const RING_SPIN_MS = 6000;
const MAX_IMAGES = 3;
const TYPE_MS = 28; // ms per character while "typing"
const DELETE_MS = 16; // ms per character while "deleting"
const TYPE_HOLD_MS = 1500; // pause once a phrase is fully typed
const TYPE_GAP_MS = 300; // pause once a phrase is fully deleted, before the next

type AppTypeKey = 'web' | 'mobile' | 'game';

const APP_TABS: {
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
        'Build a personal portfolio site to showcase my projects and contact information',
      ],
    },
    {
      key: 'mobile',
      label: 'Mobile App',
      icon: 'phone-portrait-outline',
      suggestions: [
        'Build a habit tracker app with daily reminders and streak tracking',
        'Build a food delivery app with restaurant listings and live order tracking',
        'Build a social app for sharing photos with friends, likes, and comments',
      ],
    },
    {
      key: 'game',
      label: 'Game',
      icon: 'game-controller-outline',
      suggestions: [
        'Build a 2D platformer game with power-ups and multiple levels',
        'Build an endless runner game with obstacles and a live score counter',
        'Build a puzzle game with increasing difficulty and a move counter',
      ],
    },
  ];

/** Cycles through `phrases`, typing then deleting each in turn, forever —
 * restarts from scratch whenever `phrases` or `enabled` changes (tab switch,
 * or the real input gaining text/focus interrupts it). */
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
    let charIndex = 0;

    const typeStep = () => {
      if (cancelled) return;
      const phrase = phrases[phraseIndex % phrases.length];
      setText(phrase.slice(0, charIndex));
      if (charIndex < phrase.length) {
        charIndex += 1;
        timer = setTimeout(typeStep, TYPE_MS);
      } else {
        timer = setTimeout(deleteStep, TYPE_HOLD_MS);
      }
    };
    const deleteStep = () => {
      if (cancelled) return;
      const phrase = phrases[phraseIndex % phrases.length];
      if (charIndex > 0) {
        charIndex -= 1;
        setText(phrase.slice(0, charIndex));
        timer = setTimeout(deleteStep, DELETE_MS);
      } else {
        phraseIndex += 1;
        timer = setTimeout(typeStep, TYPE_GAP_MS);
      }
    };

    timer = setTimeout(typeStep, TYPE_GAP_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phrases, enabled]);

  return text;
}

function BlinkingCursor({ color }: { color: string }) {
  const [visible, setVisible] = React.useState(true);
  React.useEffect(() => {
    const id = setInterval(() => setVisible((v) => !v), 500);
    return () => clearInterval(id);
  }, []);
  return <Text style={{ color, opacity: visible ? 1 : 0 }}>|</Text>;
}

// Mirrors the web builder's model list (`coderModels.js`) — no tier/lock UI
// here since Home has no auth/plan context wired in yet, just plain options.
const MODELS = [
  {
    value: 'minimaxai/minimax-m3',
    label: 'MiniMax M3 · free',
    context: 1_000_000,
  },
  { value: 'z-ai/glm-5.2', label: 'GLM 5.2 · free', context: 200_000 },
  {
    value: 'nvidia/nemotron-3-ultra-550b-a55b',
    label: 'Nemotron · free',
    context: 128_000,
  },
  { value: 'gpt-4.1', label: 'GPT-4.1 · best quality', context: 1_047_576 },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 mini · fast', context: 1_047_576 },
  { value: 'gpt-4o-mini', label: 'GPT-4o mini · cheapest', context: 128_000 },
  { value: 'gpt-5-mini', label: 'GPT-5 mini · advanced', context: 400_000 },
  { value: 'gpt-5', label: 'GPT-5 · most capable', context: 400_000 },
];
const DEFAULT_MODEL = MODELS[0].value;

function fmtContext(tokens: number): string {
  if (tokens >= 1_000_000)
    return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M ctx`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K ctx`;
  return `${tokens} ctx`;
}

export function AgentV2({
  onAttachPress,
  onSendPress,
}: {
  onAttachPress?: () => void;
  onSendPress?: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);

  const router = useRouter();

  const [appType, setAppType] = React.useState<AppTypeKey>('web');
  const [prompt, setPrompt] = React.useState('');
  const [model, setModel] = React.useState(DEFAULT_MODEL);
  const [images, setImages] = React.useState<string[]>([]);
  const [modelPickerOpen, setModelPickerOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [inputFocused, setInputFocused] = React.useState(false);

  const activeTab = APP_TABS.find((tab) => tab.key === appType) ?? APP_TABS[0];
  const selectedModel = MODELS.find((m) => m.value === model) ?? MODELS[0];

  const showTypewriter = !inputFocused && prompt.length === 0;
  const typedPlaceholder = useTypewriter(activeTab.suggestions, showTypewriter);

  // Ring border: rotates an oversized copy of the gradient behind a
  // BORDER_W-wide window (see `ringSpinner` below) via a `transform` style,
  // not by animating the LinearGradient's own `start`/`end` props.
  //
  // A `start`/`end` sweep (via `Reanimated.createAnimatedComponent(LinearGradient)`
  // + `useAnimatedProps`) was tried first — it gives noticeably better colour
  // variety around the ring since the gradient never needs oversizing — but
  // it crashes on web: reanimated's web prop-patcher expects the animated
  // component to expose a `_touchableNode` (only true for Touchable-based
  // elements), and LinearGradient doesn't have one, so every animation frame
  // throws "Cannot read properties of undefined (reading 'setAttribute')" and
  // takes down the whole screen. `useAnimatedStyle` + `transform` has no such
  // requirement and is the same pattern already used safely on web elsewhere
  // in this app (see splash.tsx). Do not retry the props-sweep approach
  // without a web-specific fallback.
  const ringSpin = useSharedValue(0);
  React.useEffect(() => {
    ringSpin.value = withRepeat(
      withTiming(360, {
        duration: RING_SPIN_MS,
        easing: ReanimatedEasing.linear,
      }),
      -1,
      false
    );
  }, []);
  const ringSpinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringSpin.value}deg` }],
  }));

  // Send button — a slow light sheen sweeps across the glass button every
  // few seconds instead of sitting fully static between presses.
  const sheenX = React.useRef(new Animated.Value(-1)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(sheenX, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheenX, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(2600),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

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

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSend() {
    const text = prompt.trim();
    if (!text || sending) return;

    if (appType === 'game') {
      toast.error('Game builds are coming soon — try Web or Mobile for now.');
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
          <View style={s.tabRow}>
            {APP_TABS.map((tab) => {
              const active = tab.key === appType;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setAppType(tab.key)}
                  activeOpacity={0.8}
                  style={[
                    s.tabPill,
                    {
                      backgroundColor: active
                        ? t.agentTabActiveBg
                        : t.agentTabBg,
                      borderColor: active
                        ? t.agentTabActiveBg
                        : t.agentTabBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name={tab.icon}
                    size={13}
                    color={active ? t.agentTabActiveText : t.agentTabIcon}
                  />
                  <Text
                    style={[
                      s.tabPillLabel,
                      { color: active ? t.agentTabActiveText : t.agentTabText },
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                    {tab.key === 'game' ? ' · soon' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View
            style={[
              s.shadowWrap,
              Platform.select({ ios: { shadowColor: '#000' }, default: {} }),
            ]}
          >
            <View style={s.ringMask}>
              <Reanimated.View style={[s.ringSpinner, ringSpinStyle]}>
                <LinearGradient
                  colors={
                    [...t.agentBorderGradient] as [string, string, ...string[]]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </Reanimated.View>

              <View style={s.cardInner}>
                <BlurView
                  intensity={Platform.OS === 'android' ? 80 : 60}
                  tint={colorScheme === 'dark' ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: t.agentCardGlassTint },
                  ]}
                />

                <View style={s.cardContent}>
                  <View style={s.inputWrap}>
                    <TextInput
                      placeholder={activeTab.suggestions[0]}
                      placeholderTextColor="transparent"
                      editable
                      multiline
                      value={prompt}
                      onChangeText={setPrompt}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      style={[s.input, { color: t.agentInputText }]}
                    />
                    {showTypewriter && (
                      <View
                        pointerEvents="none"
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                        style={s.typewriterOverlay}
                      >
                        <Text
                          style={[s.input, { color: t.agentInputPlaceholder }]}
                        >
                          {typedPlaceholder}
                          <BlinkingCursor color={t.agentInputPlaceholder} />
                        </Text>
                      </View>
                    )}
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

                    <View style={{ flex: 1 }} />

                    <TouchableOpacity
                      onPress={handleSend}
                      activeOpacity={0.8}
                      disabled={sending || !prompt.trim()}
                    >
                      <LinearGradient
                        colors={
                          [...t.agentSendGradient] as [
                            string,
                            string,
                            ...string[],
                          ]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                          s.sendBtn,
                          (sending || !prompt.trim()) && { opacity: 0.5 },
                        ]}
                      >
                        <Animated.View
                          pointerEvents="none"
                          style={[
                            s.sendSheen,
                            {
                              transform: [
                                {
                                  translateX: sheenX.interpolate({
                                    inputRange: [-1, 1],
                                    outputRange: [-38, 38],
                                  }),
                                },
                                { rotate: '20deg' },
                              ],
                            },
                          ]}
                        />
                        {sending ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Ionicons name="arrow-up" size={19} color="#FFFFFF" />
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>

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
        </View>
      </View>

      <Modal
        visible={modelPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModelPickerOpen(false)}
      >
        <Pressable
          style={s.modalBackdrop}
          onPress={() => setModelPickerOpen(false)}
        >
          <Pressable
            style={[
              s.modelSheet,
              { backgroundColor: t.sheetBg, borderColor: t.agentInputBorder },
            ]}
          >
            <Text style={[s.modelSheetTitle, { color: t.text }]}>AI model</Text>
            {MODELS.map((m) => {
              const selected = m.value === model;
              return (
                <TouchableOpacity
                  key={m.value}
                  onPress={() => {
                    setModel(m.value);
                    setModelPickerOpen(false);
                  }}
                  activeOpacity={0.7}
                  style={s.modelOption}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.modelOptionLabel, { color: t.text }]}>
                      {m.label}
                    </Text>
                    <Text style={[s.modelOptionMeta, { color: t.textSub }]}>
                      {fmtContext(m.context)}
                    </Text>
                  </View>
                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={t.accent}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
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
  // Tabs float above the card as separate pills (a visible gap, no shared
  // border/background with the card below — deliberately not "attached").
  promptStack: {
    alignSelf: 'stretch',
    gap: 12,
    justifyContent: 'center',
  },
  tabRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabPillLabel: {
    fontFamily: F.sans600,
    fontSize: 12,
  },
  // Suggested-prompt cards below the card — one full prompt per row (not a
  // wrapping row of short labels), same glass tokens as the tabs above.
  suggestionCol: {
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
  shadowWrap: {
    alignSelf: 'stretch',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 22,
      },
      android: { elevation: 10 },
    }),
  },
  // Gradient-ring border: `ringMask` clips to the rounded rect and reserves
  // exactly BORDER_W of padding; `ringSpinner` is an oversized LinearGradient
  // rotated continuously behind that padding (see the comment above
  // `ringSpin` for why it's rotated via transform, not via animated
  // start/end props), and `cardInner` — sized to fill everything inside the
  // padding — covers the spinner everywhere except that ring, so only the
  // border ever shows the animated colour.
  ringMask: {
    borderRadius: RADIUS,
    padding: BORDER_W,
    overflow: 'hidden',
  },
  ringSpinner: {
    position: 'absolute',
    top: '-75%',
    left: '-75%',
    width: '250%',
    height: '250%',
  },
  cardInner: {
    borderRadius: RADIUS - BORDER_W,
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
    fontSize: 15,
    lineHeight: 20,
    minHeight: 110,
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
    maxWidth: 150,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  modelChipLabel: {
    fontFamily: F.sans600,
    fontSize: 12,
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
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sendSheen: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    width: 10,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modelSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 18,
    paddingBottom: 34,
    gap: 4,
  },
  modelSheetTitle: {
    fontFamily: F.sans700,
    fontSize: 15,
    marginBottom: 8,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  modelOptionLabel: {
    fontFamily: F.sans600,
    fontSize: 13.5,
  },
  modelOptionMeta: {
    fontFamily: F.sans400,
    fontSize: 11.5,
    marginTop: 2,
  },
});

export default AgentV2;
