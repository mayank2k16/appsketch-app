import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ReferralRule, ReferralTrigger } from '@/api/referrals';
import { useCreateReferralRule, useUpdateReferralRule } from '@/api/referrals';

import { CmsButton, CmsCard, CmsInput, CmsSelect, CmsSwitch, CmsModal } from '../../../components';
import type { CmsThemeColors } from '../../../theme';
import { cmsType } from '../../../theme/cms-typography';
import {
  MILESTONE_TRIGGERS,
  TRIGGER_LABEL,
  USES_ORDER_COUNT_THRESHOLD,
  USES_REFERRER_COUNT_THRESHOLD,
  USES_REFERRER_SPEND_THRESHOLD,
  USES_SPEND_THRESHOLD,
} from '../../utils';

const TRIGGER_OPTIONS = (Object.keys(TRIGGER_LABEL) as ReferralTrigger[]).map((value) => ({
  value,
  label: TRIGGER_LABEL[value],
}));

const REWARD_TYPE_OPTIONS = [
  { value: 'FLAT', label: 'Flat ₹' },
  { value: 'PERCENT', label: '% of order' },
  { value: 'TIERED', label: 'Tiered (JSON)' },
];

const TRIGGER_DOC: Record<string, string> = {
  SIGNUP_VERIFIED: 'Fires once when the referee verifies their phone/email after signup. Pays both the referrer and the referee.',
  FIRST_ORDER_PAID: "Fires when the referee's first order is successfully paid. Pays both parties.",
  FIRST_ORDER_DELIVERED: "Fires when the referee's first order is delivered. Pays both parties.",
  NTH_ORDER_PAID: 'Fires when the referee places their N-th paid order (N below). Pays both parties.',
  NTH_ORDER_DELIVERED: 'Fires when the referee receives their N-th delivered order. Pays both parties.',
  CUMULATIVE_SPEND_REACHED: "Fires when the referee's cumulative paid GMV crosses the threshold (below). Pays both parties.",
  REFERRER_SIGNUPS_MILESTONE: 'Pays the referrer once for every N verified referees they bring in (5, 10, 15…). Referee earns nothing from this rule.',
  REFERRER_PAID_MILESTONE: 'Pays the referrer once for every N referees who place their first paid order. Multi-level.',
  REFERRER_DELIVERED_MILESTONE: 'Pays the referrer once for every N referees who receive their first delivery. Multi-level.',
  REFERRER_SPEND_MILESTONE: 'Pays the referrer once for every ₹N of cumulative paid GMV across all their referees. Multi-level.',
};

type FormState = {
  name: string;
  description: string;
  trigger: string;
  referrer_reward_type: string;
  referrer_reward_value: string;
  referee_reward_type: string;
  referee_reward_value: string;
  min_order_amount: string;
  max_bonus_per_referrer: string;
  max_referrals_per_user: string;
  pending_expiry_days: string;
  is_active: boolean;
  priority: string;
  valid_from: string;
  valid_to: string;
  clawback_on_refund: boolean;
  tiers_json: string;
  referee_order_count_threshold: string;
  referee_spend_threshold: string;
  referrer_milestone_count: string;
  referrer_milestone_spend: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  trigger: 'FIRST_ORDER_PAID',
  referrer_reward_type: 'FLAT',
  referrer_reward_value: '50',
  referee_reward_type: 'FLAT',
  referee_reward_value: '50',
  min_order_amount: '0',
  max_bonus_per_referrer: '10000',
  max_referrals_per_user: '50',
  pending_expiry_days: '30',
  is_active: true,
  priority: '0',
  valid_from: '',
  valid_to: '',
  clawback_on_refund: true,
  tiers_json: '',
  referee_order_count_threshold: '0',
  referee_spend_threshold: '0',
  referrer_milestone_count: '0',
  referrer_milestone_spend: '0',
};

type Props = {
  colors: CmsThemeColors;
  rule: ReferralRule | null;
  openKey: number;
  onDone: () => void;
};

export const ManageRuleModal = React.forwardRef<BottomSheetModal, Props>(({ colors, rule, openKey, onDone }, ref) => {
  const isEdit = rule !== null;
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const createRule = useCreateReferralRule();
  const updateRule = useUpdateReferralRule();
  const isSubmitting = createRule.isPending || updateRule.isPending;

  React.useEffect(() => {
    setErrors({});
    if (isEdit && rule) {
      setForm({
        name: rule.name || '',
        description: rule.description || '',
        trigger: rule.trigger || 'FIRST_ORDER_PAID',
        referrer_reward_type: rule.referrer_reward_type || 'FLAT',
        referrer_reward_value: String(rule.referrer_reward_value ?? 0),
        referee_reward_type: rule.referee_reward_type || 'FLAT',
        referee_reward_value: String(rule.referee_reward_value ?? 0),
        min_order_amount: String(rule.min_order_amount ?? 0),
        max_bonus_per_referrer: String(rule.max_bonus_per_referrer ?? 0),
        max_referrals_per_user: String(rule.max_referrals_per_user ?? 50),
        pending_expiry_days: String(rule.pending_expiry_days ?? 30),
        is_active: !!rule.is_active,
        priority: String(rule.priority ?? 0),
        valid_from: rule.valid_from ? rule.valid_from.slice(0, 16) : '',
        valid_to: rule.valid_to ? rule.valid_to.slice(0, 16) : '',
        clawback_on_refund: rule.clawback_on_refund ?? true,
        tiers_json: rule.tiers ? JSON.stringify(rule.tiers, null, 2) : '',
        referee_order_count_threshold: String(rule.referee_order_count_threshold ?? 0),
        referee_spend_threshold: String(rule.referee_spend_threshold ?? 0),
        referrer_milestone_count: String(rule.referrer_milestone_count ?? 0),
        referrer_milestone_spend: String(rule.referrer_milestone_spend ?? 0),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKey, isEdit, rule]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  const isMilestone = MILESTONE_TRIGGERS.has(form.trigger);
  const needsOrderCount = USES_ORDER_COUNT_THRESHOLD.has(form.trigger);
  const needsSpend = USES_SPEND_THRESHOLD.has(form.trigger);
  const needsReferrerCount = USES_REFERRER_COUNT_THRESHOLD.has(form.trigger);
  const needsReferrerSpend = USES_REFERRER_SPEND_THRESHOLD.has(form.trigger);
  const showTiers = form.referrer_reward_type === 'TIERED' || form.referee_reward_type === 'TIERED';

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (Number(form.referrer_reward_value) < 0) errs.referrer_reward_value = 'Must be ≥ 0';
    if (Number(form.referee_reward_value) < 0) errs.referee_reward_value = 'Must be ≥ 0';
    if (Number(form.max_bonus_per_referrer) < 0) errs.max_bonus_per_referrer = 'Must be ≥ 0';
    if (form.tiers_json.trim()) {
      try {
        JSON.parse(form.tiers_json);
      } catch {
        errs.tiers_json = 'Invalid JSON';
      }
    }
    if (needsOrderCount) {
      const n = Number(form.referee_order_count_threshold);
      if (!Number.isFinite(n) || n < 1) errs.referee_order_count_threshold = 'Enter a positive whole number (≥ 1)';
    }
    if (needsSpend) {
      const n = Number(form.referee_spend_threshold);
      if (!Number.isFinite(n) || n <= 0) errs.referee_spend_threshold = 'Enter a value > 0';
    }
    if (needsReferrerCount) {
      const n = Number(form.referrer_milestone_count);
      if (!Number.isFinite(n) || n < 1) errs.referrer_milestone_count = 'Enter a positive whole number (≥ 1)';
    }
    if (needsReferrerSpend) {
      const n = Number(form.referrer_milestone_spend);
      if (!Number.isFinite(n) || n <= 0) errs.referrer_milestone_spend = 'Enter a value > 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      trigger: form.trigger,
      referrer_reward_type: form.referrer_reward_type,
      referrer_reward_value: form.referrer_reward_value || '0',
      referee_reward_type: form.referee_reward_type,
      referee_reward_value: form.referee_reward_value || '0',
      min_order_amount: form.min_order_amount || '0',
      max_bonus_per_referrer: form.max_bonus_per_referrer || '0',
      max_referrals_per_user: Number(form.max_referrals_per_user || 0),
      pending_expiry_days: Number(form.pending_expiry_days || 0),
      is_active: !!form.is_active,
      priority: Number(form.priority || 0),
      valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
      valid_to: form.valid_to ? new Date(form.valid_to).toISOString() : null,
      clawback_on_refund: !!form.clawback_on_refund,
      tiers: form.tiers_json.trim() ? JSON.parse(form.tiers_json) : {},
      referee_order_count_threshold: needsOrderCount ? Number(form.referee_order_count_threshold || 0) : 0,
      referee_spend_threshold: needsSpend ? form.referee_spend_threshold || '0' : '0',
      referrer_milestone_count: needsReferrerCount ? Number(form.referrer_milestone_count || 0) : 0,
      referrer_milestone_spend: needsReferrerSpend ? form.referrer_milestone_spend || '0' : '0',
    };

    if (isEdit && rule) {
      updateRule.mutate({ id: rule.id, payload }, { onSuccess: () => onDone() });
    } else {
      createRule.mutate(payload, { onSuccess: () => onDone() });
    }
  }

  return (
    <CmsModal ref={ref} colors={colors} snapPoints={['95%']} title={isEdit ? 'Edit Referral Rule' : 'New Referral Rule'}>
      <BottomSheetScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <CmsCard colors={colors} title="Basics">
          <CmsInput colors={colors} label="Rule name" placeholder="e.g. Diwali 2026" value={form.name} onChangeText={(v) => set('name', v)} />
          <CmsSelect
            colors={colors}
            label="Trigger event"
            placeholder="Select trigger"
            value={form.trigger}
            options={TRIGGER_OPTIONS}
            onSelect={(v) => set('trigger', String(v))}
          />
          <CmsInput
            colors={colors}
            label="Description"
            placeholder="Internal description / notes (optional)"
            value={form.description}
            onChangeText={(v) => set('description', v)}
            multiline
            numberOfLines={2}
          />
          {TRIGGER_DOC[form.trigger] ? (
            <Text style={[st.helpText, { color: colors.textSecondary }]}>{TRIGGER_DOC[form.trigger]}</Text>
          ) : null}

          {needsOrderCount ? (
            <CmsInput
              colors={colors}
              label="N — referee order count"
              keyboardType="number-pad"
              placeholder="e.g. 3"
              value={form.referee_order_count_threshold}
              onChangeText={(v) => set('referee_order_count_threshold', v)}
              error={errors.referee_order_count_threshold}
            />
          ) : null}
          {needsSpend ? (
            <CmsInput
              colors={colors}
              label="Cumulative referee spend (₹)"
              keyboardType="decimal-pad"
              placeholder="e.g. 5000"
              value={form.referee_spend_threshold}
              onChangeText={(v) => set('referee_spend_threshold', v)}
              error={errors.referee_spend_threshold}
            />
          ) : null}
          {needsReferrerCount ? (
            <CmsInput
              colors={colors}
              label="N — referrer milestone count"
              keyboardType="number-pad"
              placeholder="e.g. 5 (fires at 5, 10, 15…)"
              value={form.referrer_milestone_count}
              onChangeText={(v) => set('referrer_milestone_count', v)}
              error={errors.referrer_milestone_count}
            />
          ) : null}
          {needsReferrerSpend ? (
            <CmsInput
              colors={colors}
              label="Cumulative referee GMV (₹)"
              keyboardType="decimal-pad"
              placeholder="e.g. 10000 (fires at 10k, 20k…)"
              value={form.referrer_milestone_spend}
              onChangeText={(v) => set('referrer_milestone_spend', v)}
              error={errors.referrer_milestone_spend}
            />
          ) : null}
        </CmsCard>

        <CmsCard colors={colors} title="Rewards">
          <CmsSelect
            colors={colors}
            label="Referrer reward type"
            placeholder="Select type"
            value={form.referrer_reward_type}
            options={REWARD_TYPE_OPTIONS}
            onSelect={(v) => set('referrer_reward_type', String(v))}
          />
          <CmsInput
            colors={colors}
            label={form.referrer_reward_type === 'PERCENT' ? 'Referrer reward (%)' : 'Referrer reward (₹)'}
            keyboardType="decimal-pad"
            value={form.referrer_reward_value}
            onChangeText={(v) => set('referrer_reward_value', v)}
            error={errors.referrer_reward_value}
          />

          <View style={isMilestone ? st.disabledGroup : undefined} pointerEvents={isMilestone ? 'none' : 'auto'}>
            <CmsSelect
              colors={colors}
              label={isMilestone ? 'Referee reward type (n/a for milestone)' : 'Referee reward type'}
              placeholder="Select type"
              value={form.referee_reward_type}
              options={REWARD_TYPE_OPTIONS}
              onSelect={(v) => set('referee_reward_type', String(v))}
            />
            <CmsInput
              colors={colors}
              label={form.referee_reward_type === 'PERCENT' ? 'Referee reward (%)' : 'Referee reward (₹)'}
              keyboardType="decimal-pad"
              value={isMilestone ? '0' : form.referee_reward_value}
              onChangeText={(v) => set('referee_reward_value', v)}
              error={errors.referee_reward_value}
            />
          </View>

          {showTiers ? (
            <CmsInput
              colors={colors}
              label='Tiers JSON (used only when reward type is "Tiered")'
              placeholder={'[{"min":0,"max":999,"amount":50}]'}
              value={form.tiers_json}
              onChangeText={(v) => set('tiers_json', v)}
              error={errors.tiers_json}
              multiline
              numberOfLines={6}
            />
          ) : null}
        </CmsCard>

        <CmsCard colors={colors} title="Constraints">
          <CmsInput colors={colors} label="Min order amount (₹)" keyboardType="decimal-pad" value={form.min_order_amount} onChangeText={(v) => set('min_order_amount', v)} />
          <CmsInput
            colors={colors}
            label="Max bonus per referrer (₹)"
            keyboardType="decimal-pad"
            value={form.max_bonus_per_referrer}
            onChangeText={(v) => set('max_bonus_per_referrer', v)}
            error={errors.max_bonus_per_referrer}
          />
          <CmsInput colors={colors} label="Max referrals per user" keyboardType="number-pad" value={form.max_referrals_per_user} onChangeText={(v) => set('max_referrals_per_user', v)} />
          <CmsInput colors={colors} label="Pending expiry (days)" keyboardType="number-pad" value={form.pending_expiry_days} onChangeText={(v) => set('pending_expiry_days', v)} />
          <CmsInput colors={colors} label="Priority" keyboardType="number-pad" value={form.priority} onChangeText={(v) => set('priority', v)} />
          <CmsSwitch
            colors={colors}
            label="Clawback on refund"
            value={form.clawback_on_refund}
            onChange={(v) => set('clawback_on_refund', v)}
          />
        </CmsCard>

        <CmsCard colors={colors} title="Validity window (optional)">
          <CmsInput
            colors={colors}
            label="Valid from (YYYY-MM-DDTHH:mm)"
            placeholder="2026-01-01T00:00"
            value={form.valid_from}
            onChangeText={(v) => set('valid_from', v)}
          />
          <CmsInput
            colors={colors}
            label="Valid to (YYYY-MM-DDTHH:mm)"
            placeholder="2026-12-31T23:59"
            value={form.valid_to}
            onChangeText={(v) => set('valid_to', v)}
          />
        </CmsCard>

        <CmsCard colors={colors} title="Activation">
          <CmsSwitch
            colors={colors}
            label="Active — eligible to fire payouts when triggers occur"
            value={form.is_active}
            onChange={(v) => set('is_active', v)}
          />
        </CmsCard>

        <CmsButton colors={colors} label={isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create rule'} onPress={handleSubmit} loading={isSubmitting} />
      </BottomSheetScrollView>
    </CmsModal>
  );
});

const st = StyleSheet.create({
  helpText: { ...cmsType.listMeta, lineHeight: 17 },
  disabledGroup: { opacity: 0.5, gap: 10 },
});
