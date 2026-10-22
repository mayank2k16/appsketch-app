import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { cmsType } from '../theme/cms-typography';
import { useCmsTheme } from '../theme/use-cms-theme';

export type CmsStatusMeta = { label: string; color: string; kind: 'success' | 'danger' | 'warning' | 'info' };

/** Colored status pill — used by Orders (order/payment status) and
 * Notifications (log send status) alike. Each domain owns its own
 * string→`CmsStatusMeta` mapping (e.g. `Orders/utils.ts`'s
 * `getOrderStatusMeta`) and just renders the result here. */
export function CmsStatusBadge({ meta }: { meta: CmsStatusMeta }) {
  const { colors } = useCmsTheme();
  if (colors.kind === 'light') {
    // White: success/danger/warning snap to the one status set from
    // docs/white-theme.md at ~8% alpha; `info` keeps the domain's own hue
    // (it distinguishes neutral states such as "In Transit" vs "Draft").
    const color = meta.kind === 'info' ? meta.color : colors[meta.kind];
    return (
      <View style={[st.badge, { backgroundColor: `${color}14`, borderColor: `${color}29` }]}>
        <View style={[st.dot, { backgroundColor: color }]} />
        <Text style={[st.label, { color }]}>{meta.label}</Text>
      </View>
    );
  }
  return (
    <View style={[st.badge, { backgroundColor: `${meta.color}18`, borderColor: `${meta.color}40` }]}>
      <View style={[st.dot, { backgroundColor: meta.color }]} />
      <Text style={[st.label, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: cmsType.listBadge,
});
