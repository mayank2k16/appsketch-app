import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { createCoderTenant, type AppTypeKey } from '@/api/coder';
import { AppTypePills } from '@/components/ui/AppTypePills';
import { GradientText } from '@/components/ui/GradientText';
import { PromptComposer } from '@/components/ui/PromptComposer';
import { F } from '@/lib/fonts';
import { toast } from '@/lib/toast';
import { DEFAULT_MODEL, fmtContext, MODELS } from '../AgentV2';
import { SectionHeading } from '../components/SectionHeading';
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

// One distinct screenshot per device.
const DESKTOP_SCREEN_IMAGE =
  'https://cdn.appsketch.ai/phurti-cloudfront/website_images/Screenshot_2026-07-30_at_11.30.48AM.webp';
const LAPTOP_SCREEN_IMAGE =
  'https://cdn.appsketch.ai/phurti-cloudfront/website_images/Screenshot_2026-07-30_at_11.29.49AM.webp';
const TABLET_SCREEN_IMAGE =
  'https://cdn.appsketch.ai/phurti-cloudfront/website_images/Screenshot_2026-07-30_at_11.28.42AM.webp';
const PHONE_SCREEN_IMAGE =
  'https://cdn.appsketch.ai/phurti-cloudfront/website_images/Screenshot_2026-07-30_at_11.29.14AM.webp';

// ── Metal ───────────────────────────────────────────────────────────────────
// Space-black anodised aluminium. Even black metal is never a flat fill: it
// needs a bright catch at the edge, a near-black body, then a *second*, weaker
// highlight further along. That double highlight is the whole trick — drop it
// and the frames read as black cardboard.
const METAL_FRAME = ['#5A5F68', '#22252A', '#0A0B0D', '#3E434B', '#111316'] as const;
const METAL_FRAME_LOC = [0, 0.15, 0.45, 0.82, 1] as const;

// Phone rail — same ramp, marginally brighter so it separates from the laptop
// screen it overlaps.
const METAL_RAIL = ['#6A6F79', '#282C32', '#0D0F12', '#4A4F58', '#15171B'] as const;
const METAL_RAIL_LOC = [0, 0.18, 0.5, 0.84, 1] as const;

// Front lip of the hinge deck, lit from above.
const METAL_DECK = ['#41464E', '#1E2126', '#0A0B0D'] as const;

// Specular pass laid over a frame — the glare that sells "shiny" without
// repainting the base gradient. Kept low: on black metal a strong white wash
// just looks like fog.
const SHEEN = [
  'rgba(255,255,255,0.20)',
  'rgba(255,255,255,0.03)',
  'rgba(255,255,255,0)',
  'rgba(255,255,255,0.09)',
] as const;
const SHEEN_LOC = [0, 0.22, 0.62, 1] as const;

// ── Composition ─────────────────────────────────────────────────────────────
// Widths are fractions of the mockup box (the section width minus its 8px
// gutters) so the whole family scales with the screen instead of being pinned
// to one handset size. Two stacked rows, not one overlapping stack: the
// desktop display runs full-width on its own row, and the tablet/phone/laptop
// sit below it side by side in normal flow (no absolute overlap).
const MOCK_W = Dimensions.get('window').width - 16;
// Desktop now fills the whole row edge to edge — its height grows with it via
// aspectRatio rather than being pinned to a fraction of a fixed box height.
const MON_W = MOCK_W;

// Row 2 (tablet/phone/laptop) sizes are derived from the space actually left
// over after the two 8px gaps between them, not independent fractions of the
// full row — that guarantees the three frames plus their gaps always sum to
// exactly MOCK_W, so nothing overflows and no frame gets clipped at the
// screen edge.
const ROW_GAP = 8;
const ROW_CONTENT_W = MOCK_W - ROW_GAP * 2;
const TAB_W = ROW_CONTENT_W * 0.26;
const PHONE_W = ROW_CONTENT_W * 0.15;
const LAP_W = ROW_CONTENT_W * 0.59;

// Same inset on every device's bezel — mismatched padding (monitor 3 vs
// tablet 2.5 vs phone 1.8) is what made screenshots look clipped by
// different amounts frame to frame.
const FRAME_PAD = 3;

// Screens are sized by aspect ratio, not by the source image's own
// proportions — that is what makes each screenshot fill its display edge to
// edge (cover-cropping the sides) instead of letterboxing top and bottom.
const SCREEN_16_10 = 16 / 10;
// Monitor screen only: width grew 20% but height should only grow 10%, so the
// aspect ratio (width/height) widens by the ratio of those two factors —
// changing the ratio, not the frame size, is what decouples the two axes.
const SCREEN_MONITOR = SCREEN_16_10 * (1.2 / 1.1);
const SCREEN_TABLET = 3 / 4;
const SCREEN_PHONE = 9 / 19.5;

// Decorative four-device family — desktop display, MacBook Pro, iPad Pro and
// iPhone Pro — arranged in the depth order of the source wireframe: the
// display sits furthest back and centred, the laptop overlaps it from the
// right, and the tablet and phone stand in front on the left.
//
// Every device is drawn the same way: a machined metal frame (gradient +
// specular sheen) with the screen inset inside it, rather than a single
// bordered card. A bordered card alone just reads as a browser window, which
// is what made the first pass not look like hardware at all.
function MetalShell({
  style,
  rail,
  children,
}: {
  style: StyleProp<ViewStyle>;
  /** Phone/tablet rails are a touch brighter so they separate from the
   *  (also black) laptop screen they overlap. */
  rail?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <LinearGradient
      colors={rail ? METAL_RAIL : METAL_FRAME}
      locations={rail ? METAL_RAIL_LOC : METAL_FRAME_LOC}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={style}
    >
      {/* Clipped by the parent's own borderRadius + overflow:'hidden', so the
          glare never needs to restate the corner radii. */}
      <LinearGradient
        colors={SHEEN}
        locations={SHEEN_LOC}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </LinearGradient>
  );
}

// Every display renders the screenshot the same way: the frame fixes the
// screen's aspect ratio and the image covers it, so the shot always runs the
// full height of the panel and gets cropped at the sides instead.
function Display({
  uri,
  style,
  t,
}: {
  uri: string | null;
  style: StyleProp<ViewStyle>;
  t: HomeColors;
}) {
  return (
    <View style={style}>
      {uri ? (
        <ExpoImage
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="top"
        />
      ) : (
        <View style={s.fallbackBody}>
          <View style={[s.skeletonBar, { backgroundColor: t.border, width: '80%' }]} />
          <View style={[s.skeletonBar, { backgroundColor: t.border, width: '55%' }]} />
        </View>
      )}
    </View>
  );
}

function DeviceMockup({ t }: { t: HomeColors }) {
  return (
    <View style={s.mockupWrap}>
      {/* ── Desktop display — its own full-width row ── */}
      <View style={s.monitorWrap}>
        <MetalShell style={s.monitorBezel}>
          <Display uri={DESKTOP_SCREEN_IMAGE} style={s.monitorScreen} t={t} />
        </MetalShell>
        <MetalShell style={s.monitorNeck} />
        <MetalShell style={s.monitorFoot} />
      </View>

      {/* ── Second row: tablet, phone, laptop side by side — no overlap ── */}
      <View style={s.deviceRow}>
        {/* iPad Pro */}
        <View style={s.tabletWrap}>
          <MetalShell style={s.tablet} rail>
            <View style={s.tabletScreen}>
              <Display uri={TABLET_SCREEN_IMAGE} style={StyleSheet.absoluteFill} t={t} />
              <View style={s.tabletCamera} pointerEvents="none" />
            </View>
          </MetalShell>
        </View>

        {/* iPhone Pro */}
        <View style={s.phoneWrap}>
          <MetalShell style={s.phone} rail>
            <View style={s.phoneScreen}>
              <Display uri={PHONE_SCREEN_IMAGE} style={StyleSheet.absoluteFill} t={t} />
              <View style={s.dynamicIsland} pointerEvents="none" />
              <View style={s.phoneHomeIndicator} pointerEvents="none" />
            </View>
          </MetalShell>

          {/* Machined side buttons, same rail metal so they catch the same light */}
          <LinearGradient
            colors={METAL_RAIL}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[s.sideBtn, s.volUp]}
            pointerEvents="none"
          />
          <LinearGradient
            colors={METAL_RAIL}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[s.sideBtn, s.volDown]}
            pointerEvents="none"
          />
          <LinearGradient
            colors={METAL_RAIL}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={[s.sideBtn, s.power]}
            pointerEvents="none"
          />
        </View>

        {/* MacBook Pro */}
        <View style={s.laptopWrap}>
          <MetalShell style={s.laptopBezel}>
            <Display uri={LAPTOP_SCREEN_IMAGE} style={s.laptopScreen} t={t} />
            {/* Camera pinhole — at this scale a real notch reads as grime, a
                single lit dot reads as the machine. */}
            <View style={s.camera} pointerEvents="none" />
          </MetalShell>

          {/* Hinge deck — wider than the lid, thumb cutout centred, so the
              silhouette reads as an open laptop rather than a floating card. */}
          <LinearGradient
            colors={METAL_DECK}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={s.laptopBase}
          >
            <View style={s.laptopBaseNotch} />
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

export function ClosingCTASection() {
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
      <SectionHeading
        eyebrow="EVERY SCREEN"
        lines={['One build, every', 'screen.']}
        t={t}
        style={s.mockupHeadingWrap}
      />
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
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 60,
    alignItems: 'center',
  },

  // Two stacked rows in normal flow — desktop on its own row, then
  // tablet/phone/laptop side by side below it. Nothing here needs a fixed
  // height any more; each row sizes itself from its content.
  mockupWrap: {
    width: '100%',
    marginBottom: 40,
  },

  // ── Desktop display — own row, full width ──
  monitorWrap: {
    width: MON_W,
    alignItems: 'center',
  },

  // ── Row 2: tablet, phone, laptop ── widths + gap sum to exactly MOCK_W
  // (see ROW_CONTENT_W above), so 'flex-start' never has slack to overflow.
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: ROW_GAP,
    marginTop: 14,
  },
  monitorBezel: {
    width: '100%',
    padding: FRAME_PAD,
    borderRadius: 7,
    overflow: 'hidden',
  },
  monitorScreen: {
    width: '100%',
    aspectRatio: SCREEN_MONITOR,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  monitorNeck: {
    width: MON_W * 0.1,
    height: 22,
    overflow: 'hidden',
  },
  monitorFoot: {
    width: MON_W * 0.42,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },

  // ── MacBook Pro ──
  laptopWrap: {
    width: LAP_W,
  },
  // Bottom corners stay near-square so the lid meets the hinge deck flush.
  laptopBezel: {
    padding: FRAME_PAD,
    paddingTop: FRAME_PAD * 2,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    overflow: 'hidden',
  },
  camera: {
    position: 'absolute',
    top: 3,
    alignSelf: 'center',
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#12141A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  laptopScreen: {
    width: '100%',
    aspectRatio: SCREEN_16_10,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  laptopBase: {
    alignSelf: 'center',
    width: '107%',
    height: 11,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    alignItems: 'center',
    paddingTop: 3.5,
  },
  laptopBaseNotch: {
    width: LAP_W * 0.3,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  // ── iPad Pro ──
  tabletWrap: {
    width: TAB_W,
  },
  tablet: {
    padding: FRAME_PAD,
    borderRadius: 11,
    overflow: 'hidden',
  },
  tabletScreen: {
    width: '100%',
    aspectRatio: SCREEN_TABLET,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  tabletCamera: {
    position: 'absolute',
    top: 4,
    alignSelf: 'center',
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },

  // ── iPhone Pro ──
  phoneWrap: {
    width: PHONE_W,
  },
  phone: {
    padding: FRAME_PAD,
    borderRadius: 13,
    overflow: 'hidden',
  },
  phoneScreen: {
    width: '100%',
    aspectRatio: SCREEN_PHONE,
    borderRadius: 11.5,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  // Dynamic Island floats over the screen content, it isn't a bezel cutout.
  dynamicIsland: {
    position: 'absolute',
    top: 4,
    alignSelf: 'center',
    width: PHONE_W * 0.42,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#000',
  },
  phoneHomeIndicator: {
    position: 'absolute',
    bottom: 4,
    alignSelf: 'center',
    width: PHONE_W * 0.42,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  sideBtn: {
    position: 'absolute',
    width: 1.5,
    borderRadius: 1,
  },
  volUp: {
    left: -1,
    top: 30,
    height: 14,
  },
  volDown: {
    left: -1,
    top: 48,
    height: 14,
  },
  power: {
    right: -1,
    top: 36,
    height: 22,
  },

  // ── Shared screen furniture ──
  fallbackBody: {
    flex: 1,
    padding: 8,
    gap: 6,
    justifyContent: 'center',
  },
  skeletonBar: {
    height: 6,
    borderRadius: 3,
  },
  // The parent `section` centers its children (alignItems:'center'), which
  // would otherwise shrink SectionHeading to its content width and center it
  // — force it full-width so it stretches edge to edge and reads flush left
  // like every other Home section's heading.
  mockupHeadingWrap: {
    width: '100%',
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
    marginTop: 5,
    marginBottom: 15,
  },

  composerWrap: {
    width: '100%',
  },
});
