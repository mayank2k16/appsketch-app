import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';

import type { SmsTemplate, SmsTemplatePayload } from '@/api/notifications';
import { useCreateSMSTemplate, useCustomVariables, useSystemVariables, useUpdateSMSTemplate } from '@/api/notifications';

import { CmsButton, CmsCard, CmsInput, CmsModal, CmsVariableInput } from '../../../components';
import type { CmsThemeColors } from '../../../theme';

type FormState = { title: string; body: string; provider_template_id: string };
const EMPTY_FORM: FormState = { title: '', body: '', provider_template_id: '' };

function formFromTemplate(t: SmsTemplate): FormState {
  return { title: t.title, body: t.body, provider_template_id: t.provider_template_id ?? '' };
}

type Props = {
  colors: CmsThemeColors;
  selectedTemplate: SmsTemplate | null;
  onSuccess: () => void;
};

export const ManageSmsTemplateModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, selectedTemplate, onSuccess }, ref) => {
    const isEdit = Boolean(selectedTemplate);
    const isReadOnly = selectedTemplate?.tenant === null;
    const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
      setForm(selectedTemplate ? formFromTemplate(selectedTemplate) : EMPTY_FORM);
      setErrors({});
    }, [selectedTemplate]);

    const systemVariables = useSystemVariables();
    const customVariables = useCustomVariables();
    const variableOptions = React.useMemo(
      () => [
        ...(systemVariables.data ?? []).map((v) => ({ name: v.name, label: v.label })),
        ...(customVariables.data ?? []).map((v) => ({ name: v.name, label: v.label })),
      ],
      [systemVariables.data, customVariables.data]
    );

    const createTemplate = useCreateSMSTemplate();
    const updateTemplate = useUpdateSMSTemplate();
    const isSubmitting = createTemplate.isPending || updateTemplate.isPending;

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }

    function validate() {
      const next: Record<string, string> = {};
      if (!form.title.trim()) next.title = 'Title is required';
      if (!form.body.trim()) next.body = 'Body is required';
      setErrors(next);
      return Object.keys(next).length === 0;
    }

    function handleSubmit() {
      if (!validate()) return;
      const payload: SmsTemplatePayload = {
        title: form.title.trim(),
        body: form.body,
        provider_template_id: form.provider_template_id.trim() || null,
      };
      if (isEdit && selectedTemplate) {
        updateTemplate.mutate({ id: selectedTemplate.id, payload }, { onSuccess: () => onSuccess() });
      } else {
        createTemplate.mutate(payload, { onSuccess: () => onSuccess() });
      }
    }

    const title = isReadOnly ? 'View SMS Template' : isEdit ? 'Edit SMS Template' : 'Add SMS Template';

    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['70%']} title={title}>
        <BottomSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <CmsCard colors={colors} title="Template">
            <CmsInput colors={colors} label="Title" value={form.title} onChangeText={(v) => set('title', v)} error={errors.title} editable={!isReadOnly} />
            <CmsVariableInput
              colors={colors}
              label="Body"
              value={form.body}
              onChangeText={(v) => set('body', v)}
              variables={variableOptions}
              numberOfLines={5}
              placeholder="Hi {{customer_first_name}}, your order is on its way!"
              error={errors.body}
              editable={!isReadOnly}
            />
            <CmsInput
              colors={colors}
              label="Provider Template ID (optional)"
              value={form.provider_template_id}
              onChangeText={(v) => set('provider_template_id', v)}
              editable={!isReadOnly}
            />
          </CmsCard>

          {!isReadOnly && (
            <CmsButton
              colors={colors}
              label={isEdit ? 'Save Changes' : 'Add Template'}
              onPress={handleSubmit}
              loading={isSubmitting}
              style={{ marginTop: 4 }}
            />
          )}
        </BottomSheetScrollView>
      </CmsModal>
    );
  }
);
