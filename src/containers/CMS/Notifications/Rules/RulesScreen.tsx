import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { NotificationRule } from '@/api/notifications';
import { useDeleteNotificationRule, useEmailTemplates, useNotificationEvents, useNotificationRules, useSMSTemplates } from '@/api/notifications';
import { useModal } from '@/components/ui';

import { CmsConfirmModal } from '../../components';
import { useCmsTheme } from '../../theme';
import { ManageRuleModal } from './components/ManageRuleModal';
import { RuleRow } from './components/RuleRow';

export function RulesScreen() {
  const { colors } = useCmsTheme();
  const rulesQuery = useNotificationRules();
  const eventsQuery = useNotificationEvents();
  const emailTemplatesQuery = useEmailTemplates();
  const smsTemplatesQuery = useSMSTemplates();
  const deleteRule = useDeleteNotificationRule();

  const manageModal = useModal();
  const confirmModal = useModal();
  const [editingRule, setEditingRule] = React.useState<NotificationRule | null>(null);
  const [deletingRule, setDeletingRule] = React.useState<NotificationRule | null>(null);

  function openCreate() {
    setEditingRule(null);
    manageModal.present();
  }
  function openEdit(r: NotificationRule) {
    setEditingRule(r);
    manageModal.present();
  }
  function openDelete(r: NotificationRule) {
    setDeletingRule(r);
    confirmModal.present();
  }
  function confirmDelete() {
    if (!deletingRule) return;
    deleteRule.mutate(deletingRule.id, {
      onSuccess: () => {
        confirmModal.dismiss();
        setDeletingRule(null);
      },
    });
  }

  const rules = rulesQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const emailTemplates = emailTemplatesQuery.data ?? [];
  const smsTemplates = smsTemplatesQuery.data ?? [];

  return (
    <View style={{ flex: 1 }}>
      <View style={st.actionsRow}>
        <Pressable onPress={openCreate} style={[st.addBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={16} color={colors.accentText} />
          <Text style={[st.addBtnText, { color: colors.accentText }]}>Add Rule</Text>
        </Pressable>
      </View>

      {rulesQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading rules…</Text>
        </View>
      ) : rules.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>No event rules yet</Text>
        </View>
      ) : (
        <FlatList
          data={rules}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <RuleRow
              rule={item}
              event={events.find((e) => e.code === item.event_code)}
              emailTemplates={emailTemplates}
              smsTemplates={smsTemplates}
              colors={colors}
              onEdit={() => openEdit(item)}
              onDelete={() => openDelete(item)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      <ManageRuleModal
        ref={manageModal.ref}
        colors={colors}
        selectedRule={editingRule}
        onSuccess={() => manageModal.dismiss()}
      />
      <CmsConfirmModal
        ref={confirmModal.ref}
        colors={colors}
        title="Delete rule?"
        description={deletingRule ? `The rule for "${deletingRule.event_code}" will be permanently deleted.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleteRule.isPending}
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
