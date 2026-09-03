import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

import { GradientText } from '@/components/ui/GradientText';
import { F } from '@/lib/fonts';
import {
  HOME_BRAND_RAMP,
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
function HeroContent({ t }: { t: HomeColors }) {
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
    </View>
  );
}

// ─── HeroBanner ───────────────────────────────────────────────────────────────
// The hero is copy only now. Its "Get started" / "Learn more" pair was removed
// along with the identical pair in the Gallery section — two CTA rows on one
// scroll, both pointing at the same builder, and the prompt card sitting
// directly under this one is already the real way in. With them gone the
// headline and the card are adjacent, which is the whole point of the screen.
// The press handlers went with them; add props back if a CTA ever returns.
export function HeroBanner() {
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    // No background colour here (and no owned TwinkleDots any more) — Home
    // now renders a single shared dotted backdrop behind Header+Hero+AgentV2
    // instead of each section owning its own animated instance.
    <View style={s.hero}>
      <HeroContent t={t} />
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

  // The subtitle is the last thing in the hero now that the buttons are gone,
  // so its bottom margin is the only gap left between the headline block and
  // the prompt card. Kept small: the card should read as the hero's own input,
  // not as a separate section below it.
  subtitle: {
    fontFamily: F.sans400,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 4,
  },
});
