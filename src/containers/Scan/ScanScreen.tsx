/* eslint-disable unicorn/filename-case, max-lines-per-function --
   Container screens here are PascalCase, like MarketplaceScreen; the camera,
   permission and paste states read best as one component. */
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui';
import { useOpenGuestApp } from '@/lib/guest-app';
import { useAppTheme } from '@/lib/theme';

/**
 * Scan the QR from a Coder workspace (or any AppSketch app link) and run that
 * app right here, the way Expo Go opens a project. A link can also be pasted.
 */
export function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const isDark = colorScheme === 'dark';
  const [permission, requestPermission] = useCameraPermissions();
  const { open, opening } = useOpenGuestApp();
  const params = useLocalSearchParams<{ url?: string }>();
  const [link, setLink] = React.useState(params.url ?? '');
  // The camera reports the same code many times a second; handle it once.
  const lastScan = React.useRef<{ data: string; at: number } | null>(null);

  const handleScan = React.useCallback(
    ({ data }: { data: string }) => {
      const now = Date.now();
      const last = lastScan.current;
      if (opening || (last && last.data === data && now - last.at < 4000))
        return;
      lastScan.current = { data, at: now };
      open(data);
    },
    [open, opening]
  );

  // Open a link handed over in the URL once, on arrival.
  const handedOver = React.useRef(false);
  React.useEffect(() => {
    if (params.url && !handedOver.current) {
      handedOver.current = true;
      open(params.url);
    }
  }, [params.url, open]);

  const camera = (() => {
    if (Platform.OS === 'web') {
      return (
        <Text style={[st.note, { color: t.textSub }]}>
          Scanning works in the phone app.
        </Text>
      );
    }
    if (!permission) return <ActivityIndicator color={t.text} />;
    if (!permission.granted) {
      return (
        <View style={st.permission}>
          <Text style={[st.note, { color: t.textSub }]}>
            AppSketch needs the camera to read the QR code in your workspace.
          </Text>
          <PressableScale
            onPress={requestPermission}
            style={[st.primary, { backgroundColor: t.accent }]}
          >
            <Text style={[st.primaryLabel, { color: t.accentOn }]}>
              Allow camera
            </Text>
          </PressableScale>
        </View>
      );
    }
    return (
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={opening ? undefined : handleScan}
      />
    );
  })();

  return (
    <KeyboardAvoidingView
      style={[
        st.root,
        {
          backgroundColor: t.bg,
          paddingTop: insets.top,
        },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={st.header}>
        <PressableScale
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={24} color={t.text} />
        </PressableScale>
        <Text style={[st.title, { color: t.text }]}>Run an app</Text>
        <View style={{ width: 24 }} />
      </View>

      <View
        style={[
          st.viewfinder,
          { borderColor: t.border, backgroundColor: t.surface },
        ]}
      >
        {camera}
        {opening && (
          <View
            style={[
              st.opening,
              // White: solid paper, no translucent veil over the camera.
              !isDark && { backgroundColor: '#FAFAF8' },
            ]}
          >
            <ActivityIndicator color={isDark ? '#FFFFFF' : t.accent} />
            <Text style={[st.openingLabel, !isDark && { color: t.text }]}>
              Opening app…
            </Text>
          </View>
        )}
      </View>

      <Text style={[st.help, { color: t.textSub }]}>
        Point the camera at the QR code in your AppSketch workspace. The app
        opens here; tap the AS bubble to reload it or come back.
      </Text>

      <View style={[st.linkRow, { paddingBottom: insets.bottom + 16 }]}>
        <TextInput
          value={link}
          onChangeText={setLink}
          placeholder="…or paste an app link"
          placeholderTextColor={t.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={() => link.trim() && open(link)}
          style={[
            st.input,
            {
              color: t.text,
              borderColor: t.border,
              backgroundColor: t.surface,
            },
          ]}
        />
        <PressableScale
          haptic="press"
          disabled={!link.trim() || opening}
          onPress={() => open(link)}
          style={[st.go, { backgroundColor: t.accent }]}
          accessibilityLabel="Open link"
        >
          <Ionicons name="arrow-forward" size={18} color={t.accentOn} />
        </PressableScale>
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 17, fontWeight: '700' },
  viewfinder: {
    marginHorizontal: 16,
    marginTop: 8,
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permission: { alignItems: 'center', paddingHorizontal: 24, gap: 16 },
  note: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  primary: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
  },
  primaryLabel: { fontSize: 14, fontWeight: '700' },
  opening: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  openingLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  help: {
    marginHorizontal: 24,
    marginTop: 16,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  linkRow: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  go: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
