import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CustomVariable, CustomVariablePayload, VariableSource } from '@/api/notifications';
import { useCreateCustomVariable, useUpdateCustomVariable } from '@/api/notifications';

import { CmsButton, CmsCard, CmsInput, CmsModal, CmsSwitch } from '../../../components';
import type { CmsThemeColors } from '../../../theme';
import { cmsType } from '../../../theme/cms-typography';

type FormState = {
  name: string;
  label: string;
  description: string;
  source: VariableSource;
  static_value: string;
  attribute_path: string;
  default_value: string;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  label: '',
  description: '',
  source: 'STATIC',
  static_value: '',
  attribute_path: '',
  default_value: '',
  is_active: true,
};

function formFromVariable(v: CustomVariable): FormState {
  return {
    name: v.name,
    label: v.label,
    description: v.description,
    source: v.source,
    static_value: v.static_value ?? '',
    attribute_path: v.attribute_path ?? '',
    default_value: v.default_value ?? '',
    is_active: v.is_active,
  };
}

type Props = {
  colors: CmsThemeColors;
  selectedVariable: CustomVariable | null;
  onSuccess: () => void;
};

export const ManageVariableModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, selectedVariable, onSuccess }, ref) => {
    const isEdit = Boolean(selectedVariable);
    const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
      setForm(selectedVariable ? formFromVariable(selectedVariable) : EMPTY_FORM);
      setErrors({});
    }, [selectedVariable]);

    const createVariable = useCreateCustomVariable();
    const updateVariable = useUpdateCustomVariable();
    const isSubmitting = createVariable.isPending || updateVariable.isPending;

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }

    function validate() {
      const next: Record<string, string> = {};
      if (!form.name.trim()) next.name = 'Name is required';
      if (!form.label.trim()) next.label = 'Label is required';
      if (form.source === 'STATIC' && !form.static_value.trim()) next.static_value = 'Static value is required';
      if (form.source === 'ATTRIBUTE' && !form.attribute_path.trim()) next.attribute_path = 'Attribute path is required';
      setErrors(next);
      return Object.keys(next).length === 0;
    }

    function handleSubmit() {
      if (!validate()) return;
      const payload: CustomVariablePayload = {
        name: form.name.trim(),
        label: form.label.trim(),
        description: form.description.trim(),
        source: form.source,
        static_value: form.source === 'STATIC' ? form.static_value.trim() : null,
        attribute_path: form.source === 'ATTRIBUTE' ? form.attribute_path.trim() : null,
        default_value: form.default_value.trim() || null,
        is_active: form.is_active,
      };
      if (isEdit && selectedVariable) {
        updateVariable.mutate({ id: selectedVariable.id, payload }, { onSuccess: () => onSuccess() });
      } else {
        createVariable.mutate(payload, { onSuccess: () => onSuccess() });
      }
    }

    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['75%']} title={isEdit ? 'Edit Variable' : 'Add Variable'}>
        <BottomSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={st.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <CmsCard colors={colors} title="Variable Details">
            <CmsInput colors={colors} label="Name" placeholder="e.g. customer_first_name" value={form.name} onChangeText={(v) => set('name', v)} autoCapitalize="none" error={errors.name} />
            <CmsInput colors={colors} label="Label" placeholder="e.g. Customer First Name" value={form.label} onChangeText={(v) => set('label', v)} error={errors.label} />
            <CmsInput colors={colors} label="Description" value={form.description} onChangeText={(v) => set('description', v)} multiline />
          </CmsCard>

          <CmsCard colors={colors} title="Source">
            <View style={st.sourceRow}>
              {(['STATIC', 'ATTRIBUTE'] as VariableSource[]).map((source) => {
                const active = form.source === source;
                return (
                  <Pressable
                    key={source}
                    onPress={() => set('source', source)}
                    style={[
                      st.sourceOption,
                      { borderColor: colors.border },
                      active && { backgroundColor: colors.accent, borderColor: colors.accent },
                    ]}
                  >
                    <Text style={[st.sourceOptionLabel, { color: active ? colors.accentText : colors.textPrimary }]}>
                      {source === 'STATIC' ? 'Static Value' : 'Profile Attribute'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {form.source === 'STATIC' ? (
              <CmsInput colors={colors} label="Static Value" value={form.static_value} onChangeText={(v) => set('static_value', v)} error={errors.static_value} />
            ) : (
              <CmsInput colors={colors} label="Attribute Path" placeholder="e.g. profile.first_name" value={form.attribute_path} onChangeText={(v) => set('attribute_path', v)} autoCapitalize="none" error={errors.attribute_path} />
            )}
            <CmsInput colors={colors} label="Default Value (if empty)" value={form.default_value} onChangeText={(v) => set('default_value', v)} />
          </CmsCard>

          <CmsSwitch colors={colors} label="Active" value={form.is_active} onChange={(v) => set('is_active', v)} />

          <CmsButton
            colors={colors}
            label={isEdit ? 'Save Changes' : 'Add Variable'}
            onPress={handleSubmit}
            loading={isSubmitting}
            style={st.submitBtn}
          />
        </BottomSheetScrollView>
      </CmsModal>
    );
  }
);

const st = StyleSheet.create({
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  sourceRow: { flexDirection: 'row', gap: 8 },
  sourceOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sourceOptionLabel: cmsType.buttonLabel,
  submitBtn: { marginTop: 4 },
});
