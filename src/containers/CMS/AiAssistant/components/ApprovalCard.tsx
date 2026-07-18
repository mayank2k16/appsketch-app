import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { QueryPlanStep } from '@/api/ai-assistant';

import { CmsButton, CmsCard, CmsInput } from '../../components';
import type { CmsThemeColors } from '../../theme';

type Props = {
  colors: CmsThemeColors;
  plan: QueryPlanStep[];
  disabled?: boolean;
  onApprove: () => void;
  onEdit: (editedPlan: { id: string; arguments: Record<string, unknown> }[]) => void;
  onReject: (reason: string) => void;
};

/** Human-in-the-loop gate — shows the query plan the agent wants to run
 * (which tools/tables/filters) and lets the tenant Approve, Edit the
 * arguments, or Reject before anything touches the database. Direct port of
 * Vite's `ApprovalCard.jsx`. */
export function ApprovalCard({ colors, plan, disabled, onApprove, onEdit, onReject }: Props) {
  const [editing, setEditing] = React.useState(false);
  const [showReject, setShowReject] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const [error, setError] = React.useState('');
  const [drafts, setDrafts] = React.useState<Record<string, string>>(() =>
    (plan || []).reduce<Record<string, string>>((acc, step) => {
      acc[step.id] = JSON.stringify(step.arguments || {}, null, 2);
      return acc;
    }, {})
  );

  function submitEdit() {
    try {
      const editedPlan = (plan || []).map((step) => ({
        id: step.id,
        arguments: JSON.parse(drafts[step.id] || '{}'),
      }));
      setError('');
      onEdit(editedPlan);
    } catch {
      setError('One of the edited queries is not valid JSON.');
    }
  }

  return (
    <CmsCard colors={colors} style={st.card}>
      <View style={st.head}>
        <View style={[st.badge, { backgroundColor: `${colors.accent}1A` }]}>
          <Text style={[st.badgeText, { color: colors.accent }]}>Approval needed</Text>
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>
          Review the data this assistant wants to read for your business.
        </Text>
      </View>

      {(plan || []).map((step) => (
        <View key={step.id} style={st.step}>
          <Text style={[st.tool, { color: colors.textPrimary }]}>{step.tool}</Text>
          {editing ? (
            <CmsInput
              colors={colors}
              value={drafts[step.id]}
              onChangeText={(v) => setDrafts((d) => ({ ...d, [step.id]: v }))}
              multiline
              numberOfLines={6}
            />
          ) : (
            <Text style={[st.args, { color: colors.textSecondary }]}>{JSON.stringify(step.arguments || {}, null, 2)}</Text>
          )}
        </View>
      ))}

      {error ? <Text style={{ color: colors.danger, fontSize: 12.5 }}>{error}</Text> : null}

      {showReject ? (
        <CmsInput
          colors={colors}
          placeholder="Reason (optional) — e.g. wrong date range"
          value={rejectReason}
          onChangeText={setRejectReason}
        />
      ) : null}

      <View style={st.actions}>
        {editing ? (
          <>
            <CmsButton colors={colors} label="Run edited" onPress={submitEdit} disabled={disabled} style={{ flex: 1 }} />
            <CmsButton colors={colors} label="Cancel" variant="ghost" onPress={() => setEditing(false)} style={{ flex: 1 }} />
          </>
        ) : showReject ? (
          <>
            <CmsButton
              colors={colors}
              label="Confirm reject"
              variant="danger"
              onPress={() => onReject(rejectReason)}
              disabled={disabled}
              style={{ flex: 1 }}
            />
            <CmsButton colors={colors} label="Back" variant="ghost" onPress={() => setShowReject(false)} style={{ flex: 1 }} />
          </>
        ) : (
          <>
            <CmsButton colors={colors} label="Approve & run" onPress={onApprove} disabled={disabled} style={{ flex: 1 }} />
            <CmsButton colors={colors} label="Edit" variant="ghost" onPress={() => setEditing(true)} disabled={disabled} style={{ flex: 1 }} />
            <CmsButton colors={colors} label="Reject" variant="ghost" onPress={() => setShowReject(true)} disabled={disabled} style={{ flex: 1 }} />
          </>
        )}
      </View>
    </CmsCard>
  );
}

const st = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 10 },
  head: { gap: 6 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11.5, fontWeight: '700' },
  step: { gap: 4, marginTop: 10 },
  tool: { fontSize: 13, fontWeight: '700' },
  args: { fontFamily: 'monospace', fontSize: 11.5 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
