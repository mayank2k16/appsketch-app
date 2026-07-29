import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createCoderTenant, type AppTypeKey } from '@/api/coder';
import { APP_TABS, DEFAULT_MODEL, fmtContext, MODELS } from '@/containers/Home/AgentV2';
import { AppTypePills } from '@/components/ui/AppTypePills';
import { PromptComposer } from '@/components/ui/PromptComposer';
import { F } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';
import { toast } from '@/lib/toast';

export function AgentScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);

  const router = useRouter();

  const [appType, setAppType] = React.useState<AppTypeKey>('web');
  const [prompt, setPrompt] = React.useState('');
  const [model, setModel] = React.useState(DEFAULT_MODEL);
  const [images, setImages] = React.useState<string[]>([]);
  const [sending, setSending] = React.useState(false);

  const activeTab = APP_TABS.find((tab) => tab.key === appType) ?? APP_TABS[0];

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
        behavior="padding"
        style={{ paddingBottom: insets.bottom || 12 }}
      >
        <View style={s.typePillRow}>
          <AppTypePills t={t} value={appType} onChange={setAppType} />
        </View>

        <View style={s.composerWrap}>
          <PromptComposer
            t={t}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Ask the agent to build something…"
            images={images}
            onImagesChange={setImages}
            models={MODELS}
            model={model}
            onModelChange={setModel}
            formatContext={fmtContext}
            onSend={handleSend}
            sending={sending}
          />
        </View>
      </KeyboardAvoidingView>
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
    marginHorizontal: 18,
    marginBottom: 10,
  },
  composerWrap: {
    marginHorizontal: 18,
  },
});
