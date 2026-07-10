import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { StyleSheet } from 'react-native';

import type { InventoryLocation, InventoryLocationPayload } from '@/api/inventory';
import { useCreateInventoryLocation, useUpdateInventoryLocation } from '@/api/inventory';

import { CmsButton, CmsCard, CmsInput, CmsModal, CmsSwitch } from '../../components';
import type { CmsThemeColors } from '../../theme';

type FormState = {
  name: string;
  address: string;
  code: string;
  pincode: string;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  address: '',
  code: '',
  pincode: '',
  is_active: true,
};

function formFromLocation(location: InventoryLocation): FormState {
  return {
    name: location.name,
    address: location.address,
    code: location.code,
    pincode: location.pincode,
    is_active: location.is_active,
  };
}

type Props = {
  colors: CmsThemeColors;
  selectedLocation: InventoryLocation | null;
  onSuccess: () => void;
};

export const ManageInventoryModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, selectedLocation, onSuccess }, ref) => {
    const isEdit = Boolean(selectedLocation);
    const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
      setForm(selectedLocation ? formFromLocation(selectedLocation) : EMPTY_FORM);
      setErrors({});
    }, [selectedLocation]);

    const createLocation = useCreateInventoryLocation();
    const updateLocation = useUpdateInventoryLocation();
    const isSubmitting = createLocation.isPending || updateLocation.isPending;

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }

    function validate() {
      const next: Record<string, string> = {};
      if (!form.name.trim()) next.name = 'Name is required';
      if (!form.address.trim()) next.address = 'Address is required';
      if (!form.code.trim()) next.code = 'Code is required';
      if (!form.pincode.trim()) next.pincode = 'Pincode is required';
      setErrors(next);
      return Object.keys(next).length === 0;
    }

    function handleSubmit() {
      if (!validate()) return;
      const payload: InventoryLocationPayload = {
        name: form.name.trim(),
        address: form.address.trim(),
        code: form.code.trim(),
        pincode: form.pincode.trim(),
        is_active: form.is_active,
      };
      if (isEdit && selectedLocation) {
        updateLocation.mutate(
          { id: selectedLocation.id, payload },
          { onSuccess: () => onSuccess() }
        );
      } else {
        createLocation.mutate(payload, { onSuccess: () => onSuccess() });
      }
    }

    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['60%']} title={isEdit ? 'Edit Inventory Location' : 'Add Inventory Location'}>
        <BottomSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={st.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <CmsCard colors={colors} title="Location Details">
            <CmsInput colors={colors} label="Inventory Name" value={form.name} onChangeText={(v) => set('name', v)} error={errors.name} />
            <CmsInput colors={colors} label="Address" value={form.address} onChangeText={(v) => set('address', v)} error={errors.address} />
            <CmsInput
              colors={colors}
              label="Code"
              value={form.code}
              onChangeText={(v) => set('code', v)}
              keyboardType="number-pad"
              error={errors.code}
            />
            <CmsInput
              colors={colors}
              label="Pincode"
              value={form.pincode}
              onChangeText={(v) => set('pincode', v)}
              keyboardType="number-pad"
              error={errors.pincode}
            />
            <CmsSwitch colors={colors} label="Active" value={form.is_active} onChange={(v) => set('is_active', v)} />
          </CmsCard>

          <CmsButton
            colors={colors}
            label={isEdit ? 'Save Changes' : 'Add Location'}
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
  scroll: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  submitBtn: { marginTop: 4 },
});
