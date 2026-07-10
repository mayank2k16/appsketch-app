/**
 * HomePromoBanner
 *
 * A single full-width promotional banner card — matches the "Wellman /
 * Tata 1mg Whey Protein" style from the reference screenshots.
 *
 * Supports TWO visual layouts, both config-driven:
 *
 *   layout: 'media-top'
 *     ┌──────────────────────────────┐
 *     │  [full-width image or video] │  ← media fills top
 *     │  brandLogo  brandName        │
 *     │  badge   tagline             │
 *     │  [Buy Now button]            │
 *     └──────────────────────────────┘
 *
 *   layout: 'side-hero'
 *     ┌─────────────────────────────────┐
 *     │ brand  title   │  hero image    │
 *     │ body           │  (right side)  │
 *     │ [CTA button]   │                │
 *     └─────────────────────────────────┘
 *
 * ─── Config fields ────────────────────────────────────────────────────────────
 *   id            : unique key
 *   layout        : 'media-top' | 'side-hero'
 *   mediaType     : 'image' | 'video'
 *   mediaUrl      : background or top-media URL
 *   bgColor       : solid card background colour
 *   brandLogoUrl  : small square logo image URL (optional)
 *   brandName     : text next to logo (optional)
 *   badge         : small label above title e.g. "Promoted ↑" (optional)
 *   title         : main headline (supports \n)
 *   body          : supporting text (optional)
 *   heroImageUrl  : right-side product image for side-hero layout (optional)
 *   ctaLabel      : button text (optional)
 *   ctaHref       : expo-router push target (optional)
 *   ctaBgColor    : button background colour
 *   ctaTextColor  : button text colour
 *   textColor     : override all text colour (default '#111827' for light cards)
 */

import * as React from 'react';
import {
  View,
  ImageBackground,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Text } from '@/components/ui';
import { Image } from '@/components/ui';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
export type PromoBannerConfig = {
  id: string;
  layout: 'media-top' | 'side-hero';
  mediaType: 'image' | 'video';
  mediaUrl: string;
  bgColor: string;
  brandLogoUrl?: string;
  brandName?: string;
  badge?: string;
  title: string;
  body?: string;
  heroImageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaBgColor: string;
  ctaTextColor: string;
  textColor: string;
  overlayOpacity?: number; // only for side-hero with full-bleed media
};

export const PROMO_BANNERS: PromoBannerConfig[] = [
  // ── Wellman style (media-top)
  {
    id: 'p1',
    layout: 'media-top',
    mediaType: 'image',
    mediaUrl:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    bgColor: '#1639B8',
    brandLogoUrl: undefined,
    brandName: 'VITABIOTICS',
    badge: 'Promoted ↑',
    title: 'wellman',
    body: 'To help maintain men\'s health',
    heroImageUrl: undefined,
    ctaLabel: 'Buy Now',
    ctaHref: '/products/wellman',
    ctaBgColor: '#F05A35',
    ctaTextColor: '#ffffff',
    textColor: '#ffffff',
  },
  // ── Tata 1mg Whey Protein style (side-hero)
  {
    id: 'p2',
    layout: 'side-hero',
    mediaType: 'image',
    mediaUrl:
      'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800&q=80',
    bgColor: '#B2DFE8',
    brandLogoUrl: undefined,
    brandName: 'TATA 1mg®',
    badge: undefined,
    title: 'Best-Ever Prices on\nUltra Clean Whey Protein',
    body: 'THE WHEY YOU WANT IT!',
    heroImageUrl:
      'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&q=80',
    ctaLabel: 'Check Now',
    ctaHref: '/products/whey',
    ctaBgColor: '#111827',
    ctaTextColor: '#ffffff',
    textColor: '#111827',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function BrandRow({ config }: { config: PromoBannerConfig }) {
  if (!config.brandLogoUrl && !config.brandName) return null;
  return (
    <View style={pr.brandRow}>
      {config.brandLogoUrl ? (
        <View style={pr.brandLogoWrap}>
          <Image
            source={{ uri: config.brandLogoUrl }}
            style={pr.brandLogo}
            contentFit="contain"
          />
        </View>
      ) : null}
      {config.brandName ? (
        <Text style={[pr.brandName, { color: config.textColor }]}>
          {config.brandName}
        </Text>
      ) : null}
    </View>
  );
}

function CtaButton({
  label,
  href,
  bgColor,
  textColor,
}: {
  label: string;
  href?: string;
  bgColor: string;
  textColor: string;
}) {
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [
        pr.ctaBtn,
        { backgroundColor: bgColor, opacity: pressed ? 0.84 : 1 },
      ]}
      onPress={() => href && router.push(href as any)}
    >
      <Text style={[pr.ctaTxt, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

// ─── Layout: media-top ────────────────────────────────────────────────────────
function MediaTopCard({ config }: { config: PromoBannerConfig }) {
  const MEDIA_HEIGHT = 200;

  return (
    <View style={[pr.card, { backgroundColor: config.bgColor }]}>
      {/* Top media */}
      <View style={{ height: MEDIA_HEIGHT, overflow: 'hidden' }}>
        {config.mediaType === 'video' ? (
          <Video
            source={{ uri: config.mediaUrl }}
            style={{ width: '100%', height: MEDIA_HEIGHT }}
            resizeMode={ResizeMode.COVER}
            shouldPlay isMuted isLooping
          />
        ) : (
          <Image
            source={{ uri: config.mediaUrl }}
            style={{ width: '100%', height: MEDIA_HEIGHT }}
            contentFit="cover"
          />
        )}
      </View>

      {/* Text body */}
      <View style={pr.mediaTopBody}>
        {/* Brand row */}
        <BrandRow config={config} />

        {/* Badge */}
        {config.badge ? (
          <View style={pr.badgeRow}>
            <Text style={[pr.badge, { color: config.textColor + '99' }]}>
              {config.badge}
            </Text>
          </View>
        ) : null}

        {/* Title */}
        <Text style={[pr.mediaTopTitle, { color: config.textColor }]}>
          {config.title}
        </Text>

        {/* Body */}
        {config.body ? (
          <Text style={[pr.mediaTopBody2, { color: config.textColor + 'BB' }]}>
            {config.body}
          </Text>
        ) : null}

        {/* CTA */}
        {config.ctaLabel ? (
          <View style={{ marginTop: 14 }}>
            <CtaButton
              label={config.ctaLabel}
              href={config.ctaHref}
              bgColor={config.ctaBgColor}
              textColor={config.ctaTextColor}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ─── Layout: side-hero ────────────────────────────────────────────────────────
function SideHeroCard({ config }: { config: PromoBannerConfig }) {
  const CARD_H = 200;

  return (
    <View style={[pr.card, { backgroundColor: config.bgColor, height: CARD_H }]}>
      {/* Background media (subtle) */}
      {config.mediaType === 'video' ? (
        <Video
          source={{ uri: config.mediaUrl }}
          style={[StyleSheet.absoluteFill, { borderRadius: 0 }]}
          resizeMode={ResizeMode.COVER}
          shouldPlay isMuted isLooping
        />
      ) : (
        <ImageBackground
          source={{ uri: config.mediaUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}

      {/* Soft left overlay so text is readable */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor:
              config.bgColor +
              Math.round((config.overlayOpacity ?? 0.78) * 255)
                .toString(16)
                .padStart(2, '0'),
          },
        ]}
      />

      {/* Layout: left text + right hero image */}
      <View style={pr.sideRow}>
        {/* Left text column */}
        <View style={pr.sideLeft}>
          <BrandRow config={config} />

          {config.badge ? (
            <Text style={[pr.badge, { color: config.textColor + '88', marginBottom: 4 }]}>
              {config.badge}
            </Text>
          ) : null}

          <Text style={[pr.sideTitle, { color: config.textColor }]}>
            {config.title}
          </Text>

          {config.body ? (
            <Text style={[pr.sideBody, { color: config.textColor }]}>
              {config.body}
            </Text>
          ) : null}

          {config.ctaLabel ? (
            <View style={{ marginTop: 12 }}>
              <CtaButton
                label={config.ctaLabel}
                href={config.ctaHref}
                bgColor={config.ctaBgColor}
                textColor={config.ctaTextColor}
              />
            </View>
          ) : null}
        </View>

        {/* Right hero image */}
        {config.heroImageUrl ? (
          <Image
            source={{ uri: config.heroImageUrl }}
            style={pr.sideHero}
            contentFit="contain"
          />
        ) : null}
      </View>
    </View>
  );
}

// ─── HomePromoBanner ──────────────────────────────────────────────────────────
type Props = {
  banners?: PromoBannerConfig[];
};

export function HomePromoBanner({ banners = PROMO_BANNERS }: Props) {
  if (!banners.length) return null;

  return (
    <View style={pr.wrapper}>
      {banners.map(config =>
        config.layout === 'media-top' ? (
          <MediaTopCard key={config.id} config={config} />
        ) : (
          <SideHeroCard key={config.id} config={config} />
        ),
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const pr = StyleSheet.create({
  wrapper: {
    gap: 16,
    marginTop: 16,
  },

  // ── Shared card shell
  card: {
    width: '100%',
    overflow: 'hidden',
    // No border-radius — boxy full-width like the reference
    borderRadius: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },

  // ── media-top layout
  mediaTopBody: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 20,
  },

  mediaTopTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 28,
    marginTop: 4,
  },

  mediaTopBody2: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 4,
  },

  // ── side-hero layout
  sideRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },

  sideLeft: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },

  sideTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    letterSpacing: -0.2,
    marginTop: 4,
  },

  sideBody: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 5,
  },

  sideHero: {
    width: 130,
    height: 170,
    marginRight: -8,
  },

  // ── Shared
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },

  brandLogoWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  brandLogo: {
    width: 28,
    height: 28,
  },

  brandName: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    opacity: 0.9,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },

  badge: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  ctaBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 11,
    paddingHorizontal: 24,
    borderRadius: 10,
  },

  ctaTxt: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});