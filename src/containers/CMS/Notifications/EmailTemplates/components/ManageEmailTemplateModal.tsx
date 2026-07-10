import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { EmailTemplate, EmailTemplatePayload } from '@/api/notifications';
import { useCreateEmailTemplate, useSystemVariables, useCustomVariables, useUpdateEmailTemplate } from '@/api/notifications';

import { CmsButton, CmsCard, CmsInput, CmsModal, CmsVariableInput } from '../../../components';
import type { CmsThemeColors } from '../../../theme';
import { cmsType } from '../../../theme/cms-typography';

// `react-native-webview` doesn't ship a web implementation, so the live HTML
// preview only renders on native — web shows the raw source instead of
// crashing. The editor itself (name/subject/body + variable autocomplete)
// works everywhere.
let WebView: React.ComponentType<{ source: { html: string }; style?: object }> | null = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  WebView = require('react-native-webview').WebView;
}

type FormState = { name: string; subject: string; html_body: string };
const EMPTY_FORM: FormState = { name: '', subject: '', html_body: '' };

function formFromTemplate(t: EmailTemplate): FormState {
  return { name: t.name, subject: t.subject, html_body: t.html_body };
}

type Props = {
  colors: CmsThemeColors;
  selectedTemplate: EmailTemplate | null;
  onSuccess: () => void;
};

export const ManageEmailTemplateModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, selectedTemplate, onSuccess }, ref) => {
    const isEdit = Boolean(selectedTemplate);
    const isReadOnly = selectedTemplate?.tenant === null;
    const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [mode, setMode] = React.useState<'edit' | 'preview'>('edit');

    React.useEffect(() => {
      setForm(selectedTemplate ? formFromTemplate(selectedTemplate) : EMPTY_FORM);
      setErrors({});
      setMode('edit');
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

    const createTemplate = useCreateEmailTemplate();
    const updateTemplate = useUpdateEmailTemplate();
    const isSubmitting = createTemplate.isPending || updateTemplate.isPending;

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }

    function validate() {
      const next: Record<string, string> = {};
      if (!form.name.trim()) next.name = 'Name is required';
      if (!form.subject.trim()) next.subject = 'Subject is required';
      if (!form.html_body.trim()) next.html_body = 'Body is required';
      setErrors(next);
      return Object.keys(next).length === 0;
    }

    function handleSubmit() {
      if (!validate()) return;
      const payload: EmailTemplatePayload = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        html_body: form.html_body,
      };
      if (isEdit && selectedTemplate) {
        updateTemplate.mutate({ id: selectedTemplate.id, payload }, { onSuccess: () => onSuccess() });
      } else {
        createTemplate.mutate(payload, { onSuccess: () => onSuccess() });
      }
    }

    const title = isReadOnly ? 'View Email Template' : isEdit ? 'Edit Email Template' : 'Add Email Template';

    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['90%']} title={title}>
        <View style={[st.modeRow, { borderColor: colors.border }]}>
          {(['edit', 'preview'] as const).map((m) => {
            const active = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[st.modeTab, active && { backgroundColor: colors.accent }]}
              >
                <Text style={[st.modeTabLabel, { color: active ? colors.accentText : colors.textSecondary }]}>
                  {m === 'edit' ? 'Edit' : 'Preview'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {mode === 'edit' ? (
          <BottomSheetScrollView
            style={{ backgroundColor: colors.background }}
            contentContainerStyle={st.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <CmsCard colors={colors} title="Template">
              <CmsInput colors={colors} label="Name" value={form.name} onChangeText={(v) => set('name', v)} error={errors.name} editable={!isReadOnly} />
              <CmsInput colors={colors} label="Subject" value={form.subject} onChangeText={(v) => set('subject', v)} error={errors.subject} editable={!isReadOnly} />
            </CmsCard>

            <CmsCard colors={colors} title="HTML Body">
              <CmsVariableInput
                colors={colors}
                value={form.html_body}
                onChangeText={(v) => set('html_body', v)}
                variables={variableOptions}
                numberOfLines={12}
                placeholder="<p>Hi {{customer_first_name}}, ...</p>"
                error={errors.html_body}
                editable={!isReadOnly}
              />
            </CmsCard>

            {!isReadOnly && (
              <CmsButton
                colors={colors}
                label={isEdit ? 'Save Changes' : 'Add Template'}
                onPress={handleSubmit}
                loading={isSubmitting}
                style={st.submitBtn}
              />
            )}
          </BottomSheetScrollView>
        ) : (
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {WebView ? (
              <WebView source={{ html: form.html_body || '<p style="color:#999">Nothing to preview yet.</p>' }} style={{ flex: 1 }} />
            ) : (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
                  Live preview renders on the mobile app — showing raw source here.
                </Text>
                <Text style={{ color: colors.textPrimary, fontFamily: 'monospace', fontSize: 12 }}>
                  {form.html_body || 'Nothing to preview yet.'}
                </Text>
              </ScrollView>
            )}
          </View>
        )}
      </CmsModal>
    );
  }
);

const st = StyleSheet.create({
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  modeRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  modeTab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  modeTabLabel: cmsType.buttonLabel,
  submitBtn: { marginTop: 4 },
});
