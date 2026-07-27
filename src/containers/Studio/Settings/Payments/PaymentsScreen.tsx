/**
 * Payments — tenant's own payment-gateway providers, ported from the web
 * reference (`Studio/Settings/Payments/index.jsx`). Distinct from
 * subscription/plan billing (Cart/PricingScreen) — this is merchant
 * onboarding so a tenant's store can accept its customers' payments.
 */
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { usePaymentMerchants, type PaymentMerchant } from '@/api/payment-merchants';
import { useUserTenants, type TenantSummary } from '@/api/studio';
import { useAppTheme, type AppColors } from '@/lib/theme';
import { F } from '@/lib/fonts';

import { PaymentForm, emptyPaymentFormData, type PaymentFormData } from './PaymentForm';

function providerColor(provider?: string): string {
  switch (provider) {
    case 'razorpay':
      return '#3395FF';
    case 'stripe':
      return '#635BFF';
    case 'paytm':
      return '#00BAF2';
    default:
      return '#8E8E93';
  }
}

function statusColor(status?: string): string {
  return status === 'completed' ? '#22C55E' : '#FBBF24';
}

export function PaymentsScreen() {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const { data: tenants } = useUserTenants();
  const { data: merchants, isLoading } = usePaymentMerchants();

  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<PaymentMerchant | null>(null);
  const [filterTenant, setFilterTenant] = React.useState<TenantSummary | null>(null);

  function openAddForm() {
    setEditing(null);
    setShowForm(true);
  }

  function openEditForm(merchant: PaymentMerchant) {
    setEditing(merchant);
    setShowForm(true);
  }

  function handleFormDone() {
    setShowForm(false);
    setEditing(null);
  }

  const filtered = (merchants ?? []).filter((m) => !filterTenant || m.tenant === filterTenant.id);

  function tenantTitle(tenantId?: number) {
    return (tenants ?? []).find((tn) => tn.id === tenantId)?.title;
  }

  if (showForm) {
    const initialFormData: PaymentFormData | undefined = editing
      ? {
          email: editing.email ?? '',
          phone: editing.phone ?? '',
          apiKey: editing._api_key ?? '',
          secretKey: editing._api_secret ?? '',
          provider: editing.provider ?? 'razorpay',
          contactName: '',
          legalBusinessName: editing.legal_business_name ?? editing.legalBusinessName ?? '',
        }
      : emptyPaymentFormData;
    const initialTenant = editing ? (tenants ?? []).find((tn) => tn.id === editing.tenant) ?? null : filterTenant;

    return (
      <View style={st.content}>
        <PaymentForm
          tenants={tenants ?? []}
          initialTenant={initialTenant}
          initialFormData={initialFormData}
          onCancel={() => setShowForm(false)}
          onSubmitted={handleFormDone}
          t={t}
        />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <Text style={[st.heading, { color: t.text }]}>Payments</Text>
      <Text style={[st.subheading, { color: t.textSub }]}>View and manage all your payments in one place.</Text>

      <View style={st.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          <TouchableOpacity
            onPress={() => setFilterTenant(null)}
            style={[
              st.tenantChip,
              { borderColor: t.border, backgroundColor: t.agentTabBg },
              !filterTenant && { borderColor: t.accent, backgroundColor: t.accentSoft },
            ]}
          >
            <Text style={[st.tenantChipText, { color: !filterTenant ? t.accent : t.text }]}>All apps</Text>
          </TouchableOpacity>
          {(tenants ?? []).map((tenant) => {
            const active = filterTenant?.id === tenant.id;
            return (
              <TouchableOpacity
                key={String(tenant.id)}
                onPress={() => setFilterTenant(tenant)}
                style={[
                  st.tenantChip,
                  { borderColor: t.border, backgroundColor: t.agentTabBg },
                  active && { borderColor: t.accent, backgroundColor: t.accentSoft },
                ]}
              >
                <Text style={[st.tenantChipText, { color: active ? t.accent : t.text }]} numberOfLines={1}>
                  {tenant.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity onPress={openAddForm} style={[st.addBtn, { backgroundColor: t.accent }]}>
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={st.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={t.accent} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={st.empty}>
          <Ionicons name="card-outline" size={32} color={t.textMuted} />
          <Text style={[st.emptyText, { color: t.textMuted }]}>
            You haven't connected a payment provider yet. Add one to start accepting payments.
          </Text>
        </View>
      ) : (
        filtered.map((merchant, i) => (
          <View key={merchant.id ?? i} style={[st.card, { backgroundColor: t.card, borderColor: t.border }]}>
            <TouchableOpacity onPress={() => openEditForm(merchant)} style={st.editBtn} hitSlop={8}>
              <Ionicons name="create-outline" size={16} color={t.textMuted} />
            </TouchableOpacity>

            <MerchantRow t={t} label="Email" value={merchant.email ?? '—'} />
            <MerchantRow
              t={t}
              label="Provider"
              value={merchant.provider ?? '—'}
              valueColor={providerColor(merchant.provider)}
            />
            <MerchantRow
              t={t}
              label="Status"
              value={merchant.status ?? '—'}
              valueColor={statusColor(merchant.status)}
            />
            <MerchantRow t={t} label="App" value={tenantTitle(merchant.tenant) ?? '—'} />
          </View>
        ))
      )}
    </ScrollView>
  );
}

function MerchantRow({ t, label, value, valueColor }: { t: AppColors; label: string; value: string; valueColor?: string }) {
  return (
    <View style={st.merchantRow}>
      <Text style={[st.merchantLabel, { color: t.textMuted }]}>{label}</Text>
      <Text style={[st.merchantValue, { color: valueColor ?? t.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  subheading: { fontSize: 13, marginTop: 4, marginBottom: 16, lineHeight: 18 },

  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  tenantChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, maxWidth: 150 },
  tenantChipText: { fontFamily: F.sans600, fontSize: 12.5 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 },
  addBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },

  empty: { alignItems: 'center', gap: 10, paddingTop: 50, paddingHorizontal: 20 },
  emptyText: { fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 19 },

  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, position: 'relative', gap: 8 },
  editBtn: { position: 'absolute', top: 12, right: 12 },
  merchantRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 },
  merchantLabel: { fontSize: 11.5, fontWeight: '600' },
  merchantValue: { fontSize: 12.5, fontWeight: '600', textTransform: 'capitalize', maxWidth: '60%' },
});
