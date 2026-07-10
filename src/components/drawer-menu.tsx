import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
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
import {
  Cart as CartIcon,
  Category as CategoryIcon,
  Feed as ProductsIcon,
  Settings as SettingsIcon,
  User as UserIcon,
} from '@/components/ui/icons';
import { signOut, useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/lib/tenant';
import { F } from '@/lib/fonts';

const { width: SCREEN_W } = Dimensions.get('window');
const DRAWER_W = Math.min(SCREEN_W * 0.72, 290);

// ─── Brand constants ───────────────────────────────────────────────────────────
const BLACK  = '#0C0C0C';
const DARK   = '#141414';
const CARD   = '#1C1C1C';
const RED    = '#C41230';
const DIM_RED = 'rgba(196,18,48,0.14)';
const WHITE  = '#FFFFFF';
const DIM    = 'rgba(255,255,255,0.45)';

// shimmer strip width
const SHINE_W = DRAWER_W * 0.45;

type DrawerMenuProps = {
  visible: boolean;
  onClose: () => void;
};

const AUTH_MENU_ITEMS = [
  { id: 'profile',    label: 'My Account',        icon: UserIcon,     route: '/storefront/profile',    emoji: '👤' },
  { id: 'products',   label: 'Our Menu',           icon: ProductsIcon, route: '/storefront/explore',    emoji: '🥡' },
  { id: 'cart',       label: 'My Cart',            icon: CartIcon,     route: '/storefront/cart',       emoji: '🛒' },
  { id: 'categories', label: 'Food Categories',    icon: CategoryIcon, route: '/storefront/categories', emoji: '🍜' },
  { id: 'terms',      label: 'Terms & Conditions', icon: SettingsIcon, route: '/storefront/terms',      emoji: '📋' },
  { id: 'privacy',    label: 'Privacy Policy',     icon: SettingsIcon, route: '/storefront/privacy',    emoji: '🔒' },
];

const GUEST_MENU_ITEMS = [
  { id: 'products',   label: 'Our Menu',           icon: ProductsIcon, route: '/storefront/explore',    emoji: '🥡' },
  { id: 'cart',       label: 'My Cart',            icon: CartIcon,     route: '/storefront/cart',       emoji: '🛒' },
  { id: 'categories', label: 'Food Categories',    icon: CategoryIcon, route: '/storefront/categories', emoji: '🍜' },
  { id: 'terms',      label: 'Terms & Conditions', icon: SettingsIcon, route: '/storefront/terms',      emoji: '📋' },
  { id: 'privacy',    label: 'Privacy Policy',     icon: SettingsIcon, route: '/storefront/privacy',    emoji: '🔒' },
];

// ─── Shimmer wordmark ──────────────────────────────────────────────────────────
function ShimmerWordmark() {
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
        style={st.wordmark}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: shimX }] }]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0.06)', 'transparent']}
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
        Animated.timing(pulse, { toValue: 1,   duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
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

// ─── DrawerMenu ────────────────────────────────────────────────────────────────
export function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const router         = useRouter();
  const { tenantConfig } = useTenant();
  const status         = useAuth.use.status();
  const isGuest        = status === 'guest';
  const MENU_ITEMS     = isGuest ? GUEST_MENU_ITEMS : AUTH_MENU_ITEMS;

  const logo = tenantConfig?.logo ?? tenantConfig?.branding?.logo ?? null;

  // ── Animation values ────────────────────────────────────────────────────────
  const translateX     = React.useRef(new Animated.Value(DRAWER_W)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  // Always allocate for the largest list (AUTH) so the ref never runs short when status changes
  const itemAnims      = React.useRef(AUTH_MENU_ITEMS.map(() => new Animated.Value(0))).current;
  const logoBrandAnim  = React.useRef(new Animated.Value(0)).current;
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
        Animated.stagger(
          50,
          itemAnims.slice(0, MENU_ITEMS.length).map(a =>
            Animated.spring(a, {
              toValue: 1, tension: 95, friction: 13, useNativeDriver: true,
            })
          )
        ),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(translateX,     { toValue: DRAWER_W, duration: 180, useNativeDriver: true }),
      ]).start(() => setModalVisible(false));
    }
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
        <View style={st.overlay} />
      </Animated.View>

      {/* Tap outside to close */}
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

      {/* ── Drawer panel ── */}
      <Animated.View style={[st.drawer, { transform: [{ translateX }] }]}>

        {/* ── Brand header ── */}
        <View style={st.brandHeader}>
          {/* Animated orange bottom-border line grows in */}
          <Animated.View style={[st.headerUnderline, { width: headerLineW }]} />

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

            {/* Subtitle */}
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                {/* <LiveDot /> */}
                {/* <TextInput
                  editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                  value="Authentic · Fresh · Delivered"
                  style={st.subtitle}
                /> */}
              </View>
            </View>

            {/* Close button */}
            <TouchableOpacity onPress={onClose} style={st.closeBtn} activeOpacity={0.7}>
              <Text style={st.closeBtnTxt}>✕</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* ── Decorative orange line under header ── */}
        <View style={st.headerAccentBar} />

        {/* ── Menu items ── */}
        <ScrollView
          style={{ flex: 1, backgroundColor: DARK }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 24 }}
        >
          {MENU_ITEMS.map((item, idx) => {
            const Icon = item.icon;
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
                  style={st.menuRow}
                  activeOpacity={0.6}
                >
                  <View style={st.iconWrap}>
                    <Text style={{ fontSize: 16, lineHeight: 20 }}>{item.emoji}</Text>
                  </View>
                  <Text style={st.menuLabel}>{item.label}</Text>
                  <Text style={st.chevron}>›</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          {/* Divider */}
          <View style={st.divider} />

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
              <TouchableOpacity onPress={handleSignIn} style={st.menuRow} activeOpacity={0.6}>
                <View style={[st.iconWrap, { backgroundColor: `${RED}20` }]}>
                  <Text style={{ fontSize: 16, lineHeight: 20 }}>🔑</Text>
                </View>
                <Text style={[st.menuLabel, { color: RED }]}>Sign In / Register</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleLogout} style={st.menuRow} activeOpacity={0.6}>
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
          style={st.bottomBar}
          activeOpacity={0.7}
          onPress={() => Linking.openURL('https://appsketch.ai')}
        >
          <TextInput
            editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
            value="Powered by Appsketch"
            style={st.versionText}
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
    backgroundColor: 'rgba(0,0,0,0.65)',
  },

  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_W,
    backgroundColor: BLACK,
    shadowColor: RED,
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 28,
    overflow: 'hidden',
  },

  // Brand header
  brandHeader: {
    backgroundColor: BLACK,
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

  // Animated orange line that grows across the bottom of the header
  headerUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 1.5,
    backgroundColor: RED,
    opacity: 0.6,
  },

  // 2px solid orange bar below the header
  headerAccentBar: {
    height: 2,
    backgroundColor: RED,
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
    backgroundColor: DIM_RED,
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
    color: WHITE,
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

  // Close button
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnTxt: {
    fontSize: 13,
    color: DIM,
    fontFamily: F.sans700,
    lineHeight: 16,
  },

  // Menu rows
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 13,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 12,
    backgroundColor: CARD,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DIM_RED,
  },
  menuLabel: {
    flex: 1,
    fontFamily: F.sans600,
    fontSize: 14,
    color: WHITE,
    letterSpacing: 0.1,
  },
  chevron: {
    fontSize: 20,
    lineHeight: 22,
    fontFamily: F.sans400,
    color: RED,
    opacity: 0.7,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(196,18,48,0.15)',
    marginHorizontal: 20,
    marginVertical: 10,
  },

  // Bottom bar
  bottomBar: {
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: BLACK,
  },
  versionText: {
    fontFamily: F.sans500,
    fontSize: 11,
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 0.3,
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    height: 14,
  },
});
