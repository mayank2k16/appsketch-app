import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

import ReAnimated, {
  Easing as REasing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { F } from '@/lib/fonts';
import { hydrateAuth, useAuth } from '@/hooks/useAuth';
import { useCart } from '@/lib/store/cart-store';
import { useTenant } from '@/lib/tenant';

const { width, height } = Dimensions.get('window');

const SPLASH_DURATION_MS = 3000;

const GAP = 5;
const COL_W = (width - GAP * 4) / 3;
const IMG_H = 190;
const TILE_H = IMG_H + GAP;

// ─────────────────────────────────────────────────────────────
// Chinese Corner — authentic dish images
// ─────────────────────────────────────────────────────────────
const ALL_IMAGES = [
  'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80',  // dim sum
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80',  // wok noodles
  'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&q=80',  // wonton soup
  'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&q=80',  // kung pao
  'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80',  // fried rice
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80',  // spring rolls
  'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&q=80',  // peking duck
  'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80',  // hot pot
  'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80',  // char siu BBQ
  'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80',  // dim sum (alt)
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80',  // spring rolls (alt)
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80',  // noodles (alt)
];

function makeColImgs(start: number, count = 8): string[] {
  const base = Array.from(
    { length: count },
    (_, i) => ALL_IMAGES[(start + i) % ALL_IMAGES.length]
  );

  return [...base, ...base, ...base];
}

const COL_DATA = [
  { imgs: makeColImgs(0), goDown: true, speed: 14 },
  { imgs: makeColImgs(7), goDown: false, speed: 11 },
  { imgs: makeColImgs(14), goDown: true, speed: 16 },
];

function ScrollColumn({
  imgs,
  goDown,
  speed,
}: {
  imgs: string[];
  goDown: boolean;
  speed: number;
}) {
  const pageH = (imgs.length / 3) * TILE_H;

  const anim = React.useRef(
    new Animated.Value(goDown ? 0 : -pageH)
  ).current;

  React.useEffect(() => {
    const dur = (pageH / Math.max(speed, 1)) * 1000;

    let alive = true;

    const loop = () => {
      if (!alive) return;

      anim.setValue(goDown ? 0 : -pageH);

      Animated.timing(anim, {
        toValue: goDown ? -pageH : 0,
        duration: dur,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }).start(({ finished }) => {
        if (finished) loop();
      });
    };

    loop();

    return () => {
      alive = false;
      anim.stopAnimation();
    };
  }, []);

  return (
    <View
      style={{
        width: COL_W,
        height,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          transform: [{ translateY: anim }],
        }}
      >
        {imgs.map((uri, i) => (
          <Image
            key={i}
            source={{
              uri,
              headers: {
                Accept: 'image/webp,image/jpeg,*/*',
              },
            }}
            style={{
              width: COL_W,
              height: IMG_H,
              marginBottom: GAP,
              borderRadius: 8,
              backgroundColor: '#1a1a1a',
            }}
            resizeMode="cover"
          />
        ))}
      </Animated.View>
    </View>
  );
}

export default function FashionSplashScreen() {
  const router = useRouter();

  const status = useAuth.use.status();

  const fetchCart = useCart((s) => s.fetchCart);

  const { fetchAndSetTenant } = useTenant();

  const [authChecked, setAuthChecked] = React.useState(false);
  const [tenantFetched, setTenantFetched] = React.useState(false);

  const navigated = React.useRef(false);

  const brandOp = useSharedValue(0);
  const brandTY = useSharedValue(20);

  const btnOp = useSharedValue(0);
  const btnTY = useSharedValue(16);

  React.useEffect(() => {
    hydrateAuth();
    setAuthChecked(true);
  }, []);

  // React.useEffect(() => {
  //   if (!authChecked) return;

  //   SplashScreen.hideAsync().catch(() => {});
  // }, [authChecked]);

  React.useEffect(() => {
    brandOp.value = withDelay(
      500,
      withTiming(1, {
        duration: 900,
        easing: REasing.out(REasing.exp),
      })
    );

    brandTY.value = withDelay(
      500,
      withTiming(0, {
        duration: 900,
        easing: REasing.out(REasing.exp),
      })
    );

    btnOp.value = withDelay(
      1100,
      withTiming(1, {
        duration: 700,
        easing: REasing.out(REasing.exp),
      })
    );

    btnTY.value = withDelay(
      1100,
      withTiming(0, {
        duration: 700,
        easing: REasing.out(REasing.exp),
      })
    );
  }, []);

  // React.useEffect(() => {
  //   if (!authChecked) return;

  //   let alive = true;

  //   (async () => {
  //     try {
  //       await fetchAndSetTenant();
  //     } catch (e) {
  //       console.warn('Tenant fetch failed:', e);
  //     }

  //     if (alive) setTenantFetched(true);
  //   })();

  //   return () => {
  //     alive = false;
  //   };
  // }, [authChecked]);

  // React.useEffect(() => {
  //   if (!authChecked || !tenantFetched) return;

  //   let alive = true;

  //   (async () => {
  //     if (status === 'signIn') {
  //       try {
  //         await fetchCart?.();
  //       } catch {}
  //     }

  //     setTimeout(() => {
  //       if (alive && !navigated.current) {
  //         doNavigate();
  //       }
  //     }, SPLASH_DURATION_MS);
  //   })();

  //   return () => {
  //     alive = false;
  //   };
  // }, [authChecked, tenantFetched, status]);

  const doNavigate = () => {
    if (navigated.current) return;

    navigated.current = true;

    if (status === 'signIn') {
      router.replace('/storefront');
    } else {
      // guest or unauthenticated → show the auth screen first
      router.replace('/login');
    }
  };

  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOp.value,
    transform: [{ translateY: brandTY.value }],
  }));

  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOp.value,
    transform: [{ translateY: btnTY.value }],
  }));

  return (
    <View style={styles.screen}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Background image columns */}
      <View style={styles.bgCols}>
        <View style={{ width: GAP }} />

        {COL_DATA.map((c, i) => (
          <React.Fragment key={i}>
            <ScrollColumn
              imgs={c.imgs}
              goDown={c.goDown}
              speed={c.speed}
            />

            <View style={{ width: GAP }} />
          </React.Fragment>
        ))}
      </View>

      {/* Dark overlay */}
      <View style={styles.scrim} />

      {/* Foreground content */}
      <View style={styles.fg}>
        <View style={{ flex: 1 }} />

        <ReAnimated.View
          style={[styles.brandWrap, brandStyle]}
        >
          {/* Thin rule above */}
          <View style={styles.brandRule} />

          {/* Logo image */}
          <Image
            source={require('../../assets/chinese_corner.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />

          {/* Tagline */}
          <Text style={styles.brandTagline}>
            AUTHENTIC · FRESH · DELIVERED
          </Text>

          {/* Thin rule below */}
          <View style={styles.brandRule} />
        </ReAnimated.View>

        <View style={{ flex: 1 }} />

        <ReAnimated.View
          style={[styles.btnWrap, btnStyle]}
        >
          <Pressable
            onPress={doNavigate}
            style={({ pressed }) => [
              styles.btn,
              pressed && styles.btnPressed,
            ]}
          >
            {/* Optional CTA button */}
          </Pressable>
        </ReAnimated.View>

        <View
          style={{
            height: Platform.OS === 'ios' ? 44 : 24,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },

  bgCols: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    flexDirection: 'row',
    overflow: 'hidden',
  },

  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8,3,0,0.68)',
  },

  fg: {
    flex: 1,
    flexDirection: 'column',

    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
  },

  brandWrap: {
    alignItems: 'center',
    gap: 0,
    paddingHorizontal: 24,
  },

  logoImg: {
    width: 260,
    height: 130,
  },

  // Thin decorative rule
  brandRule: {
    width: 48,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#C41230',
    marginVertical: 16,
  },

  // "CHINESE" — all-caps line — red brand colour, same size as Corner
  brandChinese: {
    fontFamily: F.sans900,
    fontSize: 52,
    color: '#C41230',
    letterSpacing: 3,
    textAlign: 'center',
    lineHeight: 60,
    includeFontPadding: false,
    ...Platform.select({
      ios: {
        shadowColor: '#C41230',
        shadowOpacity: 0.55,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },

  // "Corner" — white, same size as CHINESE
  brandHero: {
    fontFamily: F.sans900,
    fontSize: 52,
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 60,
    includeFontPadding: false,
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.45,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },

  brandTagline: {
    marginTop: 12,
    fontFamily: F.sans400,
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    letterSpacing: 4.5,
  },

  // unused — kept for reference
  brandLabel: {
    fontFamily: F.sans800,
    fontSize: 13,
    color: '#C41230',
    letterSpacing: 7,
    textAlign: 'center',
    marginBottom: 6,
    includeFontPadding: false,
  },

  btnWrap: {
    width: '100%',
  },

  btn: {
    height: 56,

    backgroundColor: '#fff',
    borderRadius: 28,

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,

    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 14,
  },

  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },

  btnText: {
    fontSize: 16,
    fontFamily: F.sans800,
    color: '#111',
    letterSpacing: 0.5,
  },
});