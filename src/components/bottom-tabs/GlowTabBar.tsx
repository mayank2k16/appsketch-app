import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

import { F } from '@/lib/fonts';
import { useAppTheme, type AppColors } from '@/lib/theme';

import { TAB_CONFIG } from './tab-config';

const CARD_R = 15;
const GLOW_SIZE = 30;

// Tab column width, computed the same way GallerySection sizes its marquee
// columns — used to size the active label's gradient-text SVG box.
const { width: SCREEN_W } = Dimensions.get('window');
const ROOT_PAD_H = 12 * 2;
const ROW_GAP = 9;
const TAB_W = (SCREEN_W - ROOT_PAD_H - ROW_GAP * (TAB_CONFIG.length - 1)) / TAB_CONFIG.length;
const LABEL_W = Math.max(48, TAB_W - 8);

// ─── One tab ──────────────────────────────────────────────────────────────────
// Flat, unbordered tab. The focused tab lifts slightly, scales its icon, lights
// a small glow behind (just) the icon, and swaps its label from a solid muted
// colour to the brand gradient — cross-faded via the same `focus` value that
// drives everything else, so no extra animation wiring is needed.
function TabCard({
  routeName,
  isFocused,
  onPress,
  t,
}: {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  t: AppColors;
}) {
  const conf = TAB_CONFIG.find((c) => c.name === routeName) ?? TAB_CONFIG[0];

  // 0 = inactive, 1 = active. Drives icon glow, lift, icon scale and label crossfade.
  const focus = React.useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(focus, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      damping: 13,
      stiffness: 220,
    }).start();
  }, [isFocused]);

  const iconScale = focus.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const lift = focus.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const inactiveLabelOpacity = focus.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  const gradientId = `tabLabelGrad-${routeName}`;

  return (
    <Pressable onPress={onPress} style={s.tab} hitSlop={6}>
      <Animated.View style={[s.cardWrap, { transform: [{ translateY: lift }] }]}>
        <View style={[s.cardInner]}>
          <View style={s.iconWrap}>
            {/* Glow behind just the icon. Needs an opaque fill so iOS casts the
                coloured shadow; it stays hidden behind the icon, only its
                shadow halo shows. */}
            <Animated.View
              pointerEvents="none"
              style={[s.iconGlow, { shadowColor: t.tabGlow, backgroundColor: t.tabGlow, opacity: focus }]}
            />
            <Animated.View style={{ transform: [{ scale: iconScale }] }}>
              <Ionicons
                name={isFocused ? conf.iconActive : conf.icon}
                size={21}
                color={isFocused ? t.tabIconActive : t.tabIconInactive}
              />
            </Animated.View>
          </View>

          <View style={s.labelWrap}>
            <Animated.Text
              allowFontScaling={false}
              numberOfLines={1}
              style={[s.label, { color: t.tabLabelInactive, opacity: inactiveLabelOpacity }]}
            >
              {conf.label}
            </Animated.Text>

            <Animated.View
              pointerEvents="none"
              style={[s.gradientLabelWrap, { opacity: focus }]}
            >
              <Svg width={LABEL_W} height={13}>
                <Defs>
                  <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={t.tabLabelGradient[0]} />
                    <Stop offset="100%" stopColor={t.tabLabelGradient[1]} />
                  </LinearGradient>
                </Defs>
                <SvgText
                  x="50%"
                  y="10.5"
                  fontSize={9.5}
                  fontFamily={F.sans700}
                  textAnchor="middle"
                  fill={`url(#${gradientId})`}
                >
                  {conf.label}
                </SvgText>
              </Svg>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
export function GlowTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);

  return (
    <View style={[s.root, { backgroundColor: t.tabBarBg, paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={s.row}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          return (
            <TabCard
              key={route.key}
              routeName={route.name}
              isFocused={isFocused}
              onPress={onPress}
              t={t}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    paddingTop: 10,
    paddingHorizontal: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  tab: {
    flex: 1,
  },

  cardWrap: {
    borderRadius: CARD_R,
  },

  // Plain, unbordered fill — no gradient ring.
  cardInner: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  iconWrap: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Coloured glow — sits behind just the icon, revealed by opacity when active
  iconGlow: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },

  labelWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    fontFamily: F.sans700,
    fontSize: 10.5,
    letterSpacing: 0.2,
  },

  // Active label overlay — same box as the plain label, crossfaded via `focus`.
  gradientLabelWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
