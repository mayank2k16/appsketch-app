import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const HEADER_LOGO = require('../../assets/chinese_corner.png');

import { Text } from '@/components/ui';
import { signOut, useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/lib/tenant';
import { F } from '@/lib/fonts';
import { drawerTheme } from '@/containers/Home/theme/HomeTheme';
import { useSelectedTheme } from '@/lib/hooks/use-selected-theme';

const { width: SCREEN_W } = Dimensions.get('window');
const DRAWER_W = Math.min(SCREEN_W * 0.72, 290);

// ─── Brand constants (non-themed) ─────────────────────────────────────────────
const RED = '#C41230';

// shimmer strip width
const SHINE_W = DRAWER_W * 0.45;

type DrawerMenuProps = {
  visible: boolean;
  onClose: () => void;
};

// Storefront routes were removed for now — no menu items until they're back.
const AUTH_MENU_ITEMS: { id: string; label: string; route: string; emoji: string }[] = [];

const GUEST_MENU_ITEMS: { id: string; label: string; route: string; emoji: string }[] = [];

// ─── Shimmer wordmark ──────────────────────────────────────────────────────────
function ShimmerWordmark({ wordmarkColor, shimmerMid }: { wordmarkColor: string; shimmerMid: string }) {
  const shimX = React.useRef(new Animated.Value(-SHINE_W)).current;

  React.useEffect(() => {
    const run = () => {
      shimX.setValue(-SHINE_W);
      Animated.timing(shimX, {
        toValue: DRAWER_W + SHINE_W,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => { if (finished) setTimeout(run, 3200); });
    };
    const t = setTimeout(run, 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ overflow: 'hidden', flex: 1 }}>
      <TextInput
        editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
        value="CHINESE CORNER"
        style={[st.wordmark, { color: wordmarkColor }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: shimX }] }]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(128,128,128,0.05)', shimmerMid, 'rgba(128,128,128,0.05)', 'transparent']}
          locations={[0, 0.2, 0.5, 0.8, 1]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ width: SHINE_W, height: '100%' }}
        />
      </Animated.View>
    </View>
  );
}

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
    outputRange: ['rgba(17,17,17,0.15)', RED],
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
  const { colorScheme }                    = useColorScheme();
  const dt                                 = drawerTheme[colorScheme === 'dark' ? 'dark' : 'light'];
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();
  const isDark                             = colorScheme === 'dark';

  const logo = tenantConfig?.logo ?? tenantConfig?.branding?.logo ?? null;

  // ── Animation values ────────────────────────────────────────────────────────
  const translateX = React.useRef(new Animated.Value(DRAWER_W)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  // Always allocate for the largest list (AUTH), plus 1 reserved for the
  // sign-in/logout row's own animation — kept at length >= 1 even with no menu items.
  const itemAnims = React.useRef(
    Array.from({ length: Math.max(AUTH_MENU_ITEMS.length, 1) }, () => new Animated.Value(0))
  ).current;
  const logoBrandAnim = React.useRef(new Animated.Value(0)).current;
  const headerLineAnim = React.useRef(new Animated.Value(0)).current;

  const [modalVisible, setModalVisible] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setModalVisible(true);
      translateX.setValue(DRAWER_W);
      overlayOpacity.setValue(0);
      logoBrandAnim.setValue(0);
      headerLineAnim.setValue(0);
      itemAnims.forEach(a => a.setValue(0));

      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1, duration: 200, useNativeDriver: true,
        }),
        Animated.spring(translateX, {
          toValue: 0, tension: 80, friction: 12, useNativeDriver: true,
        }),
        Animated.timing(logoBrandAnim, {
          toValue: 1, duration: 260, delay: 80, useNativeDriver: true,
        }),
        Animated.timing(headerLineAnim, {
          toValue: 1, duration: 400, delay: 220,
          easing: Easing.out(Easing.ease), useNativeDriver: false,
        }),
        // Always includes the last slot, reserved for the sign-in/logout row —
        // it must animate even when MENU_ITEMS is empty.
        Animated.stagger(
          50,
          itemAnims.slice(0, Math.max(MENU_ITEMS.length, 1)).map(a =>
            Animated.spring(a, {
              toValue: 1, tension: 95, friction: 13, useNativeDriver: true,
            })
          )
        ),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: DRAWER_W, duration: 180, useNativeDriver: true }),
      ]).start(() => setModalVisible(false));
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

  const themeLabel = selectedTheme === 'dark'
    ? 'Dark Mode'
    : selectedTheme === 'light'
      ? 'Light Mode'
      : isDark ? 'Dark (System)' : 'Light (System)';

  const headerLineW = headerLineAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, DRAWER_W],
  });

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

        {/* ── Brand header ── */}
        <View style={[st.brandHeader, { backgroundColor: dt.headerBg }]}>
          {/* Animated red bottom-border line grows in */}
          <Animated.View style={[st.headerUnderline, { width: headerLineW, backgroundColor: dt.accentLine }]} />

          <Animated.View
            style={[
              st.brandInner,
              {
                opacity: logoBrandAnim,
                transform: [{
                  translateY: logoBrandAnim.interpolate({
                    inputRange: [0, 1], outputRange: [8, 0],
                  }),
                }],
              },
            ]}
          >
            {/* Wide 16:9 brand logo */}
            <View style={st.logoClip}>
              <ExpoImage
                source={HEADER_LOGO}
                style={st.logoWide}
                contentFit="contain"
              />
            </View>

            {/* Shimmer wordmark — adapts to theme */}
            <ShimmerWordmark
              wordmarkColor={dt.wordmarkColor}
              shimmerMid={dt.shimmerMid}
            />

            {/* Close button */}
            <TouchableOpacity
              onPress={onClose}
              style={[st.closeBtn, { backgroundColor: dt.closeIconBg, borderColor: dt.closeIconBorder }]}
              activeOpacity={0.7}
            >
              <Text style={[st.closeBtnTxt, { color: dt.closeIconText }]}>✕</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* ── Decorative red line under header ── */}
        <View style={[st.headerAccentBar, { backgroundColor: dt.accentLine }]} />

        {/* ── Menu items ── */}
        <ScrollView
          style={{ flex: 1, backgroundColor: dt.scrollBg }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 24 }}
        >
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
                  style={[st.menuRow, { backgroundColor: dt.rowBg, borderColor: dt.rowBorder, borderWidth: 1 }]}
                  activeOpacity={0.6}
                >
                  <View style={[st.iconWrap, { backgroundColor: dt.iconWrapBg }]}>
                    <Text style={{ fontSize: 16, lineHeight: 20 }}>{item.emoji}</Text>
                  </View>
                  <Text style={[st.menuLabel, { color: dt.labelColor }]}>{item.label}</Text>
                  <Text style={[st.chevron, { color: RED }]}>›</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          {/* ── Theme toggle ── */}
          <TouchableOpacity
            onPress={handleThemeToggle}
            style={[st.menuRow, { backgroundColor: dt.rowBg, borderColor: dt.rowBorder, borderWidth: 1 }]}
            activeOpacity={0.6}
          >
            <View style={[st.iconWrap, { backgroundColor: dt.iconWrapBg }]}>
              <Text style={{ fontSize: 16, lineHeight: 20 }}>{isDark ? '🌙' : '☀️'}</Text>
            </View>
            <Text style={[st.menuLabel, { color: dt.labelColor }]}>{themeLabel}</Text>
            <ThemeTogglePill isDark={isDark} />
          </TouchableOpacity>

          {/* Divider */}
          <View style={[st.divider, { backgroundColor: `${RED}25` }]} />

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
              <TouchableOpacity
                onPress={handleSignIn}
                style={[st.menuRow, { backgroundColor: dt.rowBg, borderColor: dt.rowBorder, borderWidth: 1 }]}
                activeOpacity={0.6}
              >
                <View style={[st.iconWrap, { backgroundColor: `${RED}20` }]}>
                  <Text style={{ fontSize: 16, lineHeight: 20 }}>🔑</Text>
                </View>
                <Text style={[st.menuLabel, { color: RED }]}>Sign In / Register</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleLogout}
                style={[st.menuRow, { backgroundColor: dt.rowBg, borderColor: dt.rowBorder, borderWidth: 1 }]}
                activeOpacity={0.6}
              >
                <View style={[st.iconWrap, { backgroundColor: 'rgba(220,38,38,0.14)' }]}>
                  <Text style={{ fontSize: 16, lineHeight: 20 }}>🚪</Text>
                </View>
                <Text style={[st.menuLabel, { color: '#EF4444' }]}>Log Out</Text>
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

  // Brand header
  brandHeader: {
    paddingTop: Platform.OS === 'ios' ? 56 : 22,
    paddingBottom: 0,
  },

  brandInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },

  // Animated red line that grows across the bottom of the header
  headerUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 1.5,
    opacity: 0.6,
  },

  // 2px solid red bar below the header
  headerAccentBar: {
    height: 2,
    ...Platform.select({
      ios: { shadowColor: RED, shadowOpacity: 0.7, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
    }),
  },

  // Clip wrapper — provides the consistent rounded corners
  logoClip: {
    width: 100,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
  },
  // Wide 16:9 logo fills the clip wrapper exactly
  logoWide: {
    width: 100,
    height: 56,
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
    borderColor: `${RED}60`,
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

  wordmark: {
    fontFamily: F.sans900,
    fontSize: 13,
    letterSpacing: 2.5,
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    height: 18,
  },

  subtitle: {
    fontFamily: F.sans500,
    fontSize: 10,
    color: `${RED}CC`,
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
    borderColor: RED,
    opacity: 0.45,
  },
  dotCore: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: RED,
    alignSelf: 'center',
    margin: 'auto' as any,
    // Center it inside the 12×12 wrapper
    position: 'absolute',
    top: 3.5,
    left: 3.5,
  },

  // Close button — bg/border/text applied inline from theme
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnTxt: {
    fontSize: 13,
    fontFamily: F.sans700,
    lineHeight: 16,
  },

  // Menu rows — bg/border applied inline from theme
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 13,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontFamily: F.sans600,
    fontSize: 14,
    letterSpacing: 0.1,
  },
  chevron: {
    fontSize: 20,
    lineHeight: 22,
    fontFamily: F.sans400,
    opacity: 0.7,
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
