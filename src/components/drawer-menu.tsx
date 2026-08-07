import { BlurView } from 'expo-blur';
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
import { Ionicons } from '@expo/vector-icons';

const HEADER_LOGO = require('../../assets/logo.png');

import { Text } from '@/components/ui';
import { signOut, useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { drawerTheme, type DrawerColors } from '@/containers/Home/theme/HomeTheme';
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
// screens are built. `/about` is a real, standalone route (src/app/about.tsx)
// so it's safe to link for both signed-in and guest users.
type MenuItem = { id: string; label: string; route: string; icon: React.ComponentProps<typeof Ionicons>['name'] };

// Account/cart shortcuts get their own section, above the general links.
const QUICK_ACCESS_ITEMS: MenuItem[] = [
  { id: 'profile', label: 'My Account', route: '/profile', icon: 'person-outline' },
  { id: 'cart', label: 'Cart', route: '/cart', icon: 'cart-outline' },
];

// Signed-in only (matches Profile's own "Help & Support" entry) — a guest
// has no account for a support agent to attach the conversation to.
const SUPPORT_ITEM: MenuItem = {
  id: 'support',
  label: 'Help & Support',
  route: '/support',
  icon: 'help-buoy-outline',
};
// Reserved animation slots for Quick Access, sized for the signed-in case
// (Quick Access + Support) so item indices stay stable whether or not the
// guest variant actually renders every slot.
const QUICK_SLOT_COUNT = QUICK_ACCESS_ITEMS.length + 1;

const AUTH_MENU_ITEMS: MenuItem[] = [
  { id: 'pricing', label: 'Pricing & Plans', route: '/pricing', icon: 'pricetag-outline' },
  { id: 'about', label: 'About Us', route: '/about', icon: 'information-circle-outline' },
  { id: 'contact', label: 'Contact Us', route: '/contact', icon: 'call-outline' },
  { id: 'privacy', label: 'Privacy Policy', route: '/privacy-policy', icon: 'shield-checkmark-outline' },
  { id: 'tnc', label: 'Terms & Conditions', route: '/tnc', icon: 'document-text-outline' },
];

const GUEST_MENU_ITEMS: MenuItem[] = AUTH_MENU_ITEMS;

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

// ─── Elegant card row ──────────────────────────────────────────────────────────
// Every menu row shares this: a bordered card with a tinted circular icon
// badge, replacing the previous flat icon-next-to-label list.
function DrawerRow({
  dt,
  icon,
  label,
  iconColor,
  labelColor,
  onPress,
  right,
}: {
  dt: DrawerColors;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  iconColor?: string;
  labelColor?: string;
  onPress: () => void;
  right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      style={[st.row, { backgroundColor: dt.rowBg, borderColor: dt.rowBorder }]}
    >
      <View style={[st.iconWrap, { backgroundColor: dt.iconWrapBg }]}>
        <Ionicons name={icon} size={16} color={iconColor ?? ACCENT} />
      </View>
      <Text style={[st.rowLabel, { color: labelColor ?? dt.labelColor }]}>{label}</Text>
      {right}
    </TouchableOpacity>
  );
}

// ─── DrawerMenu ────────────────────────────────────────────────────────────────
export function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const router = useRouter();
  const status = useAuth.use.status();
  const isGuest = status === 'guest';
  const isSignedIn = status === 'signIn';
  const MENU_ITEMS = isGuest ? GUEST_MENU_ITEMS : AUTH_MENU_ITEMS;
  const quickAccessItems = isSignedIn ? [...QUICK_ACCESS_ITEMS, SUPPORT_ITEM] : QUICK_ACCESS_ITEMS;
  const { colorScheme } = useColorScheme();
  const dt = drawerTheme[colorScheme === 'dark' ? 'dark' : 'light'];
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();
  const isDark = colorScheme === 'dark';

  // ── Animation values ────────────────────────────────────────────────────────
  const translateX = React.useRef(new Animated.Value(DRAWER_W)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  // Allocate for the largest list (AUTH) plus a dedicated trailing slot for
  // the sign-in/logout row's own animation, so that row never shares an
  // Animated.Value with the last menu item. Quick Access always reserves
  // QUICK_SLOT_COUNT slots (its signed-in size) so indices don't shift
  // between guest/signed-in renders.
  const itemAnims = React.useRef(
    Array.from({ length: QUICK_SLOT_COUNT + AUTH_MENU_ITEMS.length + 1 }, () => new Animated.Value(0))
  ).current;

  const [modalVisible, setModalVisible] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setModalVisible(true);
      translateX.setValue(DRAWER_W);
      overlayOpacity.setValue(0);
      itemAnims.forEach(a => a.setValue(0));

      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 260, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();

      Animated.stagger(
        40,
        itemAnims.map(a => Animated.timing(a, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }))
      ).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: DRAWER_W, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]).start(() => setModalVisible(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handlePress(route: string) {
    onClose();
    setTimeout(() => router.push(route as never), 80);
  }

  function handleLogout() {
    onClose();
    setTimeout(() => { signOut(); router.replace('/login'); }, 80);
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

      {/* ── Drawer panel — full-panel glass: same BlurView-plus-tint-overlay
          recipe as AgentV2's prompt card / Marketplace's TemplateCard, just
          tuned to a heavier tint (esp. in light mode) since this is a much
          bigger, taller glass surface than a small card. ── */}
      <Animated.View style={[st.drawer, { shadowColor: dt.shadow, transform: [{ translateX }] }]}>
        <BlurView
          intensity={Platform.OS === 'android' ? 70 : 35}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: dt.panelBg, opacity: isDark ? 0.94 : 0.9 }]} />

        <View style={[st.brandHeader, { borderBottomColor: dt.bottomBorder }]}>
          <View style={st.brandInner}>
            <View style={st.markClip}>
              <ExpoImage source={HEADER_LOGO} style={st.markImg} contentFit="contain" />
            </View>

            <Text style={[st.wordmarkFlat, { color: dt.wordmarkColor }]}>AppSketch</Text>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [st.closeBtn, { backgroundColor: dt.closeIconBg }, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="close" size={15} color={dt.closeIconText} />
            </Pressable>
          </View>
        </View>

        {/* ── Menu items ── */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 24 }}
        >
          {/* ── Quick access: account/profile + cart (+ Help & Support when
              signed in), kept separate from the general menu links ── */}
          <Text style={[st.sectionLabel, { color: dt.dimColor }]}>Quick Access</Text>
          {quickAccessItems.map((item, idx) => {
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
                <DrawerRow dt={dt} icon={item.icon} label={item.label} onPress={() => handlePress(item.route)} />
              </Animated.View>
            );
          })}

          {MENU_ITEMS.length > 0 && (
            <>
              <Text style={[st.sectionLabel, { color: dt.dimColor }]}>Menu</Text>
              {MENU_ITEMS.map((item, idx) => {
                const anim = itemAnims[QUICK_SLOT_COUNT + idx];
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
                    <DrawerRow dt={dt} icon={item.icon} label={item.label} onPress={() => handlePress(item.route)} />
                  </Animated.View>
                );
              })}
            </>
          )}

          <Text style={[st.sectionLabel, { color: dt.dimColor }]}>Preferences</Text>

          {/* ── Theme toggle ── */}
          <DrawerRow
            dt={dt}
            icon={isDark ? 'moon' : 'sunny'}
            label={themeLabel}
            onPress={handleThemeToggle}
            right={<ThemeTogglePill isDark={isDark} />}
          />

          {/* ── Share ── */}
          <DrawerRow dt={dt} icon="share-outline" label="Share Appsketch" onPress={handleShare} />

          {/* Divider */}
          <View style={[st.divider, { backgroundColor: dt.accentLine, opacity: 0.25 }]} />

          <Text style={[st.sectionLabel, { color: dt.dimColor }]}>Session</Text>

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
            {isSignedIn ? (
              <DrawerRow
                dt={dt}
                icon="log-out-outline"
                label="Log Out"
                iconColor="#EF4444"
                labelColor="#EF4444"
                onPress={handleLogout}
              />
            ) : (
              <DrawerRow
                dt={dt}
                icon="log-in-outline"
                label="Sign In / Register"
                iconColor={ACCENT}
                labelColor={ACCENT}
                onPress={handleSignIn}
              />
            )}
          </Animated.View>
        </ScrollView>

        {/* ── Bottom bar ── */}
        <Pressable
          style={({ pressed }) => [st.bottomBar, { borderColor: dt.bottomBorder }, pressed && { opacity: 0.6 }]}
          onPress={() => Linking.openURL('https://appsketch.ai')}
        >
          <TextInput
            editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
            value="Powered by Appsketch"
            style={[st.versionText, { color: dt.bottomText }]}
          />
        </Pressable>
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
    paddingTop: Platform.OS === 'ios' ? 56 : 45,
    paddingBottom: 0,
    borderBottomWidth: 1,
  },

  brandInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    paddingHorizontal: 12,
    paddingLeft: 5,
    paddingBottom: 10,
  },

  // Real app logo, small and square — no glow behind it
  markClip: {
    width: 45,
    height: 45,
    borderRadius: 8,
    overflow: 'hidden',
  },
  markImg: {
    width: 50,
    height: 50,
  },

  wordmarkFlat: {
    flex: 1,
    fontFamily: F.sans600,
    fontSize: 17,
    letterSpacing: 0.6,
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

  // Card row — bordered surface + tinted circular icon badge, replacing the
  // previous flat icon-next-to-label list for a more polished, grouped feel.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
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
