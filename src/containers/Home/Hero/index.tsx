import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { GradientText } from '@/components/ui/GradientText';
import { F } from '@/lib/fonts';
import { homeTheme, type HomeColors } from '../theme/HomeTheme';

const { width: W } = Dimensions.get('window');

// ─── Gradient heading line ─────────────────────────────────────────────────────
// Reference recording shows each line running flat-white through its first
// word, then fading smoothly (not a hard colour swap) across the rest of the
// line — measured from the actual frames, brightness holds until ~52% of the
// line then ramps steadily down.
function GradientHeadingLine({ text, t }: { text: string; t: HomeColors }) {
  return (
    <GradientText style={s.heading} colors={[t.text, t.text, t.heroHeadingFade]} locations={[0, 0.52, 1]}>
      {text}
    </GradientText>
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
    // Content-driven height (no fixed HERO_H box + overflow:hidden that used
    // to clip "Create" off the top and the buttons into a white sliver). A
    // small paddingTop pulls the whole hero — and everything below it in the
    // ScrollView — up, filling the previous empty space.
    width: W,
    paddingTop: 14,
    paddingBottom: 6,
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
    lineHeight: 52,
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
    height: 50, // -10% (was 56)
    paddingHorizontal: 27, // -10% (was 30)
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryTxt: {
    fontFamily: F.sans700,
    fontSize: 13.5, // -10% (was 15)
    letterSpacing: 0.1,
  },

  btnSecondary: {
    height: 50, // -10% (was 56)
    paddingHorizontal: 27, // -10% (was 30)
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryTxt: {
    fontFamily: F.sans700,
    fontSize: 13.5, // -10% (was 15)
    letterSpacing: 0.1,
  },
});
