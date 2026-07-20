import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const HEADER_LOGO = require('../../assets/logo.png');

import { Text } from '@/components/ui';
import { signOut, useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/lib/tenant';
import { F } from '@/lib/fonts';
import { drawerTheme } from '@/containers/Home/theme/HomeTheme';
import { useSelectedTheme } from '@/lib/hooks/use-selected-theme';

const { width: SCREEN_W } = Dimensions.get('window');
const DRAWER_W = Math.min(SCREEN_W * 0.72, 290);

// ─── Brand constants (non-themed) ─────────────────────────────────────────────
// Matches the app's primary accent (see appTheme.accent) so the drawer reads
// as part of the same brand as the home screen, not a separate red theme.
const ACCENT = '#6C5CE7';

type DrawerMenuProps = {
  visible: boolean;
  onClose: () => void;
};

// This build's only other screens (Feed/Style/Settings under the `(app)`
// route group) are leftover starter-kit boilerplate that isn't wired to
// onboarding/tenant state correctly — navigating there bounces straight
// back to /home. No real routes to add here until those are fixed or new
// screens are built, so this stays empty rather than shipping dead links.
const AUTH_MENU_ITEMS: { id: string; label: string; route: string; emoji: string }[] = [];

const GUEST_MENU_ITEMS: { id: string; label: string; route: string; emoji: string }[] = [];

// ─── Pulsing orange dot ────────────────────────────────────────────────────────
function LiveDot() {
  const pulse = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.7, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 12, height: 12 }}>
      <Animated.View style={[st.dotRing, { transform: [{ scale: pulse }] }]} />
      <View style={[st.dotCore, StyleSheet.absoluteFillObject, { margin: 'auto' }]} />
    </View>
  );
}

// ─── Theme toggle pill ─────────────────────────────────────────────────────────
function ThemeTogglePill({ isDark }: { isDark: boolean }) {
  const anim = React.useRef(new Animated.Value(isDark ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: isDark ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [isDark]);

  const trackBg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(17,17,17,0.15)', ACCENT],
  });
  const thumbX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 18] });

  return (
    <Animated.View style={[pill.track, { backgroundColor: trackBg }]}>
      <Animated.View style={[pill.thumb, { transform: [{ translateX: thumbX }] }]} />
    </Animated.View>
  );
}

const pill = StyleSheet.create({
  track: {
    width: 38, height: 22, borderRadius: 11,
    justifyContent: 'center',
  },
  thumb: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 2 },
    }),
  },
});

// ─── DrawerMenu ────────────────────────────────────────────────────────────────
export function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const router = useRouter();
  const { tenantConfig } = useTenant();
  const status = useAuth.use.status();
  const isGuest = status === 'guest';
  const MENU_ITEMS = isGuest ? GUEST_MENU_ITEMS : AUTH_MENU_ITEMS;
  const { colorScheme } = useColorScheme();
  const dt = drawerTheme[colorScheme === 'dark' ? 'dark' : 'light'];
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();
  const isDark = colorScheme === 'dark';

  const logo = tenantConfig?.logo ?? tenantConfig?.branding?.logo ?? null;

  // ── Animation values ────────────────────────────────────────────────────────
  const translateX = React.useRef(new Animated.Value(DRAWER_W)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  // Allocate for the largest list (AUTH) plus a dedicated trailing slot for
  // the sign-in/logout row's own animation, so that row never shares an
  // Animated.Value with the last menu item.
  const itemAnims = React.useRef(
    Array.from({ length: AUTH_MENU_ITEMS.length + 1 }, () => new Animated.Value(0))
  ).current;

  const [modalVisible, setModalVisible] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setModalVisible(true);
      translateX.setValue(0);
      overlayOpacity.setValue(1);
      itemAnims.forEach(a => a.setValue(1));
    } else {
      translateX.setValue(DRAWER_W);
      overlayOpacity.setValue(0);
      setModalVisible(false);
    }
  }, [visible]);

  function handlePress(route: string) {
    onClose();
    setTimeout(() => router.push(route as never), 80);
  }

  function handleLogout() {
    onClose();
    setTimeout(() => { signOut(); router.replace('/home'); }, 80);
  }

  function handleSignIn() {
    onClose();
    setTimeout(() => router.replace('/login'), 80);
  }

  function handleThemeToggle() {
    setSelectedTheme(isDark ? 'light' : 'dark');
  }

  function handleShare() {
    Share.share({
      message: 'Check out Appsketch — write anything and it compiles your dream interface in real-time. https://appsketch.ai',
      url: 'https://appsketch.ai',
    }).catch(() => { });
  }

  const themeLabel = selectedTheme === 'dark'
    ? 'Dark Mode'
    : selectedTheme === 'light'
      ? 'Light Mode'
      : isDark ? 'Dark (System)' : 'Light (System)';

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* ── Backdrop ── */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { opacity: overlayOpacity }]}
        pointerEvents="none"
      >
        <View style={[st.overlay, { backgroundColor: dt.overlay }]} />
      </Animated.View>

      {/* Tap outside to close */}
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

      {/* ── Drawer panel ── */}
      <Animated.View style={[st.drawer, { backgroundColor: dt.panelBg, shadowColor: dt.shadow, transform: [{ translateX }] }]}>

        {/* ── Brand header — minimal: mark + static wordmark + close, one
            hairline border underneath. No shimmer/glow competing with the
            list below it. ── */}
        <View style={[st.brandHeader, { backgroundColor: dt.headerBg, borderBottomColor: dt.bottomBorder }]}>
          <View style={st.brandInner}>
            <View style={st.markClip}>
              <ExpoImage source={HEADER_LOGO} style={st.markImg} contentFit="contain" />
            </View>

            <Text style={[st.wordmarkFlat, { color: dt.wordmarkColor }]}>Appsketch</Text>

            <TouchableOpacity
              onPress={onClose}
              style={[st.closeBtn, { backgroundColor: dt.closeIconBg }]}
              activeOpacity={0.7}
            >
              <Text style={[st.closeBtnTxt, { color: dt.closeIconText }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Menu items ── */}
        <ScrollView
          style={{ flex: 1, backgroundColor: dt.scrollBg }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 24 }}
        >
          {MENU_ITEMS.length > 0 && (
            <>
              <Text style={[st.sectionLabel, { color: dt.dimColor }]}>Menu</Text>
              {MENU_ITEMS.map((item, idx) => {
                const anim = itemAnims[idx];
                return (
                  <Animated.View
                    key={item.id}
                    style={{
                      opacity: anim,
                      transform: [{
                        translateX: anim.interpolate({
                          inputRange: [0, 1], outputRange: [28, 0],
                        }),
                      }],
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => handlePress(item.route)}
                      style={st.flatRow}
                      activeOpacity={0.5}
                    >
                      <Text style={st.flatIcon}>{item.emoji}</Text>
                      <Text style={[st.flatLabel, { color: dt.labelColor }]}>{item.label}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </>
          )}

          <Text style={[st.sectionLabel, { color: dt.dimColor }]}>Preferences</Text>

          {/* ── Theme toggle ── */}
          <TouchableOpacity onPress={handleThemeToggle} style={st.flatRow} activeOpacity={0.5}>
            <Text style={st.flatIcon}>{isDark ? '🌙' : '☀️'}</Text>
            <Text style={[st.flatLabel, { color: dt.labelColor }]}>{themeLabel}</Text>
            <ThemeTogglePill isDark={isDark} />
          </TouchableOpacity>

          {/* ── Share ── */}
          <TouchableOpacity onPress={handleShare} style={st.flatRow} activeOpacity={0.5}>
            <Text style={st.flatIcon}>📤</Text>
            <Text style={[st.flatLabel, { color: dt.labelColor }]}>Share Appsketch</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={[st.divider, { backgroundColor: `${ACCENT}25` }]} />

          <Text style={[st.sectionLabel, { color: dt.dimColor }]}>Account</Text>

          {/* Sign in / Log out */}
          <Animated.View
            style={{
              opacity: itemAnims[itemAnims.length - 1],
              transform: [{
                translateX: itemAnims[itemAnims.length - 1].interpolate({
                  inputRange: [0, 1], outputRange: [28, 0],
                }),
              }],
            }}
          >
            {isGuest ? (
              <TouchableOpacity onPress={handleSignIn} style={st.flatRow} activeOpacity={0.5}>
                <Text style={st.flatIcon}>🔑</Text>
                <Text style={[st.flatLabel, { color: ACCENT }]}>Sign In / Register</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleLogout} style={st.flatRow} activeOpacity={0.5}>
                <Text style={st.flatIcon}>🚪</Text>
                <Text style={[st.flatLabel, { color: '#EF4444' }]}>Log Out</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>

        {/* ── Bottom bar ── */}
        <TouchableOpacity
          style={[st.bottomBar, { backgroundColor: dt.bottomBg, borderColor: dt.bottomBorder }]}
          activeOpacity={0.7}
          onPress={() => Linking.openURL('https://appsketch.ai')}
        >
          <TextInput
            editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
            value="Powered by Appsketch"
            style={[st.versionText, { color: dt.bottomText }]}
          />
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  overlay: {
    flex: 1,
  },

  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_W,
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 28,
    overflow: 'hidden',
  },

  // Brand header — flat, one hairline border underneath, no animated glow
  brandHeader: {
    paddingTop: Platform.OS === 'ios' ? 56 : 22,
    paddingBottom: 0,
    borderBottomWidth: 1,
  },

  brandInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },

  // Real app logo, small and square — no glow behind it
  markClip: {
    width: 30,
    height: 30,
    borderRadius: 8,
    overflow: 'hidden',
  },
  markImg: {
    width: 30,
    height: 30,
  },

  wordmarkFlat: {
    flex: 1,
    fontFamily: F.sans800,
    fontSize: 15,
    letterSpacing: -0.1,
  },

  sectionLabel: {
    fontFamily: F.sans700,
    fontSize: 10.5,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 6,
  },

  // Legacy square logo (kept in case tenant config provides one)
  logo: { width: 44, height: 44, borderRadius: 10 },
  logoFallback: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: DIM_RED,
    borderWidth: 1.5,
    borderColor: `${ACCENT}60`,
  },
  logoEmoji: {
    fontSize: 22,
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    height: 28,
    textAlign: 'center',
    width: 30,
  },

  subtitle: {
    fontFamily: F.sans500,
    fontSize: 10,
    color: `${ACCENT}CC`,
    letterSpacing: 0.4,
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    height: 14,
    flex: 1,
  },

  // Pulsing live dot
  dotRing: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: ACCENT,
    opacity: 0.45,
  },
  dotCore: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: ACCENT,
    alignSelf: 'center',
    margin: 'auto' as any,
    // Center it inside the 12×12 wrapper
    position: 'absolute',
    top: 3.5,
    left: 3.5,
  },

  // Close button — bg/text applied inline from theme
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnTxt: {
    fontSize: 11,
    fontFamily: F.sans700,
    lineHeight: 14,
  },

  // Flat rows — no card background/border, icon sits plain next to the
  // label. Full-width tap target instead of an inset pill.
  flatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 11,
    gap: 12,
  },
  flatIcon: {
    fontSize: 17,
    width: 20,
    textAlign: 'center',
  },
  flatLabel: {
    flex: 1,
    fontFamily: F.sans600,
    fontSize: 13.5,
    letterSpacing: 0.1,
  },

  divider: {
    height: 1,
    marginHorizontal: 20,
    marginVertical: 10,
  },

  // Bottom bar — bg/border/text applied inline from theme
  bottomBar: {
    borderTopWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  versionText: {
    fontFamily: F.sans500,
    fontSize: 11,
    letterSpacing: 0.3,
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    height: 14,
  },
});
