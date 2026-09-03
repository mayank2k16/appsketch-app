import { LinearGradient } from 'expo-linear-gradient';
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
import {
  HOME_BRAND_RAMP,
  homeBrandGradient,
  homeTheme,
  type HomeColors,
} from '../theme/HomeTheme';

const { width: W } = Dimensions.get('window');

/** The headline's first line — white, holding its value the whole way across.
 *  It is the line that has to read as plain product copy so the coloured one
 *  below it lands as emphasis rather than decoration. */
function HeadingLine({ text, t }: { text: string; t: HomeColors }) {
  return (
    <GradientText
      style={s.heading}
      colors={[t.text, t.text, t.heroHeadingFade]}
      locations={[0, 0.52, 1]}
    >
      {text}
    </GradientText>
  );
}

/** The second line, carrying the brand ramp warm→cool across its full width.
 *  Only ONE line takes it: running both would leave the headline with no
 *  hierarchy and nothing for the colour to point at. Stops are held at the
 *  edges (0 → 1) rather than fading out early, so the last glyph lands on
 *  full violet instead of trailing into grey the way the white ramp did. */
function BrandHeadingLine({ text }: { text: string }) {
  return (
    <GradientText
      style={s.heading}
      colors={[...HOME_BRAND_RAMP]}
      locations={[0, 0.5, 1]}
    >
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
        <HeadingLine text="Create unlimited" t={t} />
        <BrandHeadingLine text="beautiful apps." />
      </View>

      <Text style={[s.subtitle, { color: t.textSub }]}>
        {
          'Write anything and the agentic workspace\ncompiles your dream interface in real-time.'
        }
      </Text>

      <View style={s.btns}>
        {/* Filled with the brand ramp rather than the flat white it used to
            carry. White made it the single brightest thing on a black screen,
            which pulled the eye past the coloured headline it sits under; the
            ramp keeps it the primary action while tying it to that line.
            The gradient is a child rather than a background because RN has no
            gradient `backgroundColor` — hence `overflow: hidden` on the
            button and `absoluteFill` on the layer. */}
        <TouchableOpacity
          onPress={onStartPress}
          style={s.btnPrimary}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={homeBrandGradient()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[s.btnPrimaryTxt, { color: '#FFFFFF' }]}>
            Get started →
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onLearnPress}
          style={[
            s.btnSecondary,
            {
              backgroundColor: t.heroSecondaryBg,
              borderColor: t.heroSecondaryBorder,
            },
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
        onStartPress={onStartPress ?? (() => {})}
        onLearnPress={onLearnPress ?? (() => {})}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Density pass: the hero used to open on 25px of dead space under a header
  // that already carries its own padding, and the block below it added 40 more
  // before the prompt card. Trimmed at both ends so the headline sits closer
  // to the wordmark and the card comes up into view without a scroll.
  hero: {
    width: W,
    paddingTop: 12,
    paddingBottom: 2,
    alignItems: 'center',
  },

  content: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
    alignItems: 'center',
    zIndex: 2,
  },

  headingWrap: {
    marginBottom: 12,
  },

  heading: {
    fontFamily: F.display900,
    fontSize: 40,
    letterSpacing: -1.4,
    textAlign: 'center',
    lineHeight: 46,
  },

  subtitle: {
    fontFamily: F.sans400,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 20,
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
    // Clips the gradient layer to the pill; without it the LinearGradient
    // paints the button's full square bounding box and the radius is lost.
    overflow: 'hidden',
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
