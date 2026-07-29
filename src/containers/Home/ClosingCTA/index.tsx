import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
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

import { createCoderTenant, type AppTypeKey } from '@/api/coder';
import { AppTypePills } from '@/components/ui/AppTypePills';
import { GradientText } from '@/components/ui/GradientText';
import { PromptComposer } from '@/components/ui/PromptComposer';
import { F } from '@/lib/fonts';
import { toast } from '@/lib/toast';
import { DEFAULT_MODEL, fmtContext, MODELS } from '../AgentV2';
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

// Real screenshot of an Appsketch-built site, shown inside the laptop's
// screen below the browser dots/url bar.
const LAPTOP_SCREEN_IMAGE =
  'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/Screenshot_2025-07-28_at_9.07.21_PM.png';
const LAPTOP_IMAGE_ASPECT_RATIO = 3024 / 1560;

// Mobile counterpart — drop the app screenshot's URL here once you have one.
// Left null for now, so the phone frame falls back to the skeleton mockup
// below until a real image is supplied.
const MOBILE_SCREEN_IMAGE: string | null = 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/Gemini_Generated_Image_5c81u85c81u85c81.png';

// `filter` is a real Fabric style prop (RN 0.79), not a web-only trick — it
// blurs the view itself on iOS/Android same as it does on web via
// react-native-web, so one blurred solid circle gives the same soft glow
// everywhere instead of branching per platform.
const GLOW_BLUR_STYLE = { filter: 'blur(60px)' };

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
      {/* Ambient orange glow behind the devices — a solid circle blurred via
          GLOW_BLUR_STYLE, so it reads as one soft glow (not rings) on every
          platform. */}
      <View style={s.glowWrap} pointerEvents="none">
        <View style={[s.glowCore, GLOW_BLUR_STYLE, { backgroundColor: t.agentGlowOrange }]} />
      </View>

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

            <ExpoImage
              source={{ uri: LAPTOP_SCREEN_IMAGE }}
              style={[s.laptopImage, { aspectRatio: LAPTOP_IMAGE_ASPECT_RATIO }]}
              contentFit="cover"
            />
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

          {MOBILE_SCREEN_IMAGE ? (
            <ExpoImage
              source={{ uri: MOBILE_SCREEN_IMAGE }}
              style={s.phoneImage}
              contentFit="cover"
            />
          ) : (
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
          )}

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
  const router = useRouter();

  const [appType, setAppType] = React.useState<AppTypeKey>('web');
  const [prompt, setPrompt] = React.useState('');
  const [model, setModel] = React.useState(DEFAULT_MODEL);
  const [images, setImages] = React.useState<string[]>([]);
  const [sending, setSending] = React.useState(false);

  async function handleSend() {
    const text = prompt.trim();
    if (!text || sending) return;

    if (appType === 'game') {
      toast.error('Game builds are coming soon — try Web or Mobile for now.');
      return;
    }

    setSending(true);
    try {
      const tenant = await createCoderTenant({ title: text.slice(0, 60), appType });
      router.push({
        pathname: '/code-editor/chat',
        params: {
          tenantId: String(tenant.id),
          tenantUid: tenant.uuid,
          appType,
          userPrompt: text,
          model,
          images: JSON.stringify(images),
        },
      });
    } catch {
      toast.error("Couldn't start your build. Please try again.");
    } finally {
      setSending(false);
    }
  }

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

      <View style={s.typePillRow}>
        <AppTypePills t={t} value={appType} onChange={setAppType} />
      </View>

      <View style={s.composerWrap}>
        <PromptComposer
          t={t}
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Describe the app you want to build…"
          images={images}
          onImagesChange={setImages}
          models={MODELS}
          model={model}
          onModelChange={setModel}
          formatContext={fmtContext}
          onSend={handleSend}
          sending={sending}
        />
      </View>

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
    marginBottom: 40,
    alignItems: 'center',
  },

  // Ambient glow: a plain relatively-positioned anchor box — glowCore is
  // centred inside it and does the actual work via GLOW_BLUR_STYLE.
  glowWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 500,
    height: 500,
    marginTop: -250,
    marginLeft: -250,
  },
  glowCore: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 220,
    height: 220,
    borderRadius: 110,
    marginTop: -110,
    marginLeft: -110,
    opacity: 0.6,
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
  laptopImage: {
    width: '100%',
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
    right: 0,
    top: 52,
    width: 105,
    height: 215,
    borderRadius: 22,
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
  phoneImage: {
    flex: 1,
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

  typePillRow: {
    width: '100%',
    marginBottom: 10,
  },

  composerWrap: {
    width: '100%',
    marginBottom: 24,
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
