import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RotatingBorderGradient } from '@/components/ui/RotatingBorderGradient';
import { F } from '@/lib/fonts';
import { useBrandedCoderTheme, type AppColors } from '@/lib/theme';

import { TAB_CONFIG } from './tab-config';
import { TabIcon } from './TabIcon';

/** Border thickness. 1px, not the prompt card's 1.5 — the bar runs the full
 *  width of the screen, so the same stroke reads heavier here. */
const RING_W = 1;
/** Corner radius of the bar's top edge. The bottom corners stay square: the
 *  bar sits flush against the bottom of the screen and its lower edge is
 *  behind the home indicator, so rounding it would only round nothing. */
const RING_RADIUS = 22;
/** One full turn. Deliberately slower than the prompt card's 6s — the tab bar
 *  is on screen on EVERY route, so what reads as alive on one card reads as
 *  restless when it never goes away. */
const TAB_SPIN_MS = 14000;

/** Where the lit band sits within one turn. Same shape as the prompt card's:
 *  a bright head, then transparent for most of the sweep, so the border is a
 *  travelling highlight rather than a permanently glowing outline. */
const RING_STOPS: [number, number, number, number] = [0, 0.18, 0.42, 1];

// ─── One tab ──────────────────────────────────────────────────────────────────
// Transparent tab, no chip background. Active vs inactive differs ONLY in the
// colour of the icon and label — no glow, no scale, no lift, no transform of
// any kind. The icon's stroke switches (discretely, not animated) between a
// muted solid colour and the brand ramp; the label just gets brighter.
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

        {/* Labels stay white — plain text in both states, brighter when
            active. The ICON is what carries the ramp; running it through the
            label too meant four words of gradient type at 11px, where the
            stops are too close together to read as a gradient and just make
            the word muddier than its neighbours. One coloured element per
            tab, and it is the one with room for it. */}
        <View style={s.labelWrap}>
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={[
              s.label,
              { color: isFocused ? t.tabLabelActive : t.tabLabelInactive },
            ]}
          >
            {conf.label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Divider between two tabs ─────────────────────────────────────────────────
// A 1px rule that fades out at both ends, so it reads as a hairline between
// two labels rather than a hard rule cutting the bar into boxes. Each divider
// takes ONE stop of the ramp, in order left to right — orange, magenta,
// violet — so the three of them walk the same warm→cool run the border and
// the hero heading do, instead of three identical grey lines.
function TabDivider({ color }: { color: string }) {
  return (
    <ExpoLinearGradient
      colors={['transparent', color, 'transparent']}
      locations={[0, 0.5, 1]}
      style={s.divider}
      pointerEvents="none"
    />
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
export function GlowTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useBrandedCoderTheme(colorScheme);

  // The ramp with a transparent tail appended — see RING_STOPS. Memoised
  // because `RotatingBorderGradient` takes it as a prop and a fresh array
  // every render would defeat any downstream memo.
  const ringColors = React.useMemo(
    () =>
      [...t.agentBorderGradient, 'transparent'] as [
        string,
        string,
        ...string[],
      ],
    [t.agentBorderGradient]
  );

  return (
    // Two layers: `ring` reserves RING_W all round and clips, the rotating
    // gradient fills it, and `inner` sits on top with an OPAQUE fill — so all
    // that shows of the gradient is the RING_W stroke at the edge. Same
    // arrangement as Home's prompt card, and the same component drawing it.
    <View style={[s.ring, { paddingBottom: 0 }]}>
      <RotatingBorderGradient
        colors={ringColors}
        locations={RING_STOPS}
        durationMs={TAB_SPIN_MS}
      />
      <View
        style={[
          s.inner,
          {
            backgroundColor: t.tabBarBg,
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}
      >
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
              <React.Fragment key={route.key}>
                {index > 0 && (
                  <TabDivider
                    // index - 1 so the FIRST divider takes the first stop.
                    // Modulo guards a fifth tab being added later without
                    // anyone remembering this line exists.
                    color={
                      t.agentBorderGradient[
                        (index - 1) % t.agentBorderGradient.length
                      ]
                    }
                  />
                )}
                <TabCard
                  routeName={route.name}
                  isFocused={isFocused}
                  onPress={onPress}
                  t={t}
                />
              </React.Fragment>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Outer layer: reserves the stroke and clips the spinning gradient to the
  // bar's silhouette. No background of its own — the gradient IS its fill,
  // and `inner` covers all of it but the RING_W edge.
  ring: {
    // Floats over the scene instead of taking a row under it. In flow, the
    // wedges outside the rounded top corners are cut out of an opaque strip
    // with nothing behind them but the navigator's black; floating puts the
    // screen back there. Every tab screen reserves the height it no longer
    // occupies — see useTabBarHeight.
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderTopLeftRadius: RING_RADIUS,
    borderTopRightRadius: RING_RADIUS,
    paddingTop: RING_W,
    paddingHorizontal: RING_W,
  },

  // Inner layer: the bar proper. Opaque — a translucent fill here would let
  // the sweep wash across the whole bar instead of only its edge.
  inner: {
    borderTopLeftRadius: RING_RADIUS - RING_W,
    borderTopRightRadius: RING_RADIUS - RING_W,
    overflow: 'hidden',
    paddingTop: 8,
    paddingHorizontal: 10 - RING_W,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  // Sits in the row's flow between two tabs, so the `gap` above spaces it
  // from both. Fixed width and no flex, so the tabs keep splitting the rest
  // of the width evenly between them.
  divider: {
    width: 1,
    // Tall enough to span the icon AND the label beneath it. At 26 it covered
    // only the icon and read as sitting too high in the bar, because
    // `cardInner` is 50 tall and the icon occupies its top half.
    height: 36,
    alignSelf: 'center',
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
