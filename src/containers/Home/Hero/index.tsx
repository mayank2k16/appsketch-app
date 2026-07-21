import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { F } from '@/lib/fonts';
import { homeTheme, type HomeColors } from '../theme/HomeTheme';

const { width: W, height: H } = Dimensions.get('window');
const HERO_H = H / 2.2;

// ─── Gradient heading line ─────────────────────────────────────────────────────
// Reference recording shows each line running flat-white through its first
// word, then fading smoothly (not a hard colour swap) across the rest of the
// line — measured from the actual frames, brightness holds until ~52% of the
// line then ramps steadily down. `<Text>` can't clip a gradient to glyph
// shapes on its own, so this masks a LinearGradient to the line's own text.
//
// `@react-native-masked-view`'s web shim is a no-op stub — it renders only
// `maskElement` and silently drops the gradient entirely (confirmed by
// reading its `MaskedView.web.js` source: `React.createElement(View, props,
// maskElement)`, `children` never touched). Real masking only exists on
// iOS/Android, so web gets the standard CSS `background-clip: text` trick
// instead, using the exact same colours/stops.
function GradientHeadingLine({ text, t }: { text: string; t: HomeColors }) {
  if (Platform.OS === 'web') {
    return React.createElement(
      'span',
      {
        style: {
          display: 'block',
          fontFamily: F.display900,
          fontSize: '42px',
          letterSpacing: '-1.4px',
          textAlign: 'center',
          lineHeight: '50px',
          backgroundImage: `linear-gradient(90deg, ${t.text} 0%, ${t.text} 52%, ${t.heroHeadingFade} 100%)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        },
      },
      text
    );
  }

  return (
    <MaskedView maskElement={<Text style={s.heading}>{text}</Text>}>
      <LinearGradient
        colors={[t.text, t.text, t.heroHeadingFade]}
        locations={[0, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[s.heading, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

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
      <View style={s.headingWrap}>
        <GradientHeadingLine text="Create unlimited" t={t} />
        <GradientHeadingLine text="beautiful apps." t={t} />
      </View>

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

  headingWrap: {
    marginBottom: 18,
  },

  heading: {
    fontFamily: F.display900,
    fontSize: 42,
    letterSpacing: -1.4,
    textAlign: 'center',
    lineHeight: 50,
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
    gap: 16,
  },

  btnPrimary: {
    height: 56,
    paddingHorizontal: 30,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryTxt: {
    fontFamily: F.sans700,
    fontSize: 15,
    letterSpacing: 0.1,
  },

  btnSecondary: {
    height: 56,
    paddingHorizontal: 30,
    borderRadius: 28,
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
