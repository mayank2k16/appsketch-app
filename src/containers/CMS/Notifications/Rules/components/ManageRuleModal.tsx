import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';

import type { NotificationChannel, NotificationRule, NotificationRulePayload } from '@/api/notifications';
import {
  useEmailTemplates,
  useNotificationEvents,
  useSMSTemplates,
  useSystemVariables,
  useCustomVariables,
  useUpsertNotificationRule,
} from '@/api/notifications';

import { CmsButton, CmsCard, CmsModal, CmsSelect, CmsSwitch, CmsVariableInput } from '../../../components';
import type { CmsThemeColors } from '../../../theme';

// Rules only route to EMAIL/SMS/FCM — the rule payload has no whatsapp slot.
const RULE_CHANNELS: NotificationChannel[] = ['EMAIL', 'SMS', 'FCM'];

type FormState = {
  event_code: string;
  channel: NotificationChannel | '';
  email_template: number | '';
  sms_template: number | '';
  fcm_title_template: string;
  fcm_body_template: string;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  event_code: '',
  channel: '',
  email_template: '',
  sms_template: '',
  fcm_title_template: '',
  fcm_body_template: '',
  is_active: true,
};

function formFromRule(r: NotificationRule): FormState {
  return {
    event_code: r.event_code,
    channel: r.channel,
    email_template: r.email_template ?? '',
    sms_template: r.sms_template ?? '',
    fcm_title_template: r.fcm_title_template ?? '',
    fcm_body_template: r.fcm_body_template ?? '',
    is_active: r.is_active,
  };
}

type Props = {
  colors: CmsThemeColors;
  selectedRule: NotificationRule | null;
  onSuccess: () => void;
};

export const ManageRuleModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, selectedRule, onSuccess }, ref) => {
    const isEdit = Boolean(selectedRule);
    const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
      setForm(selectedRule ? formFromRule(selectedRule) : EMPTY_FORM);
      setErrors({});
    }, [selectedRule]);

    const eventsQuery = useNotificationEvents();
    const emailTemplatesQuery = useEmailTemplates();
    const smsTemplatesQuery = useSMSTemplates();
    const systemVariables = useSystemVariables();
    const customVariables = useCustomVariables();
    const variableOptions = React.useMemo(
      () => [
        ...(systemVariables.data ?? []).map((v) => ({ name: v.name, label: v.label })),
        ...(customVariables.data ?? []).map((v) => ({ name: v.name, label: v.label })),
      ],
      [systemVariables.data, customVariables.data]
    );

    const events = eventsQuery.data ?? [];
    const selectedEvent = events.find((e) => e.code === form.event_code);
    const channelOptions = React.useMemo(() => {
      const allowed = selectedEvent?.allowed_channels ?? RULE_CHANNELS;
      return RULE_CHANNELS.filter((c) => allowed.includes(c)).map((c) => ({ value: c, label: c }));
    }, [selectedEvent]);

    const upsertRule = useUpsertNotificationRule();

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }

    function validate() {
      const next: Record<string, string> = {};
      if (!form.event_code) next.event_code = 'Event is required';
      if (!form.channel) next.channel = 'Channel is required';
      if (form.channel === 'EMAIL' && !form.email_template) next.email_template = 'Email template is required';
      if (form.channel === 'SMS' && !form.sms_template) next.sms_template = 'SMS template is required';
      if (form.channel === 'FCM' && !form.fcm_title_template.trim()) next.fcm_title_template = 'Title is required';
      setErrors(next);
      return Object.keys(next).length === 0;
    }

    function handleSubmit() {
      if (!validate()) return;
      const payload: NotificationRulePayload = {
        ...(isEdit && selectedRule ? { id: selectedRule.id } : {}),
        event: form.event_code,
        channel: form.channel as NotificationChannel,
        email_template: form.channel === 'EMAIL' ? (form.email_template as number) : null,
        sms_template: form.channel === 'SMS' ? (form.sms_template as number) : null,
        fcm_title_template: form.channel === 'FCM' ? form.fcm_title_template.trim() : null,
        fcm_body_template: form.channel === 'FCM' ? form.fcm_body_template.trim() : null,
        is_active: form.is_active,
      };
      upsertRule.mutate(payload, { onSuccess: () => onSuccess() });
    }

    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['85%']} title={isEdit ? 'Edit Rule' : 'Add Rule'}>
        <BottomSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <CmsCard colors={colors} title="Trigger">
            <CmsSelect
              colors={colors}
              label="Event"
              placeholder="Select event"
              value={form.event_code || undefined}
              options={events.map((e) => ({ value: e.code, label: e.name }))}
              onSelect={(v) => {
                set('event_code', String(v));
                set('channel', '');
              }}
              error={errors.event_code}
            />
            <CmsSelect
              colors={colors}
              label="Channel"
              placeholder="Select channel"
              value={form.channel || undefined}
              options={channelOptions}
              onSelect={(v) => set('channel', v as NotificationChannel)}
              error={errors.channel}
            />
          </CmsCard>

          {form.channel === 'EMAIL' && (
            <CmsCard colors={colors} title="Email Content">
              <CmsSelect
                colors={colors}
                label="Email Template"
                placeholder="Select template"
                value={form.email_template || undefined}
                options={(emailTemplatesQuery.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
                onSelect={(v) => set('email_template', v as number)}
                error={errors.email_template}
              />
            </CmsCard>
          )}

          {form.channel === 'SMS' && (
            <CmsCard colors={colors} title="SMS Content">
              <CmsSelect
                colors={colors}
                label="SMS Template"
                placeholder="Select template"
                value={form.sms_template || undefined}
                options={(smsTemplatesQuery.data ?? []).map((t) => ({ value: t.id, label: t.title }))}
                onSelect={(v) => set('sms_template', v as number)}
                error={errors.sms_template}
              />
            </CmsCard>
          )}

          {form.channel === 'FCM' && (
            <CmsCard colors={colors} title="Push Content">
              <CmsVariableInput
                colors={colors}
                label="Title"
                value={form.fcm_title_template}
                onChangeText={(v) => set('fcm_title_template', v)}
                variables={variableOptions}
                numberOfLines={1}
                error={errors.fcm_title_template}
              />
              <CmsVariableInput
                colors={colors}
                label="Body"
                value={form.fcm_body_template}
                onChangeText={(v) => set('fcm_body_template', v)}
                variables={variableOptions}
                numberOfLines={3}
              />
            </CmsCard>
          )}

          <CmsSwitch colors={colors} label="Active" value={form.is_active} onChange={(v) => set('is_active', v)} />

          <CmsButton
            colors={colors}
            label={isEdit ? 'Save Changes' : 'Add Rule'}
            onPress={handleSubmit}
            loading={upsertRule.isPending}
            style={{ marginTop: 4 }}
          />
        </BottomSheetScrollView>
      </CmsModal>
    );
  }
);
