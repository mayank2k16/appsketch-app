/**
 * HomeBannerCarousel
 *
 * Full-width boxy banner carousel — matches the "QR Scan" / "Tata 1mg" style
 * from the reference screenshots.
 *
 * ─── Config ───────────────────────────────────────────────────────────────────
 * Edit BANNER_SLIDES below. Each slide supports:
 *   type          : 'image' | 'video'
 *   source        : URL string
 *   bgColor       : fallback colour if media hasn't loaded yet
 *   title         : large headline (supports \n for line breaks)
 *   description   : smaller supporting text (optional)
 *   badge         : small top-left pill label (optional)
 *   logo          : top-right logo image URL (optional)
 *   ctaLabel      : button text (optional — no button if omitted)
 *   ctaHref       : route pushed via expo-router (optional)
 *   ctaColor      : button background colour (defaults to white)
 *   ctaTextColor  : button text colour (defaults to dark)
 *   textAlign     : 'left' | 'center' (default 'left')
 *   heroImage     : right-side product/person PNG URL (optional)
 *   textColor     : override text colour (defaults to white)
 */

import * as React from 'react';
import {
  View,
  ImageBackground,
  Pressable,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { Text } from '@/components/ui';
import { Image } from '@/components/ui';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
export const BANNER_SLIDES = [
  {
    id: 'b1',
    type: 'image' as const,
    source: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/Gemini_Generated_Image_ozqf9oozqf9oozqf.png',
    bgColor: '#E8614A',
    
    description: undefined as string | undefined,
    badge: undefined as string | undefined,
    logo: undefined as string | undefined,
    
    ctaHref: '/scan' as string | undefined,
    ctaColor: '#111827',
    ctaTextColor: '#000000',
    textAlign: 'left' as 'left' | 'center',
    heroImage: undefined as string | undefined,
    textColor: '#000000',
    overlayOpacity: 0.0,
  },
  {
    id: 'b2',
    type: 'image' as const,
    source: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/Gemini_Generated_Image_g80zgwg80zgwg80z.png',
    bgColor: '#1D4ED8',
    
   
    logo: undefined as string | undefined,
    ctaLabel: '',
    ctaHref: '/checkups',
    ctaColor: '#000000',
    ctaTextColor: '#111827',
    textAlign: 'left' as 'left' | 'center',
    // heroImage: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/Gemini_Generated_Image_vfn6wrvfn6wrvfn6.png',
    textColor: '#000000',
    overlayOpacity: 0.0,
  }
];

const BANNER_HEIGHT  = 160;   // boxy, shorter aspect ratio like reference
const AUTO_ADVANCE   = 4000;  // ms

// ─── Helpers ──────────────────────────────────────────────────────────────────
function PillDots({
  count,
  active,
  activeColor,
}: {
  count: number;
  active: number;
  activeColor: string;
}) {
  return (
    <View style={st.dots}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            st.dot,
            {
              width: i === active ? 22 : 7,
              backgroundColor:
                i === active ? activeColor : 'rgba(0,0,0,0.18)',
            },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
type Props = { primaryColor?: string };

export function HomeBannerCarousel({ primaryColor = '#0D9488' }: Props) {
  const router      = useRouter();
  const scrollRef   = React.useRef<Animated.ScrollView>(null);
  const scrollX     = React.useRef(new Animated.Value(0)).current;
  const videoRef    = React.useRef<Video>(null);
  const timerRef    = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [index, setIndex]         = React.useState(0);
  const [videoEnded, setVideoEnded] = React.useState(false);

  const goTo = React.useCallback((next: number) => {
    const target = next % BANNER_SLIDES.length;
    (scrollRef.current as any)?.scrollTo({ x: target * width, animated: true });
    setIndex(target);
  }, []);

  React.useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const cur = BANNER_SLIDES[index];
    if (cur.type === 'video') {
      setVideoEnded(false);
      videoRef.current?.replayAsync().catch(() => {});
    } else {
      timerRef.current = setTimeout(() => goTo(index + 1), AUTO_ADVANCE);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [index, goTo]);

  const onVideoStatus = React.useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish && !videoEnded) {
        setVideoEnded(true);
        goTo(index + 1);
      }
    },
    [videoEnded, index, goTo],
  );

  const renderSlide = (slide: (typeof BANNER_SLIDES)[number], i: number) => {
    const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.82, 1, 0.82],
      extrapolate: 'clamp',
    });

    const textBlock = (
      <View
        style={[
          st.textBlock,
          slide.heroImage ? { flex: 1, paddingRight: 8 } : { flex: 1 },
        ]}
      >
        {/* Badge / logo row */}
        {(slide.badge || slide.logo) && (
          <View style={st.badgeRow}>
            {slide.badge && (
              <View style={st.badgePill}>
                <Text style={st.badgeTxt}>{slide.badge}</Text>
              </View>
            )}
            {slide.logo && (
              <Image
                source={{ uri: slide.logo }}
                style={st.logoImg}
                contentFit="contain"
              />
            )}
          </View>
        )}

        {/* Title */}
        <Text
          style={[
            st.title,
            { color: slide.textColor ?? '#fff', textAlign: slide.textAlign },
          ]}
        >
          {slide.title}
        </Text>

        {/* Description */}
        {slide.description ? (
          <Text
            style={[
              st.description,
              { color: (slide.textColor ?? '#fff') + 'CC', textAlign: slide.textAlign },
            ]}
          >
            {slide.description}
          </Text>
        ) : null}

        {/* CTA button */}
        {slide.ctaLabel ? (
          <Pressable
            style={({ pressed }) => [
              st.cta,
              { backgroundColor: slide.ctaColor ?? '#fff', opacity: pressed ? 0.82 : 1 },
            ]}
            onPress={() => slide.ctaHref && router.push(slide.ctaHref as any)}
          >
            <Text style={[st.ctaTxt, { color: slide.ctaTextColor ?? '#111827' }]}>
              {slide.ctaLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );

    const heroBlock = slide.heroImage ? (
      <Image
        source={{ uri: slide.heroImage }}
        style={st.heroImg}
        contentFit="cover"
      />
    ) : null;

    const inner = (
      <>
        {/* Dim overlay */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `rgba(0,0,0,${slide.overlayOpacity ?? 0.45})` },
          ]}
        />
        <View style={st.slideContent}>
          {textBlock}
          {heroBlock}
        </View>
      </>
    );

    return (
      <Animated.View key={slide.id} style={{ width, opacity }}>
        {slide.type === 'video' ? (
          <View style={[st.media, { backgroundColor: slide.bgColor }]}>
            <Video
              ref={videoRef}
              source={{ uri: slide.source }}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.COVER}
              shouldPlay isMuted isLooping={false}
              onPlaybackStatusUpdate={onVideoStatus}
            />
            {inner}
          </View>
        ) : (
          <ImageBackground
            source={{ uri: slide.source }}
            style={[st.media, { backgroundColor: slide.bgColor }]}
            resizeMode="cover"
          >
            {inner}
          </ImageBackground>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={st.root}>
      <Animated.ScrollView
        ref={scrollRef as any}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        onMomentumScrollEnd={e =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
      >
        {BANNER_SLIDES.map(renderSlide)}
      </Animated.ScrollView>

      <PillDots count={BANNER_SLIDES.length} active={index} activeColor={primaryColor} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: {
    // Full width, no horizontal margin — boxy
    marginTop: 16,
  },

  media: {
    width,
    height: BANNER_HEIGHT,
  },

  slideContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },

  textBlock: {
    justifyContent: 'center',
    gap: 6,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },

  badgePill: {
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  badgeTxt: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  logoImg: {
    width: 80,
    height: 22,
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: -0.3,
  },

  description: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    marginTop: 2,
  },

  cta: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 10,
  },

  ctaTxt: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  heroImg: {
    width: 110,
    height: BANNER_HEIGHT - 10,
    marginLeft: 8,
  },

  // Dots sit below the banner
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },

  dot: { height: 5, borderRadius: 3 },
});