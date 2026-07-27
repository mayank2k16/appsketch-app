/**
 * Add/edit a payment-gateway merchant — ported from the web reference
 * (`Studio/Settings/Payments/PaymentForm.jsx`). No exact Razorpay/Stripe/
 * Paytm brand glyphs in the RN icon set here, so each provider gets a
 * generic card icon tinted with that provider's brand color instead of
 * hand-drawing brand SVGs.
 */
import * as React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { AddPaymentMerchantPayload, PaymentProvider } from '@/api/payment-merchants';
import { useAddPaymentMerchant } from '@/api/payment-merchants';
import type { TenantSummary } from '@/api/studio';
import { F } from '@/lib/fonts';
import { toast } from '@/lib/toast';
import type { AppColors } from '@/lib/theme';

const PROVIDERS: { key: PaymentProvider; label: string; color: string }[] = [
  { key: 'razorpay', label: 'Razorpay', color: '#3395FF' },
  { key: 'stripe', label: 'Stripe', color: '#635BFF' },
  { key: 'paytm', label: 'Paytm', color: '#00BAF2' },
];

export type PaymentFormData = {
  email: string;
  phone: string;
  apiKey: string;
  secretKey: string;
  provider: PaymentProvider;
  contactName: string;
  legalBusinessName: string;
};

const EMPTY_FORM: PaymentFormData = {
  email: '',
  phone: '',
  apiKey: '',
  secretKey: '',
  provider: 'razorpay',
  contactName: '',
  legalBusinessName: '',
};

export { EMPTY_FORM as emptyPaymentFormData };

export function PaymentForm({
  tenants,
  initialTenant,
  initialFormData,
  onCancel,
  onSubmitted,
  t,
}: {
  tenants: TenantSummary[];
  initialTenant?: TenantSummary | null;
  initialFormData?: PaymentFormData;
  onCancel: () => void;
  onSubmitted: () => void;
  t: AppColors;
}) {
  const [form, setForm] = React.useState<PaymentFormData>(initialFormData ?? EMPTY_FORM);
  const [selectedTenant, setSelectedTenant] = React.useState<TenantSummary | null>(initialTenant ?? null);
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [showSecretKey, setShowSecretKey] = React.useState(false);
  const addMerchant = useAddPaymentMerchant();

  function setField(key: keyof PaymentFormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!selectedTenant) {
      toast.error('Please select your app');
      return;
    }
    if (!form.email.trim() || !form.phone.trim() || !form.apiKey.trim() || !form.secretKey.trim()) {
      toast.warning('Please fill all required fields');
      return;
    }

    const payload: AddPaymentMerchantPayload = {
      email: form.email.trim(),
      phone: form.phone.trim(),
      _api_key: form.apiKey.trim(),
      _api_secret: form.secretKey.trim(),
      legal_business_name: form.legalBusinessName.trim(),
      business_type: 'E-commerce',
      provider: form.provider,
      contactName: form.contactName.trim(),
      tenant_id: selectedTenant.id,
    };

    addMerchant.mutate(payload, { onSuccess: onSubmitted });
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={st.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={onCancel} style={st.backRow}>
        <Ionicons name="arrow-back" size={16} color={t.textSub} />
        <Text style={[st.backText, { color: t.textSub }]}>Back</Text>
      </TouchableOpacity>

      <Text style={[st.label, { color: t.textMuted }]}>App</Text>
      <View style={st.tenantRow}>
        {tenants.map((tenant) => {
          const active = selectedTenant?.id === tenant.id;
          return (
            <TouchableOpacity
              key={String(tenant.id)}
              onPress={() => setSelectedTenant(tenant)}
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
      </View>

      <Text style={[st.label, { color: t.textMuted, marginTop: 18 }]}>Provider</Text>
      <View style={st.providerRow}>
        {PROVIDERS.map((p) => {
          const active = form.provider === p.key;
          return (
            <TouchableOpacity
              key={p.key}
              onPress={() => setField('provider', p.key)}
              style={[
                st.providerBtn,
                { borderColor: t.border },
                active && { borderColor: p.color, backgroundColor: `${p.color}1A` },
              ]}
            >
              <Ionicons name="card-outline" size={20} color={active ? p.color : t.textMuted} />
              <Text style={[st.providerLabel, { color: active ? p.color : t.text }]}>{p.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FormField t={t} label="Email" value={form.email} onChangeText={(v) => setField('email', v)} keyboardType="email-address" />
      <FormField t={t} label="Phone" value={form.phone} onChangeText={(v) => setField('phone', v)} keyboardType="phone-pad" />
      <FormField t={t} label="Legal business name" value={form.legalBusinessName} onChangeText={(v) => setField('legalBusinessName', v)} />
      <FormField t={t} label="Contact name" value={form.contactName} onChangeText={(v) => setField('contactName', v)} />
      <FormField
        t={t}
        label="API key"
        value={form.apiKey}
        onChangeText={(v) => setField('apiKey', v)}
        secure={!showApiKey}
        onToggleSecure={() => setShowApiKey((s) => !s)}
      />
      <FormField
        t={t}
        label="Secret key"
        value={form.secretKey}
        onChangeText={(v) => setField('secretKey', v)}
        secure={!showSecretKey}
        onToggleSecure={() => setShowSecretKey((s) => !s)}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        activeOpacity={0.85}
        disabled={addMerchant.isPending}
        style={[st.submitBtn, { backgroundColor: t.accent }, addMerchant.isPending && { opacity: 0.6 }]}
      >
        <Text style={st.submitBtnText}>{addMerchant.isPending ? 'Connecting…' : 'Connect'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function FormField({
  t,
  label,
  value,
  onChangeText,
  keyboardType,
  secure,
  onToggleSecure,
}: {
  t: AppColors;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'email-address' | 'phone-pad';
  secure?: boolean;
  onToggleSecure?: () => void;
}) {
  return (
    <View style={st.fieldRow}>
      <Text style={[st.label, { color: t.textMuted }]}>{label}</Text>
      <View style={st.fieldInputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secure}
          autoCapitalize="none"
          placeholderTextColor={t.textMuted}
          style={[st.input, { color: t.text, borderColor: t.border }]}
        />
        {onToggleSecure && (
          <TouchableOpacity onPress={onToggleSecure} style={st.eyeBtn} hitSlop={8}>
            <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={16} color={t.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText: { fontFamily: F.sans600, fontSize: 13 },

  label: { fontFamily: F.sans600, fontSize: 10.5, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 },

  tenantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tenantChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, maxWidth: 160 },
  tenantChipText: { fontFamily: F.sans600, fontSize: 12.5 },

  providerRow: { flexDirection: 'row', gap: 10 },
  providerBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  providerLabel: { fontFamily: F.sans700, fontSize: 12 },

  fieldRow: { marginTop: 18 },
  fieldInputRow: { position: 'relative' },
  input: { fontFamily: F.sans500, fontSize: 14, borderBottomWidth: 1, paddingVertical: 8, paddingRight: 28 },
  eyeBtn: { position: 'absolute', right: 0, top: 6 },

  submitBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 28, marginBottom: 12 },
  submitBtnText: { fontFamily: F.sans700, fontSize: 14, color: '#FFFFFF' },
});
