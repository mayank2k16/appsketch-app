import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useProductReviewHistory } from '@/api/products';
import type { ProductReviewAction } from '@/api/products';

import type { CmsThemeColors } from '../../theme';

const ACTION_LABELS: Record<ProductReviewAction, string> = {
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  RESUBMITTED: 'Resubmitted',
};

const ACTION_COLOR: Record<ProductReviewAction, keyof CmsThemeColors> = {
  SUBMITTED: 'textSecondary',
  APPROVED: 'success',
  REJECTED: 'danger',
  RESUBMITTED: 'accent',
};

type Props = {
  colors: CmsThemeColors;
  productId: number;
};

/** Read-only approve/reject/resubmit log for one product — shared by the
 * marketplace's review-detail view and (once ported) a vendor's own product
 * view, matching Vite's `AddProductModal/ReviewHistory`. */
export function ReviewHistory({ colors, productId }: Props) {
  const query = useProductReviewHistory(productId);
  const logs = query.data ?? [];

  if (query.isLoading) {
    return (
      <View style={st.center}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  if (logs.length === 0) {
    return <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>No review history yet.</Text>;
  }

  return (
    <View style={{ gap: 10 }}>
      {logs.map((log) => {
        const actionKey = log.action as ProductReviewAction;
        const dotColor = colors[ACTION_COLOR[actionKey] ?? 'textSecondary'];
        return (
          <View key={log.id} style={[st.entry, { borderColor: colors.border }]}>
            <View style={st.headerRow}>
              <View style={st.actionRow}>
                <View style={[st.dot, { backgroundColor: dotColor }]} />
                <Text style={[st.action, { color: colors.textPrimary }]}>
                  {ACTION_LABELS[actionKey] ?? log.action}
                </Text>
              </View>
              <Text style={[st.date, { color: colors.textSecondary }]}>
                {log.created_on ? new Date(log.created_on).toLocaleString() : ''}
              </Text>
            </View>
            {log.actor_name || log.actor_tenant_name ? (
              <Text style={[st.actor, { color: colors.textSecondary }]}>
                By {log.actor_name || '—'}
                {log.actor_tenant_name ? ` (${log.actor_tenant_name})` : ''}
              </Text>
            ) : null}
            {log.notes ? <Text style={[st.notes, { color: colors.textPrimary }]}>{log.notes}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  center: { paddingVertical: 12, alignItems: 'center' },
  entry: { borderLeftWidth: 2, paddingLeft: 10, gap: 3 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  action: { fontSize: 13, fontWeight: '700' },
  date: { fontSize: 11 },
  actor: { fontSize: 12 },
  notes: { fontSize: 12.5, lineHeight: 17 },
});
