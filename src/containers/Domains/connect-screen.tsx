import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiError, useConnectDomain } from '@/api/app-domains';
import type { TenantSummary } from '@/api/studio';
import {
  AppPicker,
  ScreenHeader,
  type ServicesPalette,
  StateNote,
  tint,
  useServicesTheme,
} from '@/components/services';
import { PressableScale } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { haptic } from '@/lib/haptics';

/** "https://www.Brand.com/x" → "www.brand.com". */
const clean = (v: string) =>
  v
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
const valid = (v: string) => /^([a-z0-9-]+\.)+[a-z]{2,}$/.test(v);

function MobileNote({ s }: { s: ServicesPalette }) {
  return (
    <View style={[st.note, { backgroundColor: tint(s.warning, 0.08) }]}>
      <Ionicons name="phone-portrait-outline" size={15} color={s.warning} />
      <Text style={[st.noteText, { color: s.text }]}>
        This is a mobile app. A domain serves a website, so it will wait until
        this app has a web version. You can attach it to a website any time.
      </Text>
    </View>
  );
}

function useConnect(app: TenantSummary | null, domain: string) {
  const router = useRouter();
  const m = useConnectDomain();
  const [error, setError] = React.useState<string | null>(null);
  const go = () => {
    if (!app) return setError('Pick the app this domain should open.');
    if (!valid(domain)) return setError('Enter a domain like yourbrand.com');
    setError(null);
    m.mutate(
      { tenant_id: app.id, domain },
      {
        onSuccess: (d) => {
          haptic.success();
          router.replace(`/domains/${d.id}`);
        },
        onError: (e) => setError(apiError(e)),
      }
    );
  };
  return { go, error, busy: m.isPending };
}

function Form({ s }: { s: ServicesPalette }) {
  const [app, setApp] = React.useState<TenantSummary | null>(null);
  const [text, setText] = React.useState('');
  const domain = clean(text);
  const c = useConnect(app, domain);
  return (
    <>
      <Text style={[st.step, { color: s.text }]}>
        1 · Which app should it open?
      </Text>
      <AppPicker s={s} value={app?.id ?? null} onChange={setApp} />
      {app?.app_type === 'mobile' ? <MobileNote s={s} /> : null}
      <Text style={[st.step, { color: s.text }]}>2 · Your domain</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="yourbrand.com"
        placeholderTextColor={s.muted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        style={[
          st.input,
          { color: s.text, backgroundColor: s.raised, borderColor: s.hairline },
        ]}
      />
      {c.error ? (
        <Text style={[st.error, { color: s.error }]}>{c.error}</Text>
      ) : null}
      <PressableScale
        onPress={c.go}
        disabled={c.busy}
        disabledOpacity={1}
        style={[st.btn, { backgroundColor: s.orange }]}
      >
        {c.busy ? (
          <ActivityIndicator color={s.onOrange} />
        ) : (
          <Text style={[st.btnText, { color: s.onOrange }]}>
            Connect domain
          </Text>
        )}
      </PressableScale>
      <Text style={[st.hint, { color: s.muted }]}>
        Next you will point the domain at us. We check it every few seconds,
        then build, secure (HTTPS) and launch your site automatically.
      </Text>
    </>
  );
}

/** /domains/connect — attach a domain you already own to one of your apps. */
export function ConnectScreen() {
  const { t, s } = useServicesTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const signedIn = useAuth.use.status() === 'signIn';
  return (
    <View style={[st.root, { backgroundColor: s.canvas }]}>
      <StatusBar barStyle={t.statusBar} />
      <ScreenHeader s={s} title="Connect a domain" />
      <KeyboardAwareScrollView
        bottomOffset={40}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[st.body, { paddingBottom: insets.bottom + 30 }]}
      >
        {signedIn ? (
          <Form s={s} />
        ) : (
          <StateNote
            s={s}
            title="Sign in to connect a domain"
            action="Sign in"
            onAction={() =>
              router.push({ pathname: '/welcome', params: { return: '1' } })
            }
          />
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  body: { padding: 12, gap: 10 },
  step: { fontFamily: F.sans700, fontSize: 13.5, marginTop: 6 },
  note: { flexDirection: 'row', gap: 8, borderRadius: 12, padding: 10 },
  noteText: { flex: 1, fontFamily: F.sans500, fontSize: 12, lineHeight: 17 },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: F.sans500,
    fontSize: 15,
  },
  error: { fontFamily: F.sans600, fontSize: 12.5 },
  btn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnText: { fontFamily: F.sans700, fontSize: 15 },
  hint: {
    fontFamily: F.sans400,
    fontSize: 11.5,
    lineHeight: 16,
    textAlign: 'center',
  },
});
