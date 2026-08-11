import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { StyleSheet } from 'react-native';

import type {
  InventoryLocation,
  InventoryLocationPayload,
} from '@/api/inventory';
import {
  useCreateInventoryLocation,
  useUpdateInventoryLocation,
} from '@/api/inventory';

import {
  CmsButton,
  CmsCard,
  CmsInput,
  CmsModal,
  CmsSheetScrollView,
  CmsSwitch,
} from '../../components';
import type { CmsThemeColors } from '../../theme';

type FormState = {
  name: string;
  address: string;
  code: string;
  pincode: string;
  longitude: string;
  latitude: string;
  delivery_distance: string;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  address: '',
  code: '',
  pincode: '',
  longitude: '',
  latitude: '',
  delivery_distance: '',
  is_active: true,
};

function formFromLocation(location: InventoryLocation): FormState {
  return {
    name: location.name,
    address: location.address,
    code: location.code,
    pincode: location.pincode,
    longitude: location.longitude ?? '',
    latitude: location.latitude ?? '',
    delivery_distance:
      location.delivery_distance != null
        ? String(location.delivery_distance)
        : '',
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
      setForm(
        selectedLocation ? formFromLocation(selectedLocation) : EMPTY_FORM
      );
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
      if (!form.delivery_distance.trim())
        next.delivery_distance = 'Deliverable distance is required';
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
        longitude: form.longitude.trim(),
        latitude: form.latitude.trim(),
        delivery_distance: form.delivery_distance.trim()
          ? parseInt(form.delivery_distance, 10)
          : 0,
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
      <CmsModal
        ref={ref}
        colors={colors}
        snapPoints={['70%']}
        title={isEdit ? 'Edit Inventory Location' : 'Add Inventory Location'}
        footer={
          <CmsButton
            colors={colors}
            label={isEdit ? 'Save Changes' : 'Add Location'}
            onPress={handleSubmit}
            loading={isSubmitting}
          />
        }
      >
        <CmsSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={st.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <CmsCard colors={colors} title="Location Details">
            <CmsInput
              colors={colors}
              label="Inventory Name"
              value={form.name}
              onChangeText={(v) => set('name', v)}
              error={errors.name}
              required
            />
            <CmsInput
              colors={colors}
              label="Address"
              value={form.address}
              onChangeText={(v) => set('address', v)}
              error={errors.address}
              required
            />
            <CmsInput
              colors={colors}
              label="Code"
              value={form.code}
              onChangeText={(v) => set('code', v)}
              keyboardType="number-pad"
              error={errors.code}
              required
            />
            <CmsInput
              colors={colors}
              label="Pincode"
              value={form.pincode}
              onChangeText={(v) => set('pincode', v)}
              keyboardType="number-pad"
              error={errors.pincode}
              required
            />
            <CmsInput
              colors={colors}
              label="Deliverable Distance (in meters)"
              value={form.delivery_distance}
              onChangeText={(v) => set('delivery_distance', v)}
              keyboardType="number-pad"
              error={errors.delivery_distance}
              required
            />
            <CmsInput
              colors={colors}
              label="Longitude"
              value={form.longitude}
              onChangeText={(v) => set('longitude', v)}
              keyboardType="numbers-and-punctuation"
            />
            <CmsInput
              colors={colors}
              label="Latitude"
              value={form.latitude}
              onChangeText={(v) => set('latitude', v)}
              keyboardType="numbers-and-punctuation"
            />
            <CmsSwitch
              colors={colors}
              label="Active"
              value={form.is_active}
              onChange={(v) => set('is_active', v)}
            />
          </CmsCard>
        </CmsSheetScrollView>
      </CmsModal>
    );
  }
);

const st = StyleSheet.create({
  scroll: {
    padding: 16,
    gap: 12,
    paddingBottom: 16,
  },
});
