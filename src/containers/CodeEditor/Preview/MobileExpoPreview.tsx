import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useIsFocused } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { previewUrlForTenant } from '@/api/coder';
import { PressableScale } from '@/components/ui';
import { useOpenGuestApp } from '@/lib/guest-app';
import { haptic } from '@/lib/haptics';
import type { AppColors } from '@/lib/theme';
import { toast } from '@/lib/toast';

import { useExpoUrlPoll } from '../hooks/useExpoUrlPoll';

/**
 * Opens the app once each time the Preview tab gains focus. Coming back from
 * the app ("Back to AppSketch") doesn't change focus, so it doesn't loop.
 */
function useAutoOpen(
  link: string | null,
  focused: boolean,
  open: (link: string) => unknown
) {
  const openedFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!focused) {
      openedFor.current = null;
      return;
    }
    if (!link || openedFor.current === link) return;
    openedFor.current = link;
    open(link);
  }, [link, focused, open]);
}

/** Share (system sheet: WhatsApp, Instagram, …) and Copy link. */
function ShareActions({ link, colors }: { link: string; colors: AppColors }) {
  async function share() {
    await Share.share({
      message: `Try my app, built with AppSketch: ${link}`,
      url: link,
    });
  }
  async function copy() {
    await Clipboard.setStringAsync(link);
    toast.success('Link copied.');
  }
  return (
    <View style={st.row}>
      <PressableScale
        onPress={share}
        style={[st.btn, { backgroundColor: '#f2600c' }]}
      >
        <Ionicons name="share-social-outline" size={15} color="#FFFFFF" />
        <Text style={st.btnLabel}>Share</Text>
      </PressableScale>
      <PressableScale
        onPress={copy}
        style={[st.btn, st.btnGhost, { borderColor: colors.codeEditorBorder }]}
      >
        <Ionicons name="copy-outline" size={15} color={colors.text} />
        <Text style={[st.btnLabel, { color: colors.text }]}>Copy link</Text>
      </PressableScale>
    </View>
  );
}

/** Dark keeps its scrim; white dims lightly, ink-tinted rather than black. */
const scrimFor = (colors: AppColors) =>
  colors.statusBar === 'light-content'
    ? 'rgba(0,0,0,0.55)'
    : 'rgba(11,11,12,0.28)';

/** The small share button's sheet: QR for another phone + the system share. */
function ShareSheet({
  link,
  visible,
  onClose,
  colors,
}: {
  link: string;
  visible: boolean;
  onClose: () => void;
  colors: AppColors;
}) {
  return (
    <Modal
      onShow={haptic.soft}
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPressIn={haptic.tap}
        style={[st.scrim, { backgroundColor: scrimFor(colors) }]}
        onPress={onClose}
      >
        <Pressable
          style={[
            st.sheet,
            {
              backgroundColor: colors.codeEditorSurface,
              borderColor: colors.codeEditorBorder,
            },
          ]}
        >
          <Text style={[st.sheetTitle, { color: colors.text }]}>
            Share your app
          </Text>
          <View style={[st.qrBox, { borderColor: colors.codeEditorBorder }]}>
            <QRCode
              value={link}
              size={176}
              color="#000000"
              backgroundColor="#FFFFFF"
            />
          </View>
          <Text style={[st.sheetHint, { color: colors.textSub }]}>
            Anyone can open the link in a browser. In AppSketch, scan the code
            to run it as a real app.
          </Text>
          <ShareActions link={link} colors={colors} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** The small round share button in the corner. */
function ShareIcon({
  onPress,
  colors,
}: {
  onPress: () => void;
  colors: AppColors;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel="Share app"
      style={[st.shareIcon, { borderColor: colors.codeEditorBorder }]}
    >
      <Ionicons name="qr-code-outline" size={18} color={colors.text} />
    </PressableScale>
  );
}

/** What the panel says while the app opens, after it closes, or without the host. */
function Status({
  opening,
  ready,
  supported,
  colors,
}: {
  opening: boolean;
  ready: boolean;
  supported: boolean;
  colors: AppColors;
}) {
  const title = !supported
    ? 'Preview in Expo Go'
    : opening || !ready
      ? 'Starting your app…'
      : 'Your app runs right here';
  const body = !supported
    ? 'This build of AppSketch can’t run apps. Open the preview in Expo Go instead.'
    : opening || !ready
      ? 'The first start of a session can take up to a minute.'
      : 'It opens full screen, with your latest changes. Use the AS bubble to come back.';
  return (
    <>
      <View style={[st.icon, { borderColor: colors.codeEditorBorder }]}>
        {opening || !ready ? (
          <ActivityIndicator color="#f2600c" />
        ) : (
          <Ionicons
            name="phone-portrait-outline"
            size={30}
            color={colors.text}
          />
        )}
      </View>
      <Text style={[st.title, { color: colors.text }]}>{title}</Text>
      <Text style={[st.subtitle, { color: colors.textSub }]}>{body}</Text>
    </>
  );
}

/**
 * Mobile (Expo) app_type preview. The app opens straight away, natively inside
 * AppSketch (appsketch-host), loaded over https through the workspace's
 * `/preview/<uuid>/` path. Sharing (QR, WhatsApp, …) sits behind a small icon.
 * Builds without the host fall back to Expo Go on the `exp://` tunnel.
 */
export function MobileExpoPreview({
  tenantId,
  tenantUid,
  colors,
}: {
  tenantId: string;
  /** The workspace's preview path; also wakes its dev server. */
  tenantUid?: string;
  colors: AppColors;
}) {
  const isFocused = useIsFocused();
  const expoUrl = useExpoUrlPoll(tenantId, isFocused, tenantUid);
  const guest = useOpenGuestApp();
  const [sharing, setSharing] = React.useState(false);

  const previewLink = tenantUid ? previewUrlForTenant(tenantUid) : null;
  const runLink = previewLink ?? expoUrl;
  const shareLink = previewLink ?? expoUrl;

  useAutoOpen(guest.supported ? runLink : null, isFocused, guest.open);

  function handleOpen() {
    if (!runLink) return;
    if (guest.supported) guest.open(runLink);
    else if (expoUrl) Linking.openURL(expoUrl);
  }

  return (
    <View style={[st.root, { backgroundColor: colors.bg }]}>
      {shareLink ? (
        <ShareIcon onPress={() => setSharing(true)} colors={colors} />
      ) : null}

      <Status
        opening={guest.opening}
        ready={!!runLink}
        supported={guest.supported}
        colors={colors}
      />

      <PressableScale
        haptic="press"
        onPress={handleOpen}
        disabled={!runLink || guest.opening}
        style={[st.btn, st.btnWide, { backgroundColor: '#f2600c' }]}
      >
        <Ionicons name="play" size={15} color="#FFFFFF" />
        <Text style={st.btnLabel}>
          {guest.supported ? 'Open app' : 'Open in Expo Go'}
        </Text>
      </PressableScale>

      {shareLink ? (
        <ShareSheet
          link={shareLink}
          visible={sharing}
          onClose={() => setSharing(false)}
          colors={colors}
        />
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  shareIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  subtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 280,
  },
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  btnWide: { minWidth: 180 },
  btnGhost: { borderWidth: 1 },
  btnLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  qrBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  sheetHint: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 14,
    marginBottom: 16,
  },
});
