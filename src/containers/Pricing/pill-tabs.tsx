import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

/** One tab: icon + name, and its saving ("17% OFF") underneath. */
export type PillTab = {
  key: string;
  name: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  off?: string | null;
  /** The user's own plan. */
  dot?: boolean;
};

/** Bar colours: white bar + orange pill (white theme), black bar + orange
 *  pill (dark theme). */
export type PillSkin = {
  bar: string;
  pill: string;
  text: string;
  onPill: string;
  off: string;
};

const PAD = 5; // bar inset around the pill
const H = 58; // tab height

function Item({
  tab,
  on,
  k,
  onPick,
}: {
  tab: PillTab;
  on: boolean;
  k: PillSkin;
  onPick: (key: string) => void;
}) {
  const color = on ? k.onPill : k.text;
  return (
    <PressableScale
      onPress={() => onPick(tab.key)}
      haptic={on ? false : 'select'}
      scaleTo={0.95}
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      accessibilityLabel={tab.off ? `${tab.name}, ${tab.off}` : tab.name}
      style={st.item}
    >
      <View style={st.row}>
        <Ionicons name={tab.icon} size={15} color={color} />
        <Text style={[st.name, { color }]} numberOfLines={1}>
          {tab.name}
        </Text>
        {tab.dot ? (
          <View style={[st.dot, { backgroundColor: on ? k.onPill : k.off }]} />
        ) : null}
      </View>
      {tab.off ? (
        <Text
          style={[st.off, { color: on ? k.onPill : k.off }]}
          numberOfLines={1}
        >
          {tab.off}
        </Text>
      ) : null}
    </PressableScale>
  );
}

/** A rounded bar of tabs with a sliding pill under the picked one. */
export function PillTabs({
  tabs,
  value,
  onPick,
  k,
}: {
  tabs: PillTab[];
  value: string;
  onPick: (key: string) => void;
  k: PillSkin;
}) {
  const [w, setW] = React.useState(0);
  const count = Math.max(1, tabs.length);
  const index = Math.max(
    0,
    tabs.findIndex((x) => x.key === value)
  );
  const step = (w - PAD * 2) / count;
  const x = useSharedValue(0);
  React.useEffect(() => {
    x.value = w
      ? withSpring(index * step, { damping: 20, stiffness: 220 })
      : index * step;
  }, [index, step, w, x]);
  const pill = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));
  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={[st.bar, { backgroundColor: k.bar }]}
    >
      {w ? (
        <Animated.View
          style={[st.pill, { width: step, backgroundColor: k.pill }, pill]}
        />
      ) : null}
      {tabs.map((tab) => (
        <Item
          key={tab.key}
          tab={tab}
          on={tab.key === value}
          k={k}
          onPick={onPick}
        />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    padding: PAD,
    borderRadius: (H + PAD * 2) / 2,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  pill: {
    position: 'absolute',
    top: PAD,
    left: PAD,
    height: H,
    borderRadius: H / 2,
  },
  item: {
    flex: 1,
    height: H,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontFamily: F.sans800, fontSize: 14, letterSpacing: -0.2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  off: { fontFamily: F.sans900, fontSize: 10.5, letterSpacing: 0.3 },
});
