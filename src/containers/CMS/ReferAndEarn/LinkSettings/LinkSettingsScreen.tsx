import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ReferralLinkConfig } from '@/api/referrals';
import { useReferralLinkConfig, useUpdateReferralLinkConfig } from '@/api/referrals';
import { toast } from '@/lib/toast';

import { CmsButton, CmsCard, CmsInput, CmsSwitch } from '../../components';
import { useCmsTheme } from '../../theme';

// Shown until the backend link-config endpoint responds, so the settings
// form is always visible in the CMS (even before the backend is deployed) —
// matches Vite's `DEFAULT_LINK_CFG`.
const DEFAULT_LINK_CFG: ReferralLinkConfig = {
  universal_domain: 'appsketch.ai',
  web_signup_path: '/signup',
  app_scheme: '',
  ios_store_url: '',
  android_store_url: '',
  ios_app_id: '',
  android_package: '',
  android_sha256_fingerprints: [],
  share_message_template: '',
  landing_bg_color: '#C41230',
  is_active: true,
};

const HEX_RE = /^#([0-9a-f]{6})$/i;

export function LinkSettingsScreen() {
  const { colors } = useCmsTheme();
  const configQuery = useReferralLinkConfig();
  const updateConfig = useUpdateReferralLinkConfig();

  const [cfg, setCfg] = React.useState<ReferralLinkConfig>(DEFAULT_LINK_CFG);
  const [fpText, setFpText] = React.useState('');
  const [loadedOnce, setLoadedOnce] = React.useState(false);

  React.useEffect(() => {
    if (configQuery.data && !loadedOnce) {
      setCfg(configQuery.data);
      setFpText((configQuery.data.android_sha256_fingerprints || []).join('\n'));
      setLoadedOnce(true);
    }
  }, [configQuery.data, loadedOnce]);

  function set<K extends keyof ReferralLinkConfig>(key: K, value: ReferralLinkConfig[K]) {
    setCfg((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (cfg.landing_bg_color && !HEX_RE.test(cfg.landing_bg_color)) {
      toast.error('Enter a valid hex colour like #C41230');
      return;
    }
    updateConfig.mutate({
      ...cfg,
      android_sha256_fingerprints: fpText
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={st.scroll}>
      <Text style={[st.intro, { color: colors.textSecondary }]}>
        Each user's shareable link is{' '}
        <Text style={{ fontFamily: 'monospace' }}>
          https://{cfg.universal_domain || 'appsketch.ai'}/r/&lt;tenant&gt;/&lt;CODE&gt;
        </Text>{' '}
        — it opens the app if installed, else falls back to the store or web signup.
      </Text>

      <CmsCard colors={colors} title="Link Configuration">
        <CmsInput colors={colors} label="Universal domain" value={cfg.universal_domain} onChangeText={(v) => set('universal_domain', v)} />
        <CmsInput colors={colors} label="Web signup path" value={cfg.web_signup_path} onChangeText={(v) => set('web_signup_path', v)} />
        <CmsInput colors={colors} label="App scheme (e.g. appsketch-ecommerce)" value={cfg.app_scheme} onChangeText={(v) => set('app_scheme', v)} />
        <CmsInput colors={colors} label="iOS appID for AASA (TEAMID.bundle)" value={cfg.ios_app_id} onChangeText={(v) => set('ios_app_id', v)} />
        <CmsInput colors={colors} label="Android package" value={cfg.android_package} onChangeText={(v) => set('android_package', v)} />
        <CmsInput colors={colors} label="iOS App Store URL" value={cfg.ios_store_url} onChangeText={(v) => set('ios_store_url', v)} />
        <CmsInput colors={colors} label="Android Play Store URL" value={cfg.android_store_url} onChangeText={(v) => set('android_store_url', v)} />
        <CmsInput
          colors={colors}
          label="Share message ({code}, {link}, {brand})"
          value={cfg.share_message_template}
          onChangeText={(v) => set('share_message_template', v)}
          multiline
          numberOfLines={3}
        />
      </CmsCard>

      <CmsCard colors={colors} title="Android App Links">
        <CmsInput
          colors={colors}
          label="Signing-cert SHA-256 fingerprints (one per line)"
          placeholder={'AA:BB:CC:…\nDD:EE:FF:…'}
          value={fpText}
          onChangeText={setFpText}
          multiline
          numberOfLines={4}
        />
        <Text style={[st.hint, { color: colors.textSecondary }]}>
          Needed for Android App Links to auto-open the app. From Play Console → App integrity, or `keytool -list -v
          -keystore your.keystore`.
        </Text>
      </CmsCard>

      <CmsCard colors={colors} title="Landing Page">
        <View style={st.colourRow}>
          <View style={[st.swatch, { borderColor: colors.border, backgroundColor: HEX_RE.test(cfg.landing_bg_color) ? cfg.landing_bg_color : 'transparent' }]} />
          <View style={{ flex: 1 }}>
            <CmsInput colors={colors} label="Background colour" placeholder="#C41230" value={cfg.landing_bg_color} onChangeText={(v) => set('landing_bg_color', v)} />
          </View>
        </View>
        <Text style={[st.hint, { color: colors.textSecondary }]}>
          Sets the background of the /r/ referral landing page. Buttons and accents derive from it automatically.
        </Text>
        <CmsSwitch colors={colors} label="Links active" value={cfg.is_active} onChange={(v) => set('is_active', v)} />
      </CmsCard>

      <CmsButton colors={colors} label={updateConfig.isPending ? 'Saving…' : 'Save link settings'} onPress={handleSave} loading={updateConfig.isPending} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  intro: { fontSize: 12.5, lineHeight: 18 },
  hint: { fontSize: 11.5, lineHeight: 16 },
  colourRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  swatch: { width: 32, height: 32, borderRadius: 8, borderWidth: 1 },
});
