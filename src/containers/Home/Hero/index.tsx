import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { F } from '@/lib/fonts';
import { homeTheme, type HomeColors } from '../theme/HomeTheme';
import { TwinkleDots } from './TwinkleDots';

const { width: W, height: H } = Dimensions.get('window');

// ─── Hero content with staggered entrance ─────────────────────────────────────
function HeroContent({
  t,
  onStartPress,
  onLearnPress,
}: {
  t: HomeColors;
  onStartPress: () => void;
  onLearnPress: () => void;
}) {
  const anims = React.useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  React.useEffect(() => {
    Animated.stagger(
      100,
      anims.map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 680,
          delay: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  const aStyle = (i: number) => ({
    opacity: anims[i],
    transform: [
      {
        translateY: anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
        }),
      },
    ],
  });

  return (
    <View style={[s.content, { pointerEvents: 'box-none' }]}>
      <Animated.Text style={[s.heading, { color: t.text }, aStyle(0)]}>
        {'Create unlimited\nbeautiful '}
        <Text style={{ color: t.heroHeadingFade }}>apps.</Text>
      </Animated.Text>

      <Animated.Text style={[s.subtitle, { color: t.textSub }, aStyle(1)]}>
        {'Write anything and the agentic workspace\ncompiles your dream interface in real-time.'}
      </Animated.Text>

      <Animated.View style={[s.btns, aStyle(2)]}>
        <TouchableOpacity
          onPress={onStartPress}
          style={[s.btnPrimary, { backgroundColor: t.heroCtaBg }]}
          activeOpacity={0.85}
        >
          <Text style={[s.btnPrimaryTxt, { color: t.heroCtaText }]}>
            Get started →
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onLearnPress}
          style={[
            s.btnSecondary,
            { backgroundColor: t.heroSecondaryBg, borderColor: t.heroSecondaryBorder },
          ]}
          activeOpacity={0.85}
        >
          <Text style={[s.btnSecondaryTxt, { color: t.heroSecondaryText }]}>
            Learn more
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── HeroBanner ───────────────────────────────────────────────────────────────
export function HeroBanner({
  onStartPress,
  onLearnPress,
}: {
  onStartPress?: () => void;
  onLearnPress?: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];
  const isDark = colorScheme === 'dark';

  return (
    <View style={[s.hero, { backgroundColor: t.bg }]}>
      {/* Independent per-dot twinkle — the shimmer from the video */}
      <TwinkleDots
        width={W}
        height={H}
        color={t.dotColor}
        spacing={26}
        radius={1.4}
        minOpacity={isDark ? 0.05 : 0.04}
        maxOpacity={isDark ? 0.24 : 0.16}
      />

      <HeroContent
        t={t}
        onStartPress={onStartPress ?? (() => { })}
        onLearnPress={onLearnPress ?? (() => { })}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  hero: {
    width: W,
    height: H / 1.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    width: '100%',
    paddingHorizontal: 28,
    paddingTop: 70,
    paddingBottom: 60,
    alignItems: 'center',
    zIndex: 2,
  },

  heading: {
    fontFamily: F.display900,
    fontSize: 42,
    letterSpacing: -1.4,
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: 18,
  },

  subtitle: {
    fontFamily: F.sans400,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 36,
  },

  btns: {
    flexDirection: 'row',
    gap: 14,
  },

  btnPrimary: {
    height: 52,
    paddingHorizontal: 26,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryTxt: {
    fontFamily: F.sans700,
    fontSize: 15,
    letterSpacing: 0.1,
  },

  btnSecondary: {
    height: 52,
    paddingHorizontal: 26,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryTxt: {
    fontFamily: F.sans700,
    fontSize: 15,
    letterSpacing: 0.1,
  },
});
