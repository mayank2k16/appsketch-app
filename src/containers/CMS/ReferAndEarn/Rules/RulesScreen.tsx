import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ReferralRule } from '@/api/referrals';
import { useDeleteReferralRule, useReferralRules, useUpdateReferralRule } from '@/api/referrals';
import { ConfirmModal, useModal } from '@/components/ui';

import { CmsButton, CmsCard, CmsStatusBadge } from '../../components';
import { useCmsTheme } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { formatReward, inr, isRuleWithinWindow, MILESTONE_TRIGGERS, TRIGGER_LABEL } from '../utils';
import { ManageRuleModal } from './components/ManageRuleModal';

export function RulesScreen() {
  const { colors } = useCmsTheme();
  const rulesQuery = useReferralRules();
  const updateRule = useUpdateReferralRule();
  const deleteRule = useDeleteReferralRule();

  const rules = rulesQuery.data ?? [];
  const sortedRules = React.useMemo(() => {
    return [...rules].sort((a, b) => {
      const aActive = a.is_active && isRuleWithinWindow(a);
      const bActive = b.is_active && isRuleWithinWindow(b);
      if (aActive !== bActive) return aActive ? -1 : 1;
      return (b.priority || 0) - (a.priority || 0);
    });
  }, [rules]);
  const winningRule = sortedRules.find((r) => r.is_active && isRuleWithinWindow(r));

  const [manageTarget, setManageTarget] = React.useState<{ rule: ReferralRule | null; key: number }>({
    rule: null,
    key: 0,
  });
  const [deletingRule, setDeletingRule] = React.useState<ReferralRule | null>(null);
  const manageModal = useModal();
  const confirmModal = useModal();

  function openCreate() {
    setManageTarget((prev) => ({ rule: null, key: prev.key + 1 }));
    manageModal.present();
  }
  function openEdit(rule: ReferralRule) {
    setManageTarget((prev) => ({ rule, key: prev.key + 1 }));
    manageModal.present();
  }
  function openDelete(rule: ReferralRule) {
    setDeletingRule(rule);
    confirmModal.present();
  }
  function confirmDelete() {
    if (!deletingRule) return;
    deleteRule.mutate(deletingRule.id, {
      onSuccess: () => {
        confirmModal.dismiss();
        setDeletingRule(null);
      },
    });
  }
  function toggleActive(rule: ReferralRule) {
    updateRule.mutate({ id: rule.id, payload: { is_active: !rule.is_active } });
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={st.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[st.heading, { color: colors.textPrimary }]}>Referral Rules</Text>
          <Text style={[st.subheading, { color: colors.textSecondary }]}>
            Define when and how much referrers and referees earn.{' '}
            {winningRule ? (
              <Text style={{ color: colors.success, fontWeight: '700' }}>Active: {winningRule.name}</Text>
            ) : (
              <Text style={{ color: colors.danger, fontWeight: '700' }}>No active rule.</Text>
            )}
          </Text>
        </View>
        <Pressable onPress={openCreate} style={[st.addBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={16} color={colors.accentText} />
          <Text style={[st.addBtnText, { color: colors.accentText }]}>New</Text>
        </Pressable>
      </View>

      {rulesQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading rules…</Text>
        </View>
      ) : sortedRules.length === 0 ? (
        <View style={st.center}>
          <Text style={[st.emptyTitle, { color: colors.textPrimary }]}>No referral rules yet</Text>
          <Text style={[st.emptySubtitle, { color: colors.textSecondary }]}>
            Create your first rule to start rewarding users for referring their friends.
          </Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}>
          {sortedRules.map((rule) => {
            const active = rule.is_active && isRuleWithinWindow(rule);
            const winning = winningRule?.id === rule.id;
            const isMilestone = rule.is_milestone_rule ?? MILESTONE_TRIGGERS.has(rule.trigger);
            return (
              <CmsCard key={rule.id} colors={colors} style={winning ? { borderColor: colors.success, borderWidth: 1.5 } : undefined}>
                <View style={st.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.cardTitle, { color: colors.textPrimary }]}>{rule.name}</Text>
                    <Text style={[st.cardTrigger, { color: colors.textSecondary }]}>
                      {TRIGGER_LABEL[rule.trigger as keyof typeof TRIGGER_LABEL] || rule.trigger}
                    </Text>
                  </View>
                  <View style={{ gap: 4, alignItems: 'flex-end' }}>
                    {isMilestone ? <CmsStatusBadge meta={{ label: 'Milestone', color: '#7C3AED', kind: 'info' }} /> : null}
                    {winning ? (
                      <CmsStatusBadge meta={{ label: 'Active', color: colors.success, kind: 'success' }} />
                    ) : active ? (
                      <CmsStatusBadge meta={{ label: 'Queued', color: colors.warning, kind: 'warning' }} />
                    ) : (
                      <CmsStatusBadge meta={{ label: 'Off', color: colors.textSecondary, kind: 'info' }} />
                    )}
                  </View>
                </View>

                {rule.description ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>{rule.description}</Text>
                ) : null}

                <View style={[st.rewardGrid, { borderColor: colors.border }]}>
                  <RewardCell colors={colors} label="Referrer earns" value={formatReward(rule.referrer_reward_type, rule.referrer_reward_value)} />
                  <RewardCell
                    colors={colors}
                    label="Referee earns"
                    value={isMilestone ? '—' : formatReward(rule.referee_reward_type, rule.referee_reward_value)}
                  />
                </View>

                <View style={st.metaGrid}>
                  <Meta colors={colors} label="Min order" value={inr(rule.min_order_amount)} />
                  <Meta colors={colors} label="Max referrer bonus" value={inr(rule.max_bonus_per_referrer)} />
                  {!isMilestone ? <Meta colors={colors} label="Max referrals / user" value={String(rule.max_referrals_per_user)} /> : null}
                  <Meta colors={colors} label="Pending expiry" value={`${rule.pending_expiry_days} d`} />
                  <Meta colors={colors} label="Priority" value={String(rule.priority)} />
                  <Meta colors={colors} label="Clawback on refund" value={rule.clawback_on_refund ? 'Yes' : 'No'} />
                  {(rule.trigger === 'NTH_ORDER_PAID' || rule.trigger === 'NTH_ORDER_DELIVERED') && (
                    <Meta colors={colors} label="Threshold (N)" value={String(rule.referee_order_count_threshold ?? 0)} />
                  )}
                  {rule.trigger === 'CUMULATIVE_SPEND_REACHED' && (
                    <Meta colors={colors} label="Cumulative spend ≥" value={inr(rule.referee_spend_threshold)} />
                  )}
                  {(rule.trigger === 'REFERRER_SIGNUPS_MILESTONE' ||
                    rule.trigger === 'REFERRER_PAID_MILESTONE' ||
                    rule.trigger === 'REFERRER_DELIVERED_MILESTONE') && (
                    <Meta colors={colors} label="Step (every N)" value={String(rule.referrer_milestone_count ?? 0)} />
                  )}
                  {rule.trigger === 'REFERRER_SPEND_MILESTONE' && (
                    <Meta colors={colors} label="Step (every ₹)" value={inr(rule.referrer_milestone_spend)} />
                  )}
                </View>

                {rule.valid_from || rule.valid_to ? (
                  <Text style={[st.windowStrip, { color: colors.textSecondary, borderColor: colors.border }]}>
                    Valid: {rule.valid_from ? new Date(rule.valid_from).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Always'}
                    {' → '}
                    {rule.valid_to ? new Date(rule.valid_to).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Indefinite'}
                  </Text>
                ) : null}

                <View style={st.actionsRow}>
                  <CmsButton
                    colors={colors}
                    variant="ghost"
                    label={rule.is_active ? 'Deactivate' : 'Activate'}
                    onPress={() => toggleActive(rule)}
                    style={{ flex: 1 }}
                  />
                  <CmsButton colors={colors} variant="ghost" label="Edit" onPress={() => openEdit(rule)} style={{ flex: 1 }} />
                  <CmsButton colors={colors} variant="danger" label="Delete" onPress={() => openDelete(rule)} style={{ flex: 1 }} />
                </View>
              </CmsCard>
            );
          })}
        </View>
      )}

      <ManageRuleModal ref={manageModal.ref} colors={colors} rule={manageTarget.rule} openKey={manageTarget.key} onDone={() => manageModal.dismiss()} />
      <ConfirmModal
        ref={confirmModal.ref}
        title={deletingRule ? `Delete rule "${deletingRule.name}"?` : 'Delete rule?'}
        description="Existing referrals attached to this rule will still keep their bonuses. New referrals will fall back to the next active rule (if any)."
        confirmLabel="Delete"
        destructive
        loading={deleteRule.isPending}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

function RewardCell({ colors, label, value }: { colors: ReturnType<typeof useCmsTheme>['colors']; label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[cmsType.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}

function Meta({ colors, label, value }: { colors: ReturnType<typeof useCmsTheme>['colors']; label: string; value: string }) {
  return (
    <View style={{ minWidth: '45%', gap: 2 }}>
      <Text style={[cmsType.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  heading: { fontSize: 17, fontWeight: '800' },
  subheading: { fontSize: 12.5, marginTop: 4, lineHeight: 18 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 },
  addBtnText: { fontSize: 13, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptySubtitle: { fontSize: 12.5, textAlign: 'center', lineHeight: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: cmsType.listTitle,
  cardTrigger: { ...cmsType.listMeta, marginTop: 2 },
  rewardGrid: { flexDirection: 'row', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  windowStrip: { fontSize: 11.5, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  actionsRow: { flexDirection: 'row', gap: 8 },
});
