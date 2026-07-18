import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';

import type { AppUserProfile, StaffUser } from '@/api/users';
import {
  useCreateAppUser,
  useCreateStaffUser,
  useUpdateAppUser,
  useUpdateStaffUser,
  useUserInventories,
  useUsersMeta,
} from '@/api/users';
import { toast } from '@/lib/toast';

import { CmsButton, CmsCard, CmsInput, CmsSelect, CmsSwitch, CmsModal } from '../../components';
import type { CmsThemeColors } from '../../theme';
import type { UserSegment } from '../utils';
import { GroupsPermissionsMultiSelect } from './GroupsPermissionsMultiSelect';

type FormState = {
  name: string;
  phone_number: string;
  email: string;
  username: string;
  role: string;
  inventory: string;
  password: string;
  groups: number[];
  user_permissions: number[];
  is_active: boolean;
  is_verified: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  phone_number: '',
  email: '',
  username: '',
  role: '',
  inventory: '',
  password: '',
  groups: [],
  user_permissions: [],
  is_active: true,
  is_verified: false,
};

type Props = {
  colors: CmsThemeColors;
  segment: UserSegment;
  user: AppUserProfile | StaffUser | null;
  openKey: number;
  onDone: () => void;
};

export const ManageUserModal = React.forwardRef<BottomSheetModal, Props>(({ colors, segment, user, openKey, onDone }, ref) => {
  const isEdit = user !== null;
  const isApp = segment === 'app';
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);

  const metaQuery = useUsersMeta();
  const inventoriesQuery = useUserInventories();

  const createAppUser = useCreateAppUser();
  const updateAppUser = useUpdateAppUser();
  const createStaffUser = useCreateStaffUser();
  const updateStaffUser = useUpdateStaffUser();
  const isSubmitting =
    createAppUser.isPending || updateAppUser.isPending || createStaffUser.isPending || updateStaffUser.isPending;

  React.useEffect(() => {
    if (isEdit && user) {
      const staffUser = user as StaffUser;
      const appUser = user as AppUserProfile;
      setForm({
        name: user.name || '',
        phone_number: user.phone_number || '',
        email: user.email || '',
        username: user.username || '',
        role: user.role || '',
        inventory: appUser.inventory != null ? String(appUser.inventory) : '',
        password: '',
        groups: staffUser.groups || [],
        user_permissions: staffUser.user_permissions || [],
        is_active: user.is_active !== false,
        is_verified: !!user.is_verified,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKey, isEdit, user]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const roleOptions = (metaQuery.data?.roles ?? []).map((r) => ({ value: r.value, label: r.label }));
  const inventoryOptions = (inventoriesQuery.data ?? []).map((i) => ({ value: String(i.id), label: i.name }));
  const groupItems = (metaQuery.data?.groups ?? []).map((g) => ({ id: g.id, label: g.name }));
  const permissionItems = (metaQuery.data?.permissions ?? []).map((p) => ({ id: p.id, label: p.codename }));

  function handleSubmit() {
    if (!form.name || !form.phone_number) {
      toast.error('Name and phone are required');
      return;
    }

    if (isApp) {
      const payload = {
        name: form.name,
        phone_number: form.phone_number,
        email: form.email || null,
        username: form.username || undefined,
        role: form.role || null,
        inventory: form.inventory || null,
        is_active: form.is_active,
        is_verified: form.is_verified,
      };
      if (isEdit && user) {
        updateAppUser.mutate({ id: user.id, payload }, { onSuccess: () => onDone() });
      } else {
        createAppUser.mutate(payload, { onSuccess: () => onDone() });
      }
    } else {
      const payload = {
        name: form.name,
        phone_number: form.phone_number,
        email: form.email || null,
        username: form.username || undefined,
        role: form.role || null,
        groups: form.groups,
        user_permissions: form.user_permissions,
        is_active: form.is_active,
        is_verified: form.is_verified,
        ...(form.password ? { password: form.password } : {}),
      };
      if (isEdit && user) {
        updateStaffUser.mutate({ id: user.id, payload }, { onSuccess: () => onDone() });
      } else {
        createStaffUser.mutate(payload, { onSuccess: () => onDone() });
      }
    }
  }

  return (
    <CmsModal
      ref={ref}
      colors={colors}
      snapPoints={['90%']}
      title={`${isEdit ? 'Edit' : 'Add'} ${isApp ? 'App User' : 'Staff'}`}
    >
      <BottomSheetScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <CmsCard colors={colors}>
          <CmsInput colors={colors} label="Name" value={form.name} onChangeText={(v) => set('name', v)} />
          <CmsInput colors={colors} label="Phone" keyboardType="phone-pad" value={form.phone_number} onChangeText={(v) => set('phone_number', v)} />
          <CmsInput colors={colors} label="Email" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(v) => set('email', v)} />
          <CmsInput
            colors={colors}
            label="Username"
            placeholder="Auto-generated if blank"
            autoCapitalize="none"
            value={form.username}
            onChangeText={(v) => set('username', v)}
          />
          <CmsSelect colors={colors} label="Role" placeholder="Select role" value={form.role} options={roleOptions} onSelect={(v) => set('role', String(v))} />

          {isApp ? (
            <CmsSelect
              colors={colors}
              label="Inventory / Store"
              placeholder="None"
              value={form.inventory}
              options={inventoryOptions}
              onSelect={(v) => set('inventory', String(v))}
            />
          ) : (
            <>
              <CmsInput
                colors={colors}
                label={isEdit ? 'New password (blank = keep)' : 'Password'}
                secureTextEntry
                value={form.password}
                onChangeText={(v) => set('password', v)}
              />
              <GroupsPermissionsMultiSelect colors={colors} label="Groups" items={groupItems} value={form.groups} onChange={(v) => set('groups', v)} />
              <GroupsPermissionsMultiSelect
                colors={colors}
                label="Permissions"
                items={permissionItems}
                value={form.user_permissions}
                onChange={(v) => set('user_permissions', v)}
              />
            </>
          )}

          <CmsSwitch colors={colors} label="Active" value={form.is_active} onChange={(v) => set('is_active', v)} />
          <CmsSwitch colors={colors} label="Verified" value={form.is_verified} onChange={(v) => set('is_verified', v)} />
        </CmsCard>

        <CmsButton
          colors={colors}
          label={isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create user'}
          onPress={handleSubmit}
          loading={isSubmitting}
        />
      </BottomSheetScrollView>
    </CmsModal>
  );
});
