import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { SmsTemplate } from '@/api/notifications';
import { useDeleteSMSTemplate, useSMSTemplates } from '@/api/notifications';
import { ConfirmModal, useModal } from '@/components/ui';

import { useCmsTheme } from '../../theme';
import { ManageSmsTemplateModal } from './components/ManageSmsTemplateModal';
import { SmsTemplateRow } from './components/SmsTemplateRow';

export function SmsTemplatesScreen() {
  const { colors } = useCmsTheme();
  const templatesQuery = useSMSTemplates();
  const deleteTemplate = useDeleteSMSTemplate();

  const manageModal = useModal();
  const confirmModal = useModal();
  const [editingTemplate, setEditingTemplate] = React.useState<SmsTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = React.useState<SmsTemplate | null>(null);

  function openCreate() {
    setEditingTemplate(null);
    manageModal.present();
  }
  function openEdit(t: SmsTemplate) {
    setEditingTemplate(t);
    manageModal.present();
  }
  function openDelete(t: SmsTemplate) {
    setDeletingTemplate(t);
    confirmModal.present();
  }
  function confirmDelete() {
    if (!deletingTemplate) return;
    deleteTemplate.mutate(deletingTemplate.id, {
      onSuccess: () => {
        confirmModal.dismiss();
        setDeletingTemplate(null);
      },
    });
  }

  const templates = templatesQuery.data ?? [];

  return (
    <View style={{ flex: 1 }}>
      <View style={st.actionsRow}>
        <Pressable onPress={openCreate} style={[st.addBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={16} color={colors.accentText} />
          <Text style={[st.addBtnText, { color: colors.accentText }]}>Add Template</Text>
        </Pressable>
      </View>

      {templatesQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading SMS templates…</Text>
        </View>
      ) : templates.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>No SMS templates yet</Text>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <SmsTemplateRow template={item} colors={colors} onEdit={() => openEdit(item)} onDelete={() => openDelete(item)} />
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      <ManageSmsTemplateModal
        ref={manageModal.ref}
        colors={colors}
        selectedTemplate={editingTemplate}
        onSuccess={() => manageModal.dismiss()}
      />
      <ConfirmModal
        ref={confirmModal.ref}
        title="Delete template?"
        description={deletingTemplate ? `"${deletingTemplate.title}" will be permanently deleted.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleteTemplate.isPending}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

const st = StyleSheet.create({
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, marginBottom: 10 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { fontSize: 13, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
});
