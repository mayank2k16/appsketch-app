import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { VisitorReferrer } from '@/api/analytics';

import { CmsCard } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { getReferrerIcon, toNumber } from '../utils';

type Props = { colors: CmsThemeColors; referrerData: VisitorReferrer[] | undefined };

export function TopReferrersCard({ colors, referrerData }: Props) {
  const ranked = React.useMemo(() => {
    return (referrerData ?? [])
      .map((r) => ({ name: r.referrer || 'Direct / Unknown', views: toNumber(r.page_views) }))
      .filter((r) => r.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [referrerData]);

  const maxViews = ranked.length ? ranked[0].views : 0;

  return (
    <CmsCard colors={colors} title="Top Referrers">
      {ranked.length === 0 ? (
        <View style={st.empty}>
          <Text style={{ color: colors.textSecondary }}>No data available.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {ranked.map((item, i) => {
            const pct = maxViews > 0 ? (item.views / maxViews) * 100 : 0;
            return (
              <View key={`${item.name}-${i}`} style={st.row}>
                <View style={[st.iconRing, { backgroundColor: `${colors.accent}1A` }]}>
                  <Ionicons
                    name={getReferrerIcon(item.name) as React.ComponentProps<typeof Ionicons>['name']}
                    size={16}
                    color={colors.accent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={st.rowHeader}>
                    <Text style={[st.name, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[st.views, { color: colors.textSecondary }]}>
                      {item.views.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={[st.track, { backgroundColor: colors.border }]}>
                    <View style={[st.fill, { width: `${pct}%`, backgroundColor: colors.accent }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </CmsCard>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconRing: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  name: { fontSize: 12.5, fontWeight: '600', flex: 1, marginRight: 8 },
  views: { fontSize: 12, fontWeight: '700' },
  track: { height: 5, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  empty: { paddingVertical: 20, alignItems: 'center' },
});
