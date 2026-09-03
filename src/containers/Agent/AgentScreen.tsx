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

import { type AppTypeKey, createCoderTenant } from '@/api/coder';
import { AuthGateModal } from '@/components/AuthForm/AuthGateModal';
import { AppTypePills } from '@/components/ui/AppTypePills';
import {
  PromptComposer,
  type PromptModel,
} from '@/components/ui/PromptComposer';
import { UpgradeSheet } from '@/components/ui/UpgradeSheet';
import {
  APP_TABS,
  DEFAULT_MODEL,
  fmtContext,
  MODELS,
} from '@/containers/Home/AgentV2';
import { useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { useCoderQuota } from '@/lib/hooks/use-coder-quota';
import { BRAND_RAMP, useCoderTheme, type AppColors } from '@/lib/theme';
import { toast } from '@/lib/toast';

const [BRAND_ORANGE, BRAND_MAGENTA, BRAND_VIOLET] = BRAND_RAMP;

/**
 * The handful of tokens on this screen that are allowed to carry colour.
 *
 * Agent runs on `useCoderTheme` — the achromatic palette shared with Studio,
 * Marketplace and the code editor, where grey is deliberate (see CoderTheme's
 * header). That left this screen with a white "Web" pill, a grey send button
 * and a grey "AI Agent" badge: correct for an editor chrome, wrong for the
 * screen a user lands on to start a build.
 *
 * So the greyscale base stays and only the *action* surfaces are retuned —
 * the ones a user is meant to reach for. Scoped here rather than in
 * CoderTheme because the editor screens genuinely want them grey; this is the
 * same one-function pattern `scopeHome` uses on the other side.
 */
function scopeAgent(base: AppColors): AppColors {
  return {
    ...base,

    // Send button, and the selected Web/Mobile pill beside it.
    agentSendGradient: [BRAND_ORANGE, BRAND_VIOLET],
    agentTabActiveBg: BRAND_MAGENTA,
    agentTabActiveText: '#FFFFFF',

    // The two sparkle avatars — the big one in the header and the small one
    // on the message card. Both were flat #0D0D0D on #0D0D0D, i.e. a white
    // glyph floating on nothing.
    codeEditorUserBubbleFrom: BRAND_ORANGE,
    codeEditorUserBubbleTo: BRAND_VIOLET,

    // "⚡ AI Agent" badge.
    codeEditorToolChipActiveBg: `${BRAND_MAGENTA}29`,
    codeEditorToolChipActiveBorder: `${BRAND_MAGENTA}66`,
    codeEditorToolChipActiveText: BRAND_MAGENTA,
  };
}

export function AgentScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const coder = useCoderTheme(colorScheme);
  const t = React.useMemo(() => scopeAgent(coder), [coder]);

  const router = useRouter();

  const [appType, setAppType] = React.useState<AppTypeKey>('web');
  const [prompt, setPrompt] = React.useState('');
  const [model, setModel] = React.useState(DEFAULT_MODEL);
  const [images, setImages] = React.useState<string[]>([]);
  const [sending, setSending] = React.useState(false);
  const [upgradeModel, setUpgradeModel] = React.useState<PromptModel | null>(
    null
  );
  const [gateOpen, setGateOpen] = React.useState(false);

  const allowedModels = useCoderQuota();

  const activeTab = APP_TABS.find((tab) => tab.key === appType) ?? APP_TABS[0];

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
    } catch {
      toast.error("Couldn't start your build. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={t.statusBar}
      />

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
            <View
              style={[
                s.statusDot,
                {
                  backgroundColor: t.codeEditorConnectedDot,
                  borderColor: t.bg,
                },
              ]}
            />
          </View>
          <Text style={[s.hello, { color: t.text }]}>Hello👋</Text>
          <Text style={[s.helloSub, { color: t.textSub }]}>
            Agent is here to help you build your next app.
          </Text>
        </View>

        <View
          style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}
        >
          <View
            style={[
              s.cardHeader,
              { backgroundColor: t.surface, borderBottomColor: t.border },
            ]}
          >
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
              <Ionicons
                name="flash"
                size={9}
                color={t.codeEditorToolChipActiveText}
              />
              <Text
                style={[
                  s.aiBadgeText,
                  { color: t.codeEditorToolChipActiveText },
                ]}
              >
                AI Agent
              </Text>
            </View>
          </View>
          <View style={s.cardBody}>
            <Text
              style={[s.cardBodyText, { color: t.codeEditorChatAssistantText }]}
            >
              Hi there 👋 I'm here to help with your project. What would you
              like to build today?
            </Text>
          </View>
        </View>

        <View style={s.suggestionRow}>
          {activeTab.suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion}
              onPress={() => setPrompt(suggestion)}
              activeOpacity={0.7}
              style={[
                s.suggestionChip,
                {
                  backgroundColor: t.agentTabBg,
                  borderColor: t.agentTabBorder,
                },
              ]}
            >
              <Ionicons
                name="sparkles-outline"
                size={15}
                // Brand, not `agentTabIcon` — the chips themselves stay on the
                // achromatic surface, and a single tinted glyph is enough to
                // mark them as the suggested way in without turning four cards
                // into four coloured blocks.
                color={BRAND_MAGENTA}
                style={s.suggestionIcon}
              />
              <Text
                style={[s.suggestionText, { color: t.agentTabText }]}
                numberOfLines={3}
              >
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
            allowedModels={allowedModels}
            onLockedModelPress={setUpgradeModel}
          />
        </View>
      </KeyboardAvoidingView>

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
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: 8,
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
    justifyContent: 'center',
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
    width: '100%',
  },
  suggestionIcon: {
    marginBottom: 2,
  },
  suggestionText: {
    flex: 1,
    fontFamily: F.sans500,
    fontSize: 11,
    lineHeight: 15,
  },
  // Standalone type pills — a visible gap between each other and below to
  // the composer (deliberately not attached/flush, unlike Home's tabs).
  typePillRow: {
    marginHorizontal: 8,
    marginBottom: 10,
  },
  composerWrap: {
    marginHorizontal: 8,
  },
});
