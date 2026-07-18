import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';

import type { Commission, VendorListItem } from '@/api/vendors';
import { useCreateCommission, useUpdateCommission } from '@/api/vendors';

import { CmsButton, CmsCard, CmsInput, CmsModal, CmsSelect, CmsSwitch } from '../../components';
import type { CmsThemeColors } from '../../theme';

const COMMISSION_TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount' },
];

type FormState = {
  commission_type: 'percentage' | 'fixed';
  value: string;
  min_order_value: string;
  max_commission: string;
  is_active: boolean;
  priority: string;
  valid_from: string;
  valid_to: string;
};

function getDefaultForm(): FormState {
  return {
    commission_type: 'percentage',
    value: '',
    min_order_value: '',
    max_commission: '',
    is_active: true,
    priority: '0',
    valid_from: '',
    valid_to: '',
  };
}

type Props = {
  colors: CmsThemeColors;
  vendor: VendorListItem | null;
  commission: Commission | null;
  openKey: number;
  onDone: () => void;
};

export const ManageCommissionModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, vendor, commission, openKey, onDone }, ref) => {
    const isEdit = commission !== null;
    const [form, setForm] = React.useState<FormState>(getDefaultForm());
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    const createCommission = useCreateCommission();
    const updateCommission = useUpdateCommission();
    const isSubmitting = createCommission.isPending || updateCommission.isPending;

    React.useEffect(() => {
      setErrors({});
      if (isEdit && commission) {
        setForm({
          commission_type: (commission.commission_type as 'percentage' | 'fixed') || 'percentage',
          value: String(commission.value ?? ''),
          min_order_value: commission.min_order_value !== undefined ? String(commission.min_order_value) : '',
          max_commission: commission.max_commission !== undefined ? String(commission.max_commission) : '',
          is_active: commission.is_active !== false,
          priority: String(commission.priority ?? 0),
          valid_from: commission.valid_from ? commission.valid_from.slice(0, 16) : '',
          valid_to: commission.valid_to ? commission.valid_to.slice(0, 16) : '',
        });
      } else {
        setForm(getDefaultForm());
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openKey, isEdit, commission]);

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }

    function validate(): boolean {
      const errs: Record<string, string> = {};
      const value = parseFloat(form.value);
      if (!form.value || value <= 0) errs.value = 'Commission value must be greater than 0';
      if (form.commission_type === 'percentage' && value > 100) errs.value = 'Percentage cannot exceed 100';
      if (form.min_order_value && parseFloat(form.min_order_value) < 0) {
        errs.min_order_value = 'Minimum order value cannot be negative';
      }
      if (form.max_commission && parseFloat(form.max_commission) < 0) {
        errs.max_commission = 'Maximum commission cannot be negative';
      }
      if (form.valid_from && form.valid_to && new Date(form.valid_from) >= new Date(form.valid_to)) {
        errs.valid_to = 'End date must be after start date';
      }
      setErrors(errs);
      return Object.keys(errs).length === 0;
    }

    function handleSubmit() {
      if (!vendor || !validate()) return;

      const payload = {
        commission_type: form.commission_type,
        value: form.value,
        min_order_value: form.min_order_value || undefined,
        max_commission: form.max_commission || undefined,
        is_active: form.is_active,
        priority: Number(form.priority || 0),
        ...(form.valid_from ? { valid_from: form.valid_from } : {}),
        ...(form.valid_to ? { valid_to: form.valid_to } : {}),
        apply_on: 'vendor' as const,
        vendor: vendor.id,
      };

      if (isEdit && commission) {
        updateCommission.mutate({ id: commission.id, payload }, { onSuccess: () => onDone() });
      } else {
        createCommission.mutate(payload, { onSuccess: () => onDone() });
      }
    }

    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['85%']} title={isEdit ? 'Edit Commission' : 'Add Commission'}>
        <BottomSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <CmsCard colors={colors}>
            <CmsSelect
              colors={colors}
              label="Commission Type"
              placeholder="Select type"
              value={form.commission_type}
              options={COMMISSION_TYPE_OPTIONS}
              onSelect={(v) => set('commission_type', v as 'percentage' | 'fixed')}
            />
            <CmsInput
              colors={colors}
              label={`Commission Value ${form.commission_type === 'percentage' ? '(%)' : ''}`}
              placeholder={form.commission_type === 'percentage' ? 'e.g., 10' : 'e.g., 50.00'}
              keyboardType="decimal-pad"
              value={form.value}
              onChangeText={(v) => set('value', v)}
              error={errors.value}
            />
            <CmsInput
              colors={colors}
              label="Minimum Order Value (Optional)"
              placeholder="e.g., 100.00"
              keyboardType="decimal-pad"
              value={form.min_order_value}
              onChangeText={(v) => set('min_order_value', v)}
              error={errors.min_order_value}
            />
            <CmsInput
              colors={colors}
              label="Maximum Commission (Optional)"
              placeholder="e.g., 500.00"
              keyboardType="decimal-pad"
              value={form.max_commission}
              onChangeText={(v) => set('max_commission', v)}
              error={errors.max_commission}
            />
            <CmsInput
              colors={colors}
              label="Priority"
              placeholder="e.g., 0"
              keyboardType="number-pad"
              value={form.priority}
              onChangeText={(v) => set('priority', v)}
            />
            <CmsSwitch colors={colors} label="Active" value={form.is_active} onChange={(v) => set('is_active', v)} />
            <CmsInput
              colors={colors}
              label="Valid From (Optional, YYYY-MM-DDTHH:mm)"
              value={form.valid_from}
              onChangeText={(v) => set('valid_from', v)}
            />
            <CmsInput
              colors={colors}
              label="Valid To (Optional, YYYY-MM-DDTHH:mm)"
              value={form.valid_to}
              onChangeText={(v) => set('valid_to', v)}
              error={errors.valid_to}
            />
          </CmsCard>

          <CmsButton
            colors={colors}
            label={isSubmitting ? 'Saving…' : isEdit ? 'Update Commission' : 'Add Commission'}
            onPress={handleSubmit}
            loading={isSubmitting}
          />
        </BottomSheetScrollView>
      </CmsModal>
    );
  }
);
