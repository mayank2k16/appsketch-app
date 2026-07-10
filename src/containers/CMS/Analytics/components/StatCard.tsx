import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CmsThemeColors } from '../../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/** Eases a number from 0 to `target` over `duration`ms using
 * `requestAnimationFrame` — a plain-RN stand-in for the Vite reference's
 * framer-motion `animate()` counter, no extra animation dependency needed. */
function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    let raf: ReturnType<typeof requestAnimationFrame>;
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

type Props = {
  colors: CmsThemeColors;
  icon: IoniconName;
  title: string;
  rawValue: number;
  formatValue: (value: number) => string;
  percentage: number;
  isPositive: boolean;
  meta: string;
};

export function StatCard({ colors, icon, title, rawValue, formatValue, percentage, isPositive, meta }: Props) {
  const animated = useCountUp(rawValue);
  const trendColor = isPositive ? colors.success : colors.danger;

  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.header}>
        <View style={[st.iconRing, { backgroundColor: `${colors.accent}1A` }]}>
          <Ionicons name={icon} size={16} color={colors.accent} />
        </View>
        <Text style={[st.title, { color: colors.textSecondary }]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <Text style={[st.value, { color: colors.textPrimary }]} numberOfLines={1}>
        {formatValue(animated)}
      </Text>

      <View style={st.footer}>
        <View style={[st.badge, { backgroundColor: `${trendColor}1A` }]}>
          <Ionicons name={isPositive ? 'trending-up' : 'trending-down'} size={11} color={trendColor} />
          <Text style={[st.badgeText, { color: trendColor }]}>{percentage}%</Text>
        </View>
        <Text style={[st.meta, { color: colors.textSecondary }]} numberOfLines={1}>
          {meta}
        </Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    width: 190,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconRing: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  value: { fontSize: 21, fontWeight: '800' },
  footer: { gap: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  meta: { fontSize: 10.5 },
});
