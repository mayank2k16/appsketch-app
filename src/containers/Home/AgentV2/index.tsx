import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
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

import { F } from '@/lib/fonts';
import { toast } from '@/lib/toast';
import { useAppTheme } from '@/lib/theme';

const RADIUS = 24;
const BORDER_W = 1;
const MAX_IMAGES = 3;
const SEG_PAD = 0;

type AppTypeKey = 'web' | 'mobile' | 'game';

const APP_TABS: { key: AppTypeKey; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; placeholder: string }[] = [
  {
    key: 'web',
    label: 'Web App',
    icon: 'globe-outline',
    placeholder: 'Build an e-commerce website for my grocery store...',
  },
  {
    key: 'mobile',
    label: 'Mobile App',
    icon: 'phone-portrait-outline',
    placeholder: 'Build a fitness tracking mobile app with workout logging...',
  },
  {
    key: 'game',
    label: 'Game',
    icon: 'game-controller-outline',
    placeholder: 'Build a 2D space shooter game with levels and a score...',
  },
];

// Mirrors the web builder's model list (`coderModels.js`) — no tier/lock UI
// here since Home has no auth/plan context wired in yet, just plain options.
const MODELS = [
  { value: 'minimaxai/minimax-m3', label: 'MiniMax M3 · free', context: 1_000_000 },
  { value: 'z-ai/glm-5.2', label: 'GLM 5.2 · free', context: 200_000 },
  { value: 'nvidia/nemotron-3-ultra-550b-a55b', label: 'Nemotron · free', context: 128_000 },
  { value: 'gpt-4.1', label: 'GPT-4.1 · best quality', context: 1_047_576 },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 mini · fast', context: 1_047_576 },
  { value: 'gpt-4o-mini', label: 'GPT-4o mini · cheapest', context: 128_000 },
  { value: 'gpt-5-mini', label: 'GPT-5 mini · advanced', context: 400_000 },
  { value: 'gpt-5', label: 'GPT-5 · most capable', context: 400_000 },
];
const DEFAULT_MODEL = MODELS[0].value;

function fmtContext(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M ctx`;
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
  const isDark = colorScheme === 'dark';

  const [appType, setAppType] = React.useState<AppTypeKey>('web');
  const [prompt, setPrompt] = React.useState('');
  const [model, setModel] = React.useState(DEFAULT_MODEL);
  const [images, setImages] = React.useState<string[]>([]);
  const [modelPickerOpen, setModelPickerOpen] = React.useState(false);

  const activeTab = APP_TABS.find((tab) => tab.key === appType) ?? APP_TABS[0];
  const selectedModel = MODELS.find((m) => m.value === model) ?? MODELS[0];
  const activeIndex = APP_TABS.findIndex((tab) => tab.key === appType);

  // Segmented-tab indicator — slides to the active tab instead of each pill
  // instantly swapping its own background. Driven by index (0/1/2) and
  // interpolated to a `left` percentage rather than measured pixel widths,
  // since percentage `left`/`width` need no onLayout round-trip to be exact.
  const indicatorPos = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(indicatorPos, {
      toValue: activeIndex,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [activeIndex]);
  // Memoized so Animated.View keeps a single stable node attached to
  // indicatorPos — recreating the interpolation every render (the pos %
  // never actually changed here) silently detaches it from the running
  // animation on the web/JS driver, freezing the indicator at 0%.
  const indicatorLeft = React.useMemo(
    () =>
      indicatorPos.interpolate({
        inputRange: APP_TABS.map((_, i) => i),
        outputRange: APP_TABS.map((_, i) => `${(i * 100) / APP_TABS.length}%`),
      }),
    [indicatorPos]
  );

  // Send button — a slow light sheen sweeps across the glass button every
  // few seconds instead of sitting fully static between presses.
  const sheenX = React.useRef(new Animated.Value(-1)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(sheenX, { toValue: 1, duration: 850, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sheenX, { toValue: -1, duration: 0, useNativeDriver: true }),
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
    setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_IMAGES));
    onAttachPress?.();
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  const washColor = t.agentSendGradient[1];

  return (
    <View style={s.wrap}>
      <View style={s.stage}>
        {/* Soft violet wash the glass card sits on top of and refracts —
            three concentric low-opacity circles fake a radial glow since RN
            has no blur-a-shape primitive. */}
        <View pointerEvents="none" style={[s.washOuter, { backgroundColor: washColor }]} />
        <View pointerEvents="none" style={[s.washMid, { backgroundColor: washColor }]} />
        <View pointerEvents="none" style={[s.washInner, { backgroundColor: washColor }]} />

        {/* Segmented control — one sliding indicator instead of three
            independently-toggling pills. */}
        <View style={[s.segTrack, { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder }]}>
          <Animated.View
            pointerEvents="none"
            style={[
              s.segIndicator,
              { width: `${100 / APP_TABS.length}%`, backgroundColor: t.text, left: indicatorLeft },
            ]}
          />
          {APP_TABS.map((tab) => {
            const active = tab.key === appType;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setAppType(tab.key)}
                activeOpacity={0.8}
                style={s.segTab}
              >
                <Ionicons name={tab.icon} size={13} color={active ? t.bg : t.agentTabIcon} />
                <Text style={[s.segTabLabel, { color: active ? t.bg : t.agentTabText }]} numberOfLines={1}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={[
            s.shadowWrap,
            Platform.select({
              ios: { shadowColor: t.agentGlowBlue },
              default: {},
            }),
          ]}
        >
          <View
            style={[
              s.card,
              { borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(17,17,17,0.14)' },
            ]}
          >
            <BlurView
              intensity={Platform.OS === 'android' ? 60 : 40}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            {/* Keeps the card's contrast guaranteed regardless of how much
                (or how little) the platform's blur actually renders. */}
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: t.agentInputBg, opacity: isDark ? 0.74 : 0.7 }]}
            />
            <LinearGradient
              pointerEvents="none"
              colors={isDark ? ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)'] : ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
              style={s.cardHighlight}
            />

            <View style={s.cardContent}>
              <TextInput
                placeholder={activeTab.placeholder}
                placeholderTextColor={t.agentInputPlaceholder}
                editable
                multiline
                value={prompt}
                onChangeText={setPrompt}
                style={[s.input, { color: t.agentInputText }]}
              />

              {images.length > 0 && (
                <View style={s.thumbRow}>
                  {images.map((uri, i) => (
                    <View key={`${uri}-${i}`} style={[s.thumb, { borderColor: t.agentInputBorder }]}>
                      <Image source={{ uri }} style={s.thumbImg} contentFit="cover" />
                      <Pressable onPress={() => removeImage(i)} style={[s.thumbRemove, { backgroundColor: t.agentBtnBg }]} hitSlop={6}>
                        <Ionicons name="close" size={11} color={t.agentBtnIcon} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              <View style={s.row}>
                <TouchableOpacity
                  onPress={() => setModelPickerOpen(true)}
                  activeOpacity={0.7}
                  style={[s.modelChip, { backgroundColor: t.agentBtnBg, borderColor: t.agentBtnBorder }]}
                >
                  <Text style={[s.modelChipLabel, { color: t.agentBtnIcon }]} numberOfLines={1}>
                    {selectedModel.label}
                  </Text>
                  <Ionicons name="chevron-down" size={13} color={t.agentBtnIcon} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleAttach}
                  activeOpacity={0.7}
                  disabled={images.length >= MAX_IMAGES}
                  style={[s.circleBtn, { backgroundColor: t.agentBtnBg, borderColor: t.agentBtnBorder }]}
                >
                  <Ionicons name="add" size={20} color={t.agentBtnIcon} />
                  {images.length > 0 && (
                    <View style={[s.countBadge, { backgroundColor: t.agentTabActiveBg }]}>
                      <Text style={s.countBadgeText}>{images.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                <TouchableOpacity onPress={onSendPress} activeOpacity={0.8}>
                  <LinearGradient
                    colors={[...t.agentSendGradient] as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.sendBtn}
                  >
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        s.sendSheen,
                        {
                          transform: [
                            { translateX: sheenX.interpolate({ inputRange: [-1, 1], outputRange: [-38, 38] }) },
                            { rotate: '20deg' },
                          ],
                        },
                      ]}
                    />
                    <Ionicons name="arrow-up" size={19} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

      <Modal visible={modelPickerOpen} transparent animationType="fade" onRequestClose={() => setModelPickerOpen(false)}>
        <Pressable style={s.modalBackdrop} onPress={() => setModelPickerOpen(false)}>
          <Pressable style={[s.modelSheet, { backgroundColor: t.sheetBg, borderColor: t.agentInputBorder }]}>
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
                    <Text style={[s.modelOptionLabel, { color: t.text }]}>{m.label}</Text>
                    <Text style={[s.modelOptionMeta, { color: t.textSub }]}>{fmtContext(m.context)}</Text>
                  </View>
                  {selected && <Ionicons name="checkmark-circle" size={18} color={t.accent} />}
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
    paddingHorizontal: 18,
    paddingTop: 40,
    paddingBottom: 70
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
    opacity: 0.10,
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
  segTrack: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    padding: SEG_PAD,
    marginBottom: 14,
  },
  segIndicator: {
    position: 'absolute',
    top: SEG_PAD,
    bottom: SEG_PAD,
    borderRadius: 18,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 2 },
    }),
  },
  segTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
  },
  segTabLabel: {
    fontFamily: F.sans600,
    fontSize: 12,
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
  card: {
    borderRadius: RADIUS,
    borderWidth: BORDER_W,
    overflow: 'hidden',
  },
  cardHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
  cardContent: {
    padding: 14,
    gap: 10,
  },
  input: {
    fontFamily: F.sans400,
    fontSize: 15,
    lineHeight: 20,
    minHeight: 90,
    maxHeight: 100,
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
