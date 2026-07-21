import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as React from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { toast } from '@/lib/toast';
import type { AppColors } from '@/lib/theme';

import { useExpoUrlPoll } from '../hooks/useExpoUrlPoll';

/** Mobile (Expo) app_type preview — a phone-frame + QR pointing at the
 * backend's `exp://…exp.direct` tunnel, mirroring Vite's `.cw-expo-panel`.
 * There's no in-app WebView preview for native RN screens (nothing to
 * render them with), so this is the actual "see your app running" surface
 * for mobile builds — open it with a real device via Expo Go. */
export function MobileExpoPreview({ tenantId, colors }: { tenantId: string; colors: AppColors }) {
  const isFocused = useIsFocused();
  const expoUrl = useExpoUrlPoll(tenantId, isFocused);

  async function handleCopy() {
    if (!expoUrl) return;
    await Clipboard.setStringAsync(expoUrl);
    toast.success('Copied the Expo Go link.');
  }

  function handleOpen() {
    if (expoUrl) Linking.openURL(expoUrl);
  }

  return (
    <View style={[st.root, { backgroundColor: colors.bg }]}>
      <View style={[st.phoneFrame, { borderColor: colors.codeEditorBorder, backgroundColor: colors.codeEditorSurface }]}>
        <View style={[st.notch, { backgroundColor: colors.codeEditorBorder }]} />
        {expoUrl ? (
          <View style={st.qrWrap}>
            <QRCode value={expoUrl} size={168} color={colors.text} backgroundColor="transparent" />
          </View>
        ) : (
          <View style={st.qrWrap}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={{ color: colors.textSub, fontSize: 12, marginTop: 10, textAlign: 'center' }}>
              Waiting for your app to boot…
            </Text>
          </View>
        )}
      </View>

      <Text style={[st.title, { color: colors.text }]}>Scan with Expo Go</Text>
      <Text style={[st.subtitle, { color: colors.textSub }]}>
        Install the free Expo Go app, then scan this code to preview your app live on a real device.
      </Text>

      <View style={st.actionsRow}>
        <TouchableOpacity
          onPress={handleOpen}
          disabled={!expoUrl}
          style={[st.actionBtn, { backgroundColor: colors.accent }, !expoUrl && st.actionBtnDisabled]}
        >
          <Ionicons name="phone-portrait-outline" size={15} color="#FFFFFF" />
          <Text style={st.actionLabelPrimary}>Open in Expo Go</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCopy}
          disabled={!expoUrl}
          style={[st.actionBtn, { backgroundColor: colors.codeEditorTabBg, borderWidth: 1, borderColor: colors.codeEditorBorder }, !expoUrl && st.actionBtnDisabled]}
        >
          <Ionicons name="copy-outline" size={15} color={colors.text} />
          <Text style={[st.actionLabelSecondary, { color: colors.text }]}>Copy link</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  phoneFrame: {
    width: 220,
    height: 240,
    borderRadius: 28,
    borderWidth: 6,
    alignItems: 'center',
    paddingTop: 22,
    marginBottom: 20,
  },
  notch: { position: 'absolute', top: 6, width: 60, height: 8, borderRadius: 4 },
  qrWrap: { alignItems: 'center', justifyContent: 'center', width: 180, height: 180 },
  title: { fontSize: 15.5, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 12.5, textAlign: 'center', lineHeight: 18, marginBottom: 20, maxWidth: 280 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 16, borderRadius: 10 },
  actionBtnDisabled: { opacity: 0.5 },
  actionLabelPrimary: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  actionLabelSecondary: { fontSize: 12.5, fontWeight: '700' },
});
