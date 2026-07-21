import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { ActivityIndicator, Animated, Easing, Linking, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useUseTemplate } from '@/api/templates';
import { useAppTheme } from '@/lib/theme';

// `react-native-webview` has no RN-Web implementation (same guard as the CMS's
// email-template preview) — the web build uses a plain DOM `<iframe>` instead,
// which browsers support natively for cross-origin content.
let WebView: React.ComponentType<any> | null = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  WebView = require('react-native-webview').WebView;
}
const isWeb = Platform.OS === 'web';

const CREATE_STEPS = ['Fetching your template…', 'Spinning up your workspace…', 'Publishing your app…'];

export function AppPreviewScreen() {
  const { uuid: uuidParam, templateId, name } = useLocalSearchParams<{
    uuid?: string;
    templateId?: string;
    name?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);

  const useTemplate = useUseTemplate();
  const [phase, setPhase] = React.useState<'creating' | 'ready' | 'error'>(uuidParam ? 'ready' : 'creating');
  const [uuid, setUuid] = React.useState<string | undefined>(uuidParam);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [webStatus, setWebStatus] = React.useState<'loading' | 'loaded' | 'error'>('loading');
  const [reloadKey, setReloadKey] = React.useState(0);
  // Only the very first load blocks the screen — once the site's shown once,
  // in-app link taps re-fire the WebView's loading events too, and covering
  // the whole screen again on every single navigation made it look like the
  // app had frozen (a full opaque overlay, with nothing to dismiss it if the
  // event never resolves on flaky WebView navigations, e.g. Android).
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
  const navStallTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasStartedRef = React.useRef(false);

  function runCreate() {
    if (!templateId) return;
    setPhase('creating');
    setErrorMessage(null);
    useTemplate.mutate(
      { id: Number(templateId), name: name || 'your app' },
      {
        onSuccess: (res) => {
          setUuid(res.uuid);
          setPhase('ready');
        },
        onError: (error) => {
          const message =
            (error.response?.data as { detail?: string; message?: string } | undefined)?.detail ??
            (error.response?.data as { detail?: string; message?: string } | undefined)?.message ??
            'Something went wrong while creating your app.';
          setErrorMessage(message);
          setPhase('error');
        },
      }
    );
  }

  React.useEffect(() => {
    if (uuidParam || hasStartedRef.current) return;
    hasStartedRef.current = true;
    runCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const url = uuid ? `https://appsketch.ai/app/${uuid}/` : undefined;

  function handleOpenInBrowser() {
    if (url) Linking.openURL(url);
  }

  function handleRetryLoad() {
    setWebStatus('loading');
    setHasLoadedOnce(false);
    setReloadKey((k) => k + 1);
  }

  // Safety valve: if an in-app navigation's loading state never resolves
  // (known flaky on Android WebView), stop blocking the UI after a bit
  // instead of sitting on "Loading your app…" forever.
  function armStallTimer() {
    if (navStallTimer.current) clearTimeout(navStallTimer.current);
    navStallTimer.current = setTimeout(() => setWebStatus('loaded'), 10000);
  }
  function disarmStallTimer() {
    if (navStallTimer.current) {
      clearTimeout(navStallTimer.current);
      navStallTimer.current = null;
    }
  }
  React.useEffect(() => () => disarmStallTimer(), []);

  function handleRetryCreate() {
    hasStartedRef.current = true;
    runCreate();
  }

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={t.statusBar} />

      <View style={[st.header, { paddingTop: insets.top + 10, borderColor: t.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={st.backBtn}>
          <Ionicons name="chevron-back" size={22} color={t.text} />
        </TouchableOpacity>
        <Text style={[st.title, { color: t.text }]} numberOfLines={1}>
          {name || 'Preview'}
        </Text>
        <TouchableOpacity onPress={handleOpenInBrowser} hitSlop={10} style={st.openBtn} disabled={!url}>
          <Ionicons name="open-outline" size={20} color={url ? t.text : t.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={st.body}>
        {phase === 'creating' && <CreatingState t={t} name={name} />}

        {phase === 'error' && (
          <View style={st.center}>
            <View style={[st.errorIconWrap, { backgroundColor: 'rgba(255,92,92,0.14)' }]}>
              <Ionicons name="alert-circle-outline" size={28} color="#FF5C5C" />
            </View>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 15, marginBottom: 4 }}>Couldn't create your app</Text>
            <Text style={{ color: t.textSub, fontSize: 12.5, marginBottom: 20, textAlign: 'center' }}>{errorMessage}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => router.back()} style={[st.retryBtn, { backgroundColor: t.templatesChipBg, borderWidth: 1, borderColor: t.templatesChipBorder }]}>
                <Text style={[st.retryBtnText, { color: t.text }]}>Back to templates</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRetryCreate} style={[st.retryBtn, { backgroundColor: t.accent }]}>
                <Text style={st.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {phase === 'ready' &&
          (!url ? (
            <View style={st.center}>
              <Text style={{ color: t.textSub }}>Missing app to preview.</Text>
            </View>
          ) : isWeb ? (
            <>
              {React.createElement('iframe', {
                key: reloadKey,
                src: url,
                style: { ...StyleSheet.absoluteFillObject, border: 0, width: '100%', height: '100%' },
                onLoad: () => setWebStatus('loaded'),
              })}
              {webStatus === 'loading' && (
                <View style={[st.center, StyleSheet.absoluteFill, { backgroundColor: t.bg }]} pointerEvents="none">
                  <ActivityIndicator size="small" color={t.accent} />
                  <Text style={{ color: t.textSub, marginTop: 8 }}>Loading your app…</Text>
                </View>
              )}
            </>
          ) : WebView ? (
            <>
              <WebView
                key={reloadKey}
                source={{ uri: url }}
                style={StyleSheet.absoluteFill}
                // `onNavigationStateChange` (loading: boolean) drives every
                // load — including in-app link taps — instead of
                // onLoadStart/onLoadEnd, which is documented as unreliable
                // on Android for some redirect/navigation chains.
                onNavigationStateChange={(navState: { loading: boolean }) => {
                  if (navState.loading) {
                    setWebStatus('loading');
                    if (hasLoadedOnce) armStallTimer();
                  } else {
                    disarmStallTimer();
                    setHasLoadedOnce(true);
                    setWebStatus((s) => (s === 'error' ? s : 'loaded'));
                  }
                }}
                onError={() => setWebStatus('error')}
                onHttpError={() => setWebStatus('error')}
              />
              {webStatus === 'loading' && !hasLoadedOnce && (
                <View style={[st.center, StyleSheet.absoluteFill, { backgroundColor: t.bg }]} pointerEvents="none">
                  <ActivityIndicator size="small" color={t.accent} />
                  <Text style={{ color: t.textSub, marginTop: 8 }}>Loading your app…</Text>
                </View>
              )}
              {webStatus === 'loading' && hasLoadedOnce && <TopProgressBar t={t} />}
              {webStatus === 'error' && (
                <View style={[st.center, StyleSheet.absoluteFill, { backgroundColor: t.bg }]}>
                  <Text style={{ color: t.text, fontWeight: '700', marginBottom: 4 }}>Couldn't load this app</Text>
                  <Text style={{ color: t.textSub, fontSize: 12.5, marginBottom: 16 }}>Check your connection and try again.</Text>
                  <TouchableOpacity onPress={handleRetryLoad} style={[st.retryBtn, { backgroundColor: t.accent }]}>
                    <Text style={st.retryBtnText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={st.center}>
              <Text style={{ color: t.text, fontWeight: '700', marginBottom: 4 }}>Preview unavailable here</Text>
              <Text style={{ color: t.textSub, fontSize: 12.5, marginBottom: 16, textAlign: 'center', paddingHorizontal: 32 }}>
                Open it in your browser instead.
              </Text>
              <TouchableOpacity onPress={handleOpenInBrowser} style={[st.retryBtn, { backgroundColor: t.accent }]}>
                <Text style={st.retryBtnText}>Open in Browser</Text>
              </TouchableOpacity>
            </View>
          ))}
      </View>
    </View>
  );
}

/** Creative "building your app" state shown the instant the user taps
 * Preview — the create-tenant chain runs in the background while this is
 * on screen, so it owns all the perceived-progress feedback. */
function CreatingState({ t, name }: { t: ReturnType<typeof useAppTheme>; name?: string }) {
  const [stepIndex, setStepIndex] = React.useState(0);
  const pulse1 = React.useRef(new Animated.Value(0)).current;
  const pulse2 = React.useRef(new Animated.Value(0)).current;
  const spin = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const t1 = setTimeout(() => setStepIndex(1), 1500);
    const t2 = setTimeout(() => setStepIndex(2), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  React.useEffect(() => {
    const makePulse = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    const p1 = makePulse(pulse1, 0);
    const p2 = makePulse(pulse2, 800);
    const rot = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true }));
    p1.start();
    p2.start();
    rot.start();
    return () => {
      p1.stop();
      p2.stop();
      rot.stop();
    };
  }, [pulse1, pulse2, spin]);

  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={st.center}>
      <View style={st.orbWrap}>
        {[pulse1, pulse2].map((val, i) => (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              st.pulseRing,
              {
                borderColor: t.accent,
                opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
                transform: [{ scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }],
              },
            ]}
          />
        ))}
        <Animated.View style={[st.orbRing, { borderColor: t.accent, transform: [{ rotate: spinDeg }] }]} />
        <View style={[st.orbCore, { backgroundColor: t.accent }]}>
          <Ionicons name="sparkles" size={22} color="#FFFFFF" />
        </View>
      </View>

      <Text style={[st.creatingTitle, { color: t.text }]}>Building {name ? `"${name}"` : 'your app'}</Text>
      <Text style={[st.creatingSub, { color: t.textSub }]}>This usually takes a few seconds.</Text>

      <View style={st.stepList}>
        {CREATE_STEPS.map((label, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <View key={label} style={st.stepRow}>
              <View
                style={[
                  st.stepDot,
                  { borderColor: done || active ? t.accent : t.templatesChipBorder },
                  done && { backgroundColor: t.accent },
                ]}
              >
                {done ? <Ionicons name="checkmark" size={11} color="#FFFFFF" /> : active ? <ActivityIndicator size="small" color={t.accent} /> : null}
              </View>
              <Text style={[st.stepLabel, { color: done || active ? t.text : t.textMuted }]}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Non-blocking loading indicator for in-app navigations after the first
 * load — a full-screen cover here is what made subsequent link taps look
 * frozen, since it sat on top of (and blocked touches into) the WebView. */
function TopProgressBar({ t }: { t: ReturnType<typeof useAppTheme> }) {
  const pulse = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View pointerEvents="none" style={st.topBarTrack}>
      <Animated.View style={[st.topBarFill, { backgroundColor: t.accent, opacity: pulse }]} />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  openBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  body: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  retryBtn: { height: 38, paddingHorizontal: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  retryBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  errorIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  topBarTrack: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  topBarFill: { flex: 1 },

  orbWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  pulseRing: { position: 'absolute', width: 72, height: 72, borderRadius: 36, borderWidth: 1.5 },
  orbRing: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  orbCore: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  creatingTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  creatingSub: { fontSize: 12.5, marginBottom: 28 },
  stepList: { width: '100%', maxWidth: 280, gap: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 12.5, fontWeight: '600' },
});
