import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { GradientText } from '@/components/ui/GradientText';
import { F } from '@/lib/fonts';
import { homeTheme, type HomeColors } from '../theme/HomeTheme';

// Same fade recipe as Hero's own heading — one GradientText per line, over
// the same 3-line wrap the source design shows for this heading.
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

const FLOAT_MS = 2200;
const FLOAT_DISTANCE = -12;

// Decorative laptop+phone mockup — a simplified stand-in built from the same
// browser-chrome-dots + skeleton-bar language as MockupCard/ReviewCard,
// rather than a pixel copy of the source illustration.
//
// Both devices are drawn as bezel-plus-inset-screen (an outer hardware frame
// with the content clipped inside it) rather than a single bordered card —
// a bordered card alone just reads as a browser window, which is what made
// the first pass not look like devices at all. The laptop additionally gets
// a hinge deck wider than its lid, and the phone a notch + home indicator.
function DeviceMockup({ t }: { t: HomeColors }) {
  // Phone drifts slowly up and down, matching the source design. Looped, not
  // one-shot — one-shot entrance animations are known to stall on this RN
  // build (see the comment in Hero's HeroContent), looped ones run fine.
  const floatY = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: FLOAT_DISTANCE,
          duration: FLOAT_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: FLOAT_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatY]);

  return (
    <View style={s.mockupWrap}>
      {/* ── Laptop ── */}
      <View style={s.laptopFrame}>
        {/* Lid: outer bezel, screen inset inside it */}
        <View
          style={[s.laptopBezel, { backgroundColor: t.surface, borderColor: t.border }]}
        >
          <View style={[s.laptopScreen, { backgroundColor: t.card }]}>
            <View style={[s.laptopChrome, { borderBottomColor: t.border }]}>
              <View style={s.dots}>
                <View style={[s.dot, { backgroundColor: '#FF5F57' }]} />
                <View style={[s.dot, { backgroundColor: '#FEBC2E' }]} />
                <View style={[s.dot, { backgroundColor: '#28C840' }]} />
              </View>
              <View style={[s.urlPill, { backgroundColor: t.bg }]} />
            </View>

            <View style={s.laptopBody}>
              <View
                style={[s.pill, { backgroundColor: t.accent, alignSelf: 'center', width: 60 }]}
              />
              <View style={[s.skeletonBar, { backgroundColor: t.border, width: '85%' }]} />
              <View style={[s.skeletonBar, { backgroundColor: t.border, width: '60%' }]} />
              <View style={[s.pill, { backgroundColor: t.accent, width: '45%', marginTop: 4 }]} />
              <View style={s.tileRow}>
                <View style={[s.tile, { backgroundColor: '#6C5CE7' }]} />
                <View style={[s.tile, { backgroundColor: '#22D3EE' }]} />
                <View style={[s.tile, { backgroundColor: '#EC4899' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Hinge deck — wider than the lid, trackpad notch centred, so the
            silhouette reads as an open laptop rather than a floating card. */}
        <View style={[s.laptopBase, { backgroundColor: t.sheetHandle }]}>
          <View style={[s.laptopBaseNotch, { backgroundColor: t.bg }]} />
        </View>
      </View>

      {/* ── Phone (floats) ── */}
      <Animated.View
        style={[
          s.phone,
          {
            // Dark bezel body with a brighter outline — the outline is what
            // separates the phone from the (also dark) laptop screen it
            // overlaps; t.border alone disappears against it.
            backgroundColor: t.surface,
            borderColor: t.sheetHandle,
            transform: [{ translateY: floatY }],
          },
        ]}
      >
        <View style={[s.phoneScreen, { backgroundColor: t.card }]}>
          <View style={[s.phoneNotch, { backgroundColor: t.bg }]} />

          <View style={s.phoneBody}>
            <View style={s.phoneRow}>
              <View style={[s.phoneIcon, { backgroundColor: '#FF6A33' }]} />
              <View style={[s.skeletonBar, { backgroundColor: t.border, flex: 1 }]} />
            </View>
            <View style={[s.skeletonBar, { backgroundColor: t.border, width: '80%' }]} />
            <View style={[s.skeletonBar, { backgroundColor: t.border, width: '55%' }]} />
            <View style={[s.pill, { backgroundColor: t.text, width: '100%' }]} />
            <View style={s.phoneRow}>
              <View style={[s.phoneIcon, { backgroundColor: t.accent }]} />
              <View style={[s.skeletonBar, { backgroundColor: t.border, flex: 1 }]} />
            </View>
          </View>

          <View style={[s.phoneHomeIndicator, { backgroundColor: t.textMuted }]} />
        </View>
      </Animated.View>
    </View>
  );
}

export function ClosingCTASection({
  onStartPress,
  onLearnPress,
}: {
  onStartPress?: () => void;
  onLearnPress?: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    // No section backgroundColor — same as the other new sections, so the
    // shared TwinkleDots backdrop keeps showing through here too.
    <View style={s.section}>
      <DeviceMockup t={t} />

      <View style={s.headingWrap}>
        <HeadingLine text="Production-ready" t={t} />
        <HeadingLine text="apps, a fraction of" t={t} />
        <HeadingLine text="the cost." t={t} />
      </View>

      <Text style={[s.subtitle, { color: t.textSub }]}>
        AI drafts it. Our engineers perfect it. You ship.
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

const s = StyleSheet.create({
  section: {
    paddingHorizontal: 22,
    paddingTop: 40,
    paddingBottom: 60,
    alignItems: 'center',
  },

  // Explicit height: the phone is absolutely positioned and hangs below the
  // laptop's base, so the wrap can't size itself from the laptop alone.
  mockupWrap: {
    width: '100%',
    height: 262,
    marginBottom: 32,
    alignItems: 'center',
  },

  laptopFrame: {
    width: '100%',
    maxWidth: 340,
  },
  // Outer hardware frame. Bottom corners stay near-square so the lid meets
  // the hinge deck flush.
  laptopBezel: {
    padding: 7,
    borderWidth: 1,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  laptopScreen: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  laptopBase: {
    alignSelf: 'center',
    width: '112%',
    height: 11,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    alignItems: 'center',
    paddingTop: 3.5,
  },
  laptopBaseNotch: {
    width: 52,
    height: 4,
    borderRadius: 2,
  },
  laptopChrome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  urlPill: {
    flex: 1,
    height: 11,
    borderRadius: 6,
  },
  laptopBody: {
    padding: 16,
    gap: 8,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  tile: {
    flex: 1,
    height: 34,
    borderRadius: 8,
  },
  pill: {
    height: 10,
    borderRadius: 5,
  },
  skeletonBar: {
    height: 8,
    borderRadius: 4,
  },

  // Phone: outer bezel (this view) + inset screen, same construction as the
  // laptop. Overlaps the laptop's right side and hangs below its base.
  phone: {
    position: 'absolute',
    right: 5,
    top: 52,
    width: 115,
    height: 220,
    borderRadius: 24,
    borderWidth: 1,
    padding: 4,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  phoneNotch: {
    width: 34,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 7,
  },
  phoneBody: {
    flex: 1,
    padding: 10,
    gap: 7,
  },
  phoneHomeIndicator: {
    width: 32,
    height: 3.5,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 7,
    opacity: 0.55,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  phoneIcon: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },

  headingWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  heading: {
    fontFamily: F.display900,
    fontSize: 36,
    letterSpacing: -0.8,
    lineHeight: 40,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: F.sans400,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },

  btns: {
    flexDirection: 'row',
    gap: 14,
  },
  btnPrimary: {
    height: 50,
    paddingHorizontal: 26,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryTxt: {
    fontFamily: F.sans700,
    fontSize: 13.5,
    letterSpacing: 0.1,
  },
  btnSecondary: {
    height: 50,
    paddingHorizontal: 26,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryTxt: {
    fontFamily: F.sans700,
    fontSize: 13.5,
    letterSpacing: 0.1,
  },
});
