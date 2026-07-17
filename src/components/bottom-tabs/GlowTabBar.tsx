import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

import { F } from '@/lib/fonts';
import { useAppTheme, type AppColors } from '@/lib/theme';

import { TAB_CONFIG } from './tab-config';
import { TabIcon } from './TabIcon';

const LABEL_GRADIENT_STOPS_PCT = [0, 40, 68, 100];

// Tab column width, computed the same way GallerySection sizes its marquee
// columns — used to size the active label's gradient-text SVG box.
const { width: SCREEN_W } = Dimensions.get('window');
const ROOT_PAD_H = 12 * 2;
const ROW_GAP = 9;
const TAB_W = (SCREEN_W - ROOT_PAD_H - ROW_GAP * (TAB_CONFIG.length - 1)) / TAB_CONFIG.length;
const LABEL_W = Math.max(48, TAB_W - 8);

// ─── One tab ──────────────────────────────────────────────────────────────────
// Transparent tab, no chip background. Active vs inactive differs ONLY in the
// colour of the icon and label — no glow, no scale, no lift, no transform of
// any kind. The icon's stroke and the label's fill switch (discretely, not
// animated) between a muted solid colour and the brand aura gradient.
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
  const iconGradientId = `tabIconAura-${routeName}`;
  const labelGradientId = `tabLabelAura-${routeName}`;

  return (
    <Pressable onPress={onPress} style={s.tab} hitSlop={6}>
      <View style={s.cardInner}>
        <View style={s.iconWrap}>
          <TabIcon
            iconKey={conf.iconKey}
            active={isFocused}
            inactiveColor={t.tabIconInactive}
            gradientStops={t.tabLabelGradient}
            gradientId={iconGradientId}
          />
        </View>

        <View style={s.labelWrap}>
          {isFocused ? (
            <Svg width={LABEL_W} height={15}>
              <Defs>
                <LinearGradient id={labelGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                  {t.tabLabelGradient.map((color, i) => (
                    <Stop key={i} offset={`${LABEL_GRADIENT_STOPS_PCT[i]}%`} stopColor={color} />
                  ))}
                </LinearGradient>
              </Defs>
              <SvgText
                x="50%"
                y="12"
                fontSize={11}
                fontFamily={F.sans700}
                textAnchor="middle"
                fill={`url(#${labelGradientId})`}
              >
                {conf.label}
              </SvgText>
            </Svg>
          ) : (
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={[s.label, { color: t.tabLabelInactive }]}
            >
              {conf.label}
            </Text>
          )}
        </View>
      </View>
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
    paddingTop: 8,
    paddingHorizontal: 10,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  tab: {
    flex: 1,
  },

  // Transparent — no chip background, blends into the bar.
  cardInner: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },

  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  labelWrap: {
    width: '100%',
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    fontFamily: F.sans700,
    fontSize: 11,
    letterSpacing: 0.25,
  },
});
