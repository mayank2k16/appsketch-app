import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { MarketTemplate } from '@/api/templates';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import type { Shape } from './masonry';
import { cardTags, isFeatured, TONE_RGB } from './tags';
import { type GalleryTheme, MONO } from './theme';

/**
 * One card of the gallery, as appsketch.ai/templates draws it: the
 * screenshot is the card, in a white frame 5px round it, with the name and
 * its coloured chips as a caption beneath. A phone app stands in a phone on
 * a lit stage; a website is its screenshot at 16:10.
 *
 * Touch screens have no hover to bring the web's buttons out, so they sit
 * under the caption, always there: Preview (the see-through one, orange
 * edge) and Use app (filled orange). A tap on the picture is Preview too.
 */

const PAD = 5;
const BORDER = 1;
const SEP = 8;
const CAPTION = 38;
const BTN = 30;
const BTN_GAP = 6;
/** Space between two cards in a column. */
export const ROW_GAP = 10;

const screenHeight = (width: number) => (width - 2 * (PAD + BORDER)) * 0.625;

/** The height of a one-row card; a tall card is two of them and a gap, so a
 * phone app stands level with two websites beside it. */
export const rowHeight = (width: number) =>
  2 * (PAD + BORDER) + screenHeight(width) + SEP + CAPTION + SEP + BTN;

export const cardHeight = (width: number, shape: Shape) =>
  shape === 'tall' ? 2 * rowHeight(width) + ROW_GAP : rowHeight(width);

type Props = {
  g: GalleryTheme;
  template: MarketTemplate;
  shape: Shape;
  width: number;
  index: number;
  onPreview: () => void;
  onUse: () => void;
  using?: boolean;
};

/** What a card shows of a template, worked out once. */
function describe(template: MarketTemplate) {
  const isCode = template.kind === 'code';
  const eco =
    isCode && template.ecosystem?.apps?.length ? template.ecosystem : null;
  const ecoApps = (eco?.apps ?? [])
    .map((a) => (a.is_home ? '' : a.label) || a.title)
    .filter(Boolean);
  const isMobile = isCode && template.app_type === 'mobile';
  return {
    isCode,
    isMobile,
    ecoCount: eco ? (eco.apps?.length ?? 0) : 0,
    title: (isCode ? template.title : template.name) || 'Untitled',
    thumbnail: isCode ? template.thumbnail_url : template.thumbnail_image,
    chips: cardTags({
      tags: template.tags ?? undefined,
      category: (isCode ? template.category : undefined) ?? undefined,
    }),
    featured: isFeatured({
      tags: template.tags ?? undefined,
      featured: isCode ? template.featured : undefined,
    }),
    meta: eco
      ? ecoApps.join(' · ')
      : template.description || (isCode ? template.category : '') || '',
    previewLabel: isMobile
      ? 'Try app'
      : isCode && template.preview_url
        ? 'Live preview'
        : 'Preview',
    useLabel: eco ? 'Use ecosystem' : 'Use app',
  };
}

type Described = ReturnType<typeof describe>;

/** Rises into place as it arrives, a beat after its neighbour (the web's
 * reveal on scroll). */
function useEnter(index: number) {
  const enter = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      delay: (index % 4) * 60,
      useNativeDriver: true,
    }).start();
  }, [enter, index]);
  return {
    opacity: enter,
    transform: [
      {
        translateY: enter.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
      {
        scale: enter.interpolate({
          inputRange: [0, 1],
          outputRange: [0.97, 1],
        }),
      },
    ],
  };
}

const cardStyle = (g: GalleryTheme, width: number, shape: Shape) => [
  s.card,
  {
    width,
    height: shape === 'wide' ? undefined : cardHeight(width, shape),
    borderColor: g.cardBorder,
    backgroundColor: g.cardBg,
    boxShadow: g.cardGlow === 'none' ? undefined : g.cardGlow,
  },
];

export const GalleryCard = React.memo(function GalleryCard({
  g,
  template,
  shape,
  width,
  index,
  onPreview,
  onUse,
  using,
}: Props) {
  const d = describe(template);
  const enter = useEnter(index);
  const tall = shape === 'tall';

  return (
    <Animated.View style={[cardStyle(g, width, shape), enter]}>
      <PressableScale
        onPress={onPreview}
        scaleTo={0.98}
        accessibilityRole="button"
        accessibilityLabel={`Preview ${d.title}`}
        style={[
          s.screen,
          { borderColor: g.line, backgroundColor: g.skeleton },
          tall
            ? { flex: 1, backgroundColor: g.stage }
            : { height: screenHeight(width) },
        ]}
      >
        {tall ? (
          <PhoneStage g={g} uri={d.thumbnail} />
        ) : d.thumbnail ? (
          <Image
            source={{ uri: d.thumbnail }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition="top"
            cachePolicy="memory-disk"
            transition={180}
          />
        ) : (
          <View style={s.fallback}>
            <Text style={[s.fallbackLetter, { color: g.faint }]}>
              {d.title[0]}
            </Text>
          </View>
        )}
        <Flags g={g} d={d} />
      </PressableScale>
      <Caption g={g} d={d} wide={shape === 'wide'} />
      <Actions
        g={g}
        d={d}
        shape={shape}
        onPreview={onPreview}
        onUse={onUse}
        using={using}
      />
    </Animated.View>
  );
});

/** Top left: Featured (a small red tag), then what the card is when it is
 * more than one website: an app for a phone, or several apps at once. */
function Flags({ g, d }: { g: GalleryTheme; d: Described }) {
  if (!d.featured && !d.ecoCount && !d.isMobile) return null;
  return (
    <View style={s.flags} pointerEvents="none">
      {d.featured && (
        <View style={[s.featured, !g.flat && s.featuredShadow]}>
          <Text style={s.featuredText}>Featured</Text>
        </View>
      )}
      {d.ecoCount ? (
        <View
          style={[s.badge, { backgroundColor: g.ecoBg, borderColor: g.ecoBg }]}
        >
          <Ionicons name="layers-outline" size={10} color={g.ecoText} />
          <Text style={[s.badgeText, s.badgeStrong, { color: g.ecoText }]}>
            Ecosystem · {d.ecoCount} apps
          </Text>
        </View>
      ) : (
        d.isMobile && (
          <View
            style={[
              s.badge,
              { backgroundColor: g.glass, borderColor: g.glassBorder },
            ]}
          >
            <Ionicons name="phone-portrait-outline" size={10} color={g.ink} />
            <Text style={[s.badgeText, { color: g.ink }]}>Mobile app</Text>
          </View>
        )
      )}
    </View>
  );
}

/** The name and its coloured chips. A feature has room for both on one
 * line, with the description under; a narrow card puts the chips on the
 * second line instead of the description, as the web does on a phone. */
function Caption({
  g,
  d,
  wide,
}: {
  g: GalleryTheme;
  d: Described;
  wide: boolean;
}) {
  const chips = d.chips.map((c) => (
    <Chip key={c.label} label={c.label} tone={TONE_RGB[c.tone]} />
  ));
  return (
    <View style={s.caption}>
      <View style={s.titleRow}>
        <Text
          numberOfLines={1}
          style={[s.title, { color: g.ink }, wide && s.titleWide]}
        >
          {d.title}
        </Text>
        {wide && chips}
      </View>
      {!wide && chips.length > 0 && !d.ecoCount ? (
        <View style={s.chips}>{chips}</View>
      ) : (
        <Text numberOfLines={1} style={[s.meta, { color: g.muted }]}>
          {d.meta}
        </Text>
      )}
    </View>
  );
}

/** Preview (see-through, orange edge) and Use app (filled orange): side by
 * side, or one above the other in a phone app's narrow cell. */
function Actions({
  g,
  d,
  shape,
  onPreview,
  onUse,
  using,
}: {
  g: GalleryTheme;
  d: Described;
  shape: Shape;
  onPreview: () => void;
  onUse: () => void;
  using?: boolean;
}) {
  const wide = shape === 'wide';
  const tall = shape === 'tall';
  return (
    <View style={[s.actions, tall && s.actionsTall]}>
      <PressableScale
        onPress={onPreview}
        style={[
          s.btn,
          wide && s.btnWide,
          tall && s.btnTall,
          { borderColor: g.previewBorder },
        ]}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[s.btnText, { color: g.ink }]}
        >
          {d.previewLabel}
        </Text>
      </PressableScale>
      {d.isCode && (
        <PressableScale
          haptic="tap"
          onPress={onUse}
          disabled={using}
          // Black never dimmed the busy button; white shows it at 50%.
          disabledOpacity={g.flat ? 0.5 : 1}
          style={[
            s.btn,
            wide && s.btnWide,
            tall && s.btnTall,
            { borderColor: g.orange, backgroundColor: g.orange },
          ]}
        >
          {using ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[s.btnText, { color: '#fff' }]}
            >
              {d.useLabel}
            </Text>
          )}
        </PressableScale>
      )}
    </View>
  );
}

function Chip({ label, tone }: { label: string; tone: string }) {
  return (
    <View
      style={[
        s.chip,
        {
          borderColor: `rgba(${tone}, 0.28)`,
          backgroundColor: `rgba(${tone}, 0.1)`,
        },
      ]}
    >
      <Text numberOfLines={1} style={[s.chipText, { color: `rgb(${tone})` }]}>
        {label}
      </Text>
    </View>
  );
}

/** A phone app on its stage: lit orange from above and blue from below, as
 * on the web (in black, violet and pink). */
function PhoneStage({ g, uri }: { g: GalleryTheme; uri?: string | null }) {
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={(e) =>
        setBox({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        })
      }
    >
      {/* White (flat) has no fades: the stage is plain paper. */}
      {!g.flat && (
        <>
          <LinearGradient
            colors={[g.stageTop, 'transparent']}
            style={[StyleSheet.absoluteFill, { bottom: '45%' }]}
          />
          <LinearGradient
            colors={['transparent', g.stageBottom]}
            style={[StyleSheet.absoluteFill, { top: '55%' }]}
          />
        </>
      )}
      {box.h > 0 && (
        <View style={s.phoneWrap}>
          <Phone
            width={Math.min(box.h * 0.88 * (390 / 874), box.w * 0.86)}
            uri={uri}
            flat={g.flat}
          />
        </View>
      )}
    </View>
  );
}

const TITANIUM = [
  '#8d8a84',
  '#f4f2ec',
  '#a7a49d',
  '#5f5c57',
  '#d9d6cf',
  '#7b7872',
  '#c9c6bf',
] as const;

/** A titanium phone: the band round the edge, the black bezel, the island.
 * Every size is a share of its width, so it is the same phone at any size.
 * Exported for Home's template reel, which frames mobile apps the same way. */
export function Phone({
  width,
  uri,
  flat,
  screenBg,
  transition = 180,
}: {
  width: number;
  uri?: string | null;
  flat?: boolean;
  /** The screen's fill while its image loads (black by default). */
  screenBg?: string;
  transition?: number;
}) {
  const band = Math.max(3, width * 0.035);
  const radius = width * 0.16;
  return (
    <LinearGradient
      colors={TITANIUM}
      locations={[0, 0.14, 0.3, 0.48, 0.66, 0.84, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width,
        height: width * (874 / 390),
        borderRadius: radius,
        padding: band,
        boxShadow: flat
          ? undefined
          : '0px 18px 30px -14px rgba(22, 16, 44, 0.5)',
      }}
    >
      <View
        style={[
          s.phoneScreen,
          { borderRadius: radius - band },
          screenBg ? { backgroundColor: screenBg } : null,
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            recyclingKey={uri}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition="top"
            cachePolicy="memory-disk"
            transition={transition}
          />
        ) : null}
        <View
          style={[
            s.island,
            { width: width * 0.3, height: width * 0.085, top: width * 0.04 },
          ]}
        />
      </View>
    </LinearGradient>
  );
}

/** Stands in for a card while the first page loads, at the card's size. */
export function GallerySkeleton({
  g,
  width,
  shape,
}: {
  g: GalleryTheme;
  width: number;
  shape: Shape;
}) {
  return (
    <View style={cardStyle(g, width, shape)}>
      <View
        style={[
          s.screen,
          { borderColor: g.line, backgroundColor: g.skeleton },
          shape === 'tall' ? { flex: 1 } : { height: screenHeight(width) },
        ]}
      />
      <View style={s.caption}>
        <View
          style={[s.skLine, { width: '62%', backgroundColor: g.skeleton }]}
        />
        <View
          style={[s.skLine, { width: '40%', backgroundColor: g.skeleton }]}
        />
      </View>
      <View
        style={[
          s.btn,
          { borderColor: g.line, backgroundColor: g.skeleton, flex: 0 },
        ]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    padding: PAD,
    borderWidth: BORDER,
    borderRadius: 8,
    marginBottom: ROW_GAP,
  },
  screen: {
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fallbackLetter: { fontFamily: F.display900, fontSize: 34 },
  flags: {
    position: 'absolute',
    top: 7,
    left: 7,
    right: 7,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  featured: {
    height: 20,
    paddingHorizontal: 7,
    borderRadius: 4,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
  },
  featuredShadow: { boxShadow: '0px 4px 10px -4px rgba(220, 38, 38, 0.6)' },
  featuredText: {
    color: '#fff',
    fontFamily: MONO,
    fontWeight: '700',
    fontSize: 8.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  badge: {
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeStrong: { fontWeight: '700' },
  badgeText: {
    fontFamily: MONO,
    fontSize: 8.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  caption: {
    height: CAPTION,
    marginTop: SEP,
    paddingHorizontal: 3,
    justifyContent: 'center',
    gap: 3,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  title: {
    flexShrink: 1,
    fontFamily: F.sans600,
    fontSize: 13,
    letterSpacing: -0.15,
  },
  titleWide: { fontSize: 14.5 },
  meta: { fontFamily: F.sans400, fontSize: 11 },
  chips: { flexDirection: 'row', gap: 4, overflow: 'hidden', height: 17 },
  chip: {
    height: 17,
    paddingHorizontal: 7,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    flexShrink: 1,
  },
  chipText: { fontFamily: F.sans600, fontSize: 9.5 },
  actions: { flexDirection: 'row', gap: BTN_GAP, marginTop: SEP },
  actionsTall: { flexDirection: 'column' },
  btn: {
    flex: 1,
    height: BTN,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  btnWide: { height: 38 },
  /** One above the other: a full-width row each, not a share of the column. */
  btnTall: { flex: 0 },
  btnText: { fontFamily: F.sans600, fontSize: 12 },
  phoneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  phoneScreen: { flex: 1, overflow: 'hidden', backgroundColor: '#000' },
  island: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#000',
  },
  skLine: { height: 10, borderRadius: 4 },
});
