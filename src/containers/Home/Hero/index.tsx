import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { F } from '@/lib/fonts';
import { homeTheme, type HomeColors } from '../theme/HomeTheme';

const { width: W, height: H } = Dimensions.get('window');
const HERO_H = H / 2.2;

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
  // A one-shot `Animated.timing().start()` fired this early in the component
  // lifecycle silently never completes on this device/RN build (looped
  // animations elsewhere in this screen work fine — only one-shot entrance
  // animations get stuck at their initial value forever), which made this
  // content invisible. Rendering it statically visible is the robust fix.
  return (
    <View style={[s.content, { pointerEvents: 'box-none' }]}>
      <Text style={[s.heading, { color: t.text }]}>
        {'Create unlimited\nbeautiful '}
        <Text style={{ color: t.heroHeadingFade }}>apps.</Text>
      </Text>

      <Text style={[s.subtitle, { color: t.textSub }]}>
        {'Write anything and the agentic workspace\ncompiles your dream interface in real-time.'}
      </Text>

      <View style={s.btns}>
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
      </View>
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

  return (
    // No background colour here (and no owned TwinkleDots any more) — Home
    // now renders a single shared dotted backdrop behind Header+Hero+AgentV2
    // instead of each section owning its own animated instance.
    <View style={s.hero}>
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
    height: HERO_H,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    width: '100%',
    paddingHorizontal: 28,
    paddingTop: 0,
    paddingBottom: 0,
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
