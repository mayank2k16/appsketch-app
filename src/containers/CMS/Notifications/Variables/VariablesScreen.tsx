import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CustomVariable } from '@/api/notifications';
import { useCustomVariables, useDeleteCustomVariable, useSystemVariables } from '@/api/notifications';
import { ConfirmModal, useModal } from '@/components/ui';

import { CmsCard } from '../../components';
import { useCmsTheme } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { CustomVariableRow } from './components/CustomVariableRow';
import { ManageVariableModal } from './components/ManageVariableModal';
import { SystemVariableChip } from './components/SystemVariableChip';

export function VariablesScreen() {
  const { colors } = useCmsTheme();
  const systemQuery = useSystemVariables();
  const customQuery = useCustomVariables();
  const deleteVariable = useDeleteCustomVariable();

  const manageModal = useModal();
  const confirmModal = useModal();
  const [editingVariable, setEditingVariable] = React.useState<CustomVariable | null>(null);
  const [deletingVariable, setDeletingVariable] = React.useState<CustomVariable | null>(null);

  function openCreate() {
    setEditingVariable(null);
    manageModal.present();
  }
  function openEdit(v: CustomVariable) {
    setEditingVariable(v);
    manageModal.present();
  }
  function openDelete(v: CustomVariable) {
    setDeletingVariable(v);
    confirmModal.present();
  }
  function confirmDelete() {
    if (!deletingVariable) return;
    deleteVariable.mutate(deletingVariable.id, {
      onSuccess: () => {
        confirmModal.dismiss();
        setDeletingVariable(null);
      },
    });
  }

  const customVariables = customQuery.data ?? [];
  const systemVariables = systemQuery.data ?? [];

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={customVariables}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <CustomVariableRow variable={item} colors={colors} onEdit={() => openEdit(item)} onDelete={() => openDelete(item)} />
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <>
            <CmsCard colors={colors} title="System Variables" style={st.systemCard}>
              {systemQuery.isLoading ? (
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Loading…</Text>
              ) : (
                <View style={st.chipWrap}>
                  {systemVariables.map((v) => (
                    <SystemVariableChip key={v.id} variable={v} colors={colors} />
                  ))}
                </View>
              )}
            </CmsCard>

            <View style={st.customHeader}>
              <Text style={[st.customTitle, { color: colors.textPrimary }]}>Custom Variables</Text>
              <Pressable onPress={openCreate} style={[st.addBtn, { backgroundColor: colors.accent }]}>
                <Ionicons name="add" size={16} color={colors.accentText} />
                <Text style={[st.addBtnText, { color: colors.accentText }]}>Add</Text>
              </Pressable>
            </View>
          </>
        }
        ListEmptyComponent={
          customQuery.isLoading ? null : (
            <View style={st.center}>
              <Text style={{ color: colors.textSecondary }}>No custom variables yet</Text>
            </View>
          )
        }
      />

      <ManageVariableModal
        ref={manageModal.ref}
        colors={colors}
        selectedVariable={editingVariable}
        onSuccess={() => manageModal.dismiss()}
      />
      <ConfirmModal
        ref={confirmModal.ref}
        title="Delete variable?"
        description={deletingVariable ? `{{${deletingVariable.name}}} will be permanently deleted.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleteVariable.isPending}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

const st = StyleSheet.create({
  systemCard: { marginHorizontal: 16, marginTop: 12, marginBottom: 16 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  customTitle: cmsType.sectionTitle,
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: { fontSize: 12.5, fontWeight: '700' },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
});
