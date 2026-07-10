import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { F } from '@/lib/fonts';

const { width: SW } = Dimensions.get('window');

const BLACK  = '#0C0C0C';
const RED    = '#C41230';
const WHITE  = '#FFFFFF';
const DIM    = 'rgba(255,255,255,0.45)';

// ─── Shimmer wordmark ─────────────────────────────────────────────────────────
const WORD_W  = 340;
const SHINE_W = WORD_W * 0.40;

function ShineWordmark() {
  const shimX = React.useRef(new Animated.Value(-SHINE_W)).current;

  React.useEffect(() => {
    const run = () => {
      shimX.setValue(-SHINE_W);
      Animated.timing(shimX, {
        toValue: WORD_W + SHINE_W,
        duration: 1300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => { if (finished) setTimeout(run, 3000); });
    };
    const t = setTimeout(run, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ width: WORD_W, height: 50, overflow: 'hidden', alignItems: 'center' }}>
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
          colors={['transparent', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0.08)', 'transparent']}
          locations={[0, 0.2, 0.5, 0.8, 1]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ width: SHINE_W, height: '100%' }}
        />
      </Animated.View>
    </View>
  );
}

// ─── Pulsing orange dot divider ───────────────────────────────────────────────
function DotDivider() {
  const pulse = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.6,  duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={st.divRow}>
      <LinearGradient
        colors={['transparent', RED]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={st.divLine}
      />
      <Animated.View style={[st.diamond, { transform: [{ scale: pulse }] }]} />
      <LinearGradient
        colors={[RED, 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={st.divLine}
      />
    </View>
  );
}

// ─── Social button with bounce-in + pressable ────────────────────────────────
function SocialBtn({ name, url, delay }: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  url: string;
  delay: number;
}) {
  const entryAnim = React.useRef(new Animated.Value(0)).current;
  const pressAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    setTimeout(() => {
      Animated.spring(entryAnim, {
        toValue: 1, useNativeDriver: true, speed: 12, bounciness: 12,
      }).start();
    }, delay);
  }, []);

  const entryScale   = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const entryOpacity = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [0,   1] });

  const onPressIn  = () => Animated.spring(pressAnim, { toValue: 0.85, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onPressOut = () => Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true, speed: 30, bounciness: 8 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: entryScale }], opacity: entryOpacity }}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => Linking.openURL(url).catch(() => {})}
        hitSlop={8}
      >
        <Animated.View style={[st.socialBtn, { transform: [{ scale: pressAnim }] }]}>
          <Ionicons name={name} size={18} color={WHITE} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Staggered fade+slide hook ────────────────────────────────────────────────
function useFadeSlide(delay: number) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(12)).current;
  React.useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1, duration: 550, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 550, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    }, delay);
  }, []);
  return { opacity, transform: [{ translateY }] };
}

// ─── Footer ───────────────────────────────────────────────────────────────────
export function Footer() {
  const year = new Date().getFullYear();

  const s1 = useFadeSlide(80);
  const s2 = useFadeSlide(200);
  const s3 = useFadeSlide(320);
  const s4 = useFadeSlide(420);
  const s5 = useFadeSlide(520);

  return (
    <View style={st.root}>

      {/* Top orange border */}
      <View style={st.topBorder} />

      {/* Brand pill */}
      <Animated.View style={[st.pillWrap, s1]}>
        <View style={st.pill}>
          <TextInput
            editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
            value="🥢  SINCE 2025  🐉"
            style={st.pillTxt}
          />
        </View>
      </Animated.View>

      {/* Wordmark + tagline */}
      <Animated.View style={[st.brandBlock, s2]}>
        <ShineWordmark />
        <TextInput
          editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
          value="AUTHENTIC · FRESH · DELIVERED"
          style={st.tagline}
        />
      </Animated.View>

      {/* Divider */}
      <Animated.View style={s3}>
        <DotDivider />
      </Animated.View>

      {/* Social icons */}
      <Animated.View style={[st.socialRow, s4]}>
        {([
          { name: 'logo-instagram' as const, url: 'https://www.instagram.com/chinesecorner',  d: 0   },
          { name: 'logo-facebook'  as const, url: 'https://www.facebook.com/chinesecorner',   d: 70  },
          { name: 'logo-twitter'   as const, url: 'https://www.twitter.com/chinesecorner',    d: 140 },
          { name: 'logo-youtube'   as const, url: 'https://www.youtube.com/@chinesecorner',   d: 210 },
        ]).map(({ name, url, d }) => (
          <SocialBtn key={name} name={name} url={url} delay={d} />
        ))}
      </Animated.View>

      
      {/* Copyright */}
      <Animated.View style={[st.copyBar, s5]}>
        <View style={st.copyAccent} />
        <TextInput
          editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
          value={`© ${year} Chinese Corner. All rights reserved.`}
          style={st.copyTxt}
        />
        <View style={st.copyAccent} />
      </Animated.View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: {
    backgroundColor: BLACK,
    ...Platform.select({
      ios:     { shadowColor: RED, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.35, shadowRadius: 12 },
      android: { elevation: 12 },
    }),
  },

  topBorder: {
    height: 2,
    backgroundColor: RED,
  },

  // Pill
  pillWrap: { alignItems: 'center', paddingTop: 26 },
  pill: {
    borderWidth: 1,
    borderColor: `${RED}70`,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 5,
    backgroundColor: `${RED}14`,
  },
  pillTxt: {
    fontSize: 11, fontFamily: F.sans800,
    color: RED, letterSpacing: 2.5, textAlign: 'center',
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 16,
  },

  // Brand block
  brandBlock: { alignItems: 'center', paddingTop: 14, gap: 8 },
  wordmark: {
    fontSize: 22, fontFamily: F.sans900,
    color: WHITE, letterSpacing: 5, textAlign: 'center',
    width: WORD_W,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 50,
    ...Platform.select({
      ios: { shadowColor: RED, shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
    }),
  },
  tagline: {
    fontSize: 10, fontFamily: F.sans700,
    color: DIM, letterSpacing: 3, textAlign: 'center',
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 14,
  },

  // Dot divider
  divRow: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 22, paddingHorizontal: 24, gap: 10,
  },
  divLine:  { flex: 1, height: 1 },
  diamond: {
    width: 8, height: 8,
    borderWidth: 1.5,
    borderColor: RED,
    backgroundColor: RED,
    transform: [{ rotate: '45deg' }],
    ...Platform.select({
      ios: { shadowColor: RED, shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
    }),
  },

  // Social
  socialRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 12, marginBottom: 20,
  },
  socialBtn: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Links
  linksRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 10, marginBottom: 22,
  },
  linkTxt: {
    fontSize: 11, fontFamily: F.sans600,
    color: DIM,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 15,
  },
  linkDot: {
    width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: RED, opacity: 0.7,
  },

  // Copyright
  copyBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.10)',
    marginHorizontal: 24,
  },
  copyAccent: {
    flex: 1, height: 1,
    backgroundColor: `${RED}30`,
  },
  copyTxt: {
    fontSize: 10, fontFamily: F.sans500,
    color: 'rgba(255,255,255,0.28)', textAlign: 'center',
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 14,
  },
});
