import { Ionicons } from '@expo/vector-icons';
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
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createCoderTenant } from '@/api/coder';
import { APP_TABS, DEFAULT_MODEL, fmtContext, MODELS } from '@/containers/Home/AgentV2';
import { useVoiceInput } from '@/containers/Home/AgentV2/use-voice-input';
import { F } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';
import { toast } from '@/lib/toast';

const MAX_IMAGES = 3;

type AppTypeKey = 'web' | 'mobile' | 'game';

// Standalone type-select pills above the composer — deliberately separate,
// independently-rounded pills (unlike AgentV2's browser-tabs on Home, which
// fuse into the card below). Purely a UI affordance over the same `appType`
// state the suggestion chips already drive.
const TYPE_PILLS: { key: AppTypeKey; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'web', label: 'Web', icon: 'globe-outline' },
  { key: 'mobile', label: 'App', icon: 'phone-portrait-outline' },
  { key: 'game', label: 'Game', icon: 'game-controller-outline' },
];

export function AgentScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);

  const router = useRouter();

  const [appType, setAppType] = React.useState<AppTypeKey>('web');
  const [prompt, setPrompt] = React.useState('');
  const [model, setModel] = React.useState(DEFAULT_MODEL);
  const [images, setImages] = React.useState<string[]>([]);
  const [modelPickerOpen, setModelPickerOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const selectedModel = MODELS.find((m) => m.value === model) ?? MODELS[0];
  const activeTab = APP_TABS.find((tab) => tab.key === appType) ?? APP_TABS[0];

  const voice = useVoiceInput(prompt, setPrompt);

  // Mic button pulses while actively listening.
  const micPulse = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    if (voice.listening) {
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
    }
    micPulse.setValue(1);
  }, [voice.listening, micPulse]);

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
      const tenant = await createCoderTenant({ title: text.slice(0, 60), appType });
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
    } catch {
      toast.error("Couldn't start your build. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={t.statusBar} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.header}>
          <View style={s.avatarWrap}>
            <LinearGradient
              colors={[t.codeEditorUserBubbleFrom, t.codeEditorUserBubbleTo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.avatar}
            >
              <Ionicons name="sparkles" size={22} color="#FFFFFF" />
            </LinearGradient>
            <View style={[s.statusDot, { backgroundColor: t.codeEditorConnectedDot, borderColor: t.bg }]} />
          </View>
          <Text style={[s.hello, { color: t.text }]}>Hello👋</Text>
          <Text style={[s.helloSub, { color: t.textSub }]}>
            Agent is here to help you build your next app.
          </Text>
        </View>

        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={[s.cardHeader, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
            <LinearGradient
              colors={[t.codeEditorUserBubbleFrom, t.codeEditorUserBubbleTo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.cardAvatar}
            >
              <Ionicons name="sparkles" size={11} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[s.cardAgentName, { color: t.text }]}>Agent</Text>
            <View style={{ flex: 1 }} />
            <View
              style={[
                s.aiBadge,
                {
                  backgroundColor: t.codeEditorToolChipActiveBg,
                  borderColor: t.codeEditorToolChipActiveBorder,
                },
              ]}
            >
              <Ionicons name="flash" size={9} color={t.codeEditorToolChipActiveText} />
              <Text style={[s.aiBadgeText, { color: t.codeEditorToolChipActiveText }]}>AI Agent</Text>
            </View>
          </View>
          <View style={s.cardBody}>
            <Text style={[s.cardBodyText, { color: t.codeEditorChatAssistantText }]}>
              Hi there 👋 I'm here to help with your project. What would you like to build today?
            </Text>
          </View>
        </View>

        <View style={s.suggestionRow}>
          {activeTab.suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion}
              onPress={() => setPrompt(suggestion)}
              activeOpacity={0.7}
              style={[s.suggestionChip, { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder }]}
            >
              <Ionicons name="sparkles-outline" size={15} color={t.agentTabIcon} style={s.suggestionIcon} />
              <Text style={[s.suggestionText, { color: t.agentTabText }]} numberOfLines={3}>
                {suggestion}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ paddingBottom: insets.bottom || 12 }}
      >
        <View style={s.typePillRow}>
          {TYPE_PILLS.map((p) => {
            const active = p.key === appType;
            return (
              <TouchableOpacity
                key={p.key}
                onPress={() => setAppType(p.key)}
                activeOpacity={0.8}
                style={[
                  s.typePill,
                  {
                    backgroundColor: active ? t.agentTabActiveBg : t.agentTabBg,
                    borderColor: active ? t.agentTabActiveBg : t.agentTabBorder,
                  },
                ]}
              >
                <Ionicons name={p.icon} size={14} color={active ? t.agentTabActiveText : t.agentTabIcon} />
                <Text
                  style={[s.typePillLabel, { color: active ? t.agentTabActiveText : t.agentTabText }]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[s.composer, { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder }]}>
          <TextInput
            placeholder="Ask the agent to build something…"
            placeholderTextColor={t.agentInputPlaceholder}
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
                  <Pressable
                    onPress={() => removeImage(i)}
                    style={[s.thumbRemove, { backgroundColor: t.agentBtnBg }]}
                    hitSlop={6}
                  >
                    <Ionicons name="close" size={11} color={t.agentBtnIcon} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <View style={s.composerRow}>
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

            {voice.supported && (
              <TouchableOpacity
                onPress={voice.toggle}
                activeOpacity={0.7}
                style={[
                  s.circleBtn,
                  {
                    backgroundColor: voice.listening ? `${t.codeEditorDanger}1A` : t.agentBtnBg,
                    borderColor: voice.listening ? t.codeEditorDanger : t.agentBtnBorder,
                  },
                ]}
              >
                <Animated.View style={{ transform: [{ scale: micPulse }] }}>
                  <Ionicons
                    name={voice.listening ? 'mic' : 'mic-outline'}
                    size={18}
                    color={voice.listening ? t.codeEditorDanger : t.agentBtnIcon}
                  />
                </Animated.View>
              </TouchableOpacity>
            )}

            <View style={{ flex: 1 }} />

            <TouchableOpacity onPress={handleSend} activeOpacity={0.8} disabled={sending || !prompt.trim()}>
              <LinearGradient
                colors={[...t.agentSendGradient] as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[s.sendBtn, (sending || !prompt.trim()) && { opacity: 0.5 }]}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={modelPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModelPickerOpen(false)}
      >
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
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 14,
  },
  header: {
    alignItems: 'center',
    gap: 6,
    paddingBottom: 4,
  },
  avatarWrap: {
    width: 52,
    height: 52,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  hello: {
    fontFamily: F.sans900,
    fontSize: 22,
    marginTop: 6,
  },
  helloSub: {
    fontFamily: F.sans400,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  cardAvatar: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAgentName: {
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
  cardBody: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardBodyText: {
    fontFamily: F.sans400,
    fontSize: 14.5,
    lineHeight: 21,
  },
  suggestionRow: {
    flexDirection: 'column',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  suggestionChip: {
    flex: 1,
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    width: "100%"
  },
  suggestionIcon: {
    marginBottom: 2,
  },
  suggestionText: {
    fontFamily: F.sans500,
    fontSize: 11,
    lineHeight: 15,
  },
  // Standalone type pills — a visible gap between each other and below to
  // the composer (deliberately not attached/flush, unlike Home's tabs).
  typePillRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 18,
    marginBottom: 10,
  },
  typePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  typePillLabel: {
    fontFamily: F.sans600,
    fontSize: 12,
  },
  composer: {
    marginHorizontal: 18,
    borderRadius: 17,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  input: {
    fontFamily: F.sans400,
    fontSize: 14.5,
    lineHeight: 20,
    // Enlarged prompt box, then reduced (96 → 75).
    minHeight: 75,
    maxHeight: 150,
    paddingHorizontal: 2,
    textAlignVertical: 'top',
  },
  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
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
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    // Was 150 — just under the width of "MiniMax M3 · free" + chevron, which
    // clipped the chevron at the edge. Roomier cap; long labels still
    // truncate via numberOfLines on the label.
    maxWidth: 185,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 11,
  },
  modelChipLabel: {
    fontFamily: F.sans600,
    fontSize: 11.5,
    flexShrink: 1,
  },
  circleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
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

export default AgentScreen;