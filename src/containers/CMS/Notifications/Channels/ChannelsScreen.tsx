import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type {
  EmailChannelConfig,
  FcmChannelConfig,
  NotificationConfigPayload,
  SmsChannelConfig,
  WhatsappChannelConfig,
} from '@/api/notifications';
import { EMPTY_NOTIFICATION_CONFIG, useNotificationConfig, useUpdateNotificationConfig } from '@/api/notifications';

import { CmsButton, CmsCard, CmsInput, CmsSwitch } from '../../components';
import { useCmsTheme } from '../../theme';

/** Secret fields come back from the API masked as this placeholder. If the
 * user never touches the field, it's omitted from the save payload entirely
 * so the real value on the backend isn't overwritten with the mask itself. */
const MASKED_SECRET = '••••••••';

function omitIfMasked<T extends Record<string, unknown>>(section: T, secretKey: keyof T): Partial<T> {
  if (section[secretKey] === MASKED_SECRET) {
    const { [secretKey]: _omitted, ...rest } = section;
    return rest as Partial<T>;
  }
  return section;
}

export function ChannelsScreen() {
  const { colors } = useCmsTheme();
  const configQuery = useNotificationConfig();
  const updateConfig = useUpdateNotificationConfig();

  const [email, setEmail] = React.useState<EmailChannelConfig>(EMPTY_NOTIFICATION_CONFIG.email);
  const [sms, setSms] = React.useState<SmsChannelConfig>(EMPTY_NOTIFICATION_CONFIG.sms);
  const [fcm, setFcm] = React.useState<FcmChannelConfig>(EMPTY_NOTIFICATION_CONFIG.fcm);
  const [whatsapp, setWhatsapp] = React.useState<WhatsappChannelConfig>(EMPTY_NOTIFICATION_CONFIG.whatsapp);

  React.useEffect(() => {
    if (!configQuery.data) return;
    setEmail(configQuery.data.email);
    setSms(configQuery.data.sms);
    setFcm(configQuery.data.fcm);
    setWhatsapp(configQuery.data.whatsapp);
  }, [configQuery.data]);

  function handleSave() {
    const payload: NotificationConfigPayload = {
      email: omitIfMasked(email, 'smtp_password'),
      sms: omitIfMasked(sms, 'api_key'),
      fcm: omitIfMasked(fcm, 'api_key'),
      whatsapp: omitIfMasked(whatsapp, 'token'),
    };
    updateConfig.mutate(payload);
  }

  if (configQuery.isLoading) {
    return (
      <View style={st.center}>
        <Text style={{ color: colors.textSecondary }}>Loading channel settings…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">
      <CmsCard colors={colors} title="Email (SMTP)">
        <CmsInput colors={colors} label="Sender Email" value={email.sender_email} onChangeText={(v) => setEmail((p) => ({ ...p, sender_email: v }))} keyboardType="email-address" autoCapitalize="none" />
        <CmsInput colors={colors} label="Sender Name" value={email.sender_name} onChangeText={(v) => setEmail((p) => ({ ...p, sender_name: v }))} />
        <CmsInput colors={colors} label="SMTP Host" value={email.smtp_host} onChangeText={(v) => setEmail((p) => ({ ...p, smtp_host: v }))} autoCapitalize="none" />
        <CmsInput colors={colors} label="SMTP Port" value={email.smtp_port} onChangeText={(v) => setEmail((p) => ({ ...p, smtp_port: v }))} keyboardType="number-pad" />
        <CmsInput colors={colors} label="SMTP User" value={email.smtp_user} onChangeText={(v) => setEmail((p) => ({ ...p, smtp_user: v }))} autoCapitalize="none" />
        <CmsInput colors={colors} label="SMTP Password" value={email.smtp_password} onChangeText={(v) => setEmail((p) => ({ ...p, smtp_password: v }))} secureTextEntry />
        <CmsSwitch colors={colors} label="Use TLS" value={email.smtp_use_tls} onChange={(v) => setEmail((p) => ({ ...p, smtp_use_tls: v }))} />
      </CmsCard>

      <CmsCard colors={colors} title="SMS">
        <CmsInput colors={colors} label="API Key" value={sms.api_key} onChangeText={(v) => setSms({ api_key: v })} secureTextEntry />
      </CmsCard>

      <CmsCard colors={colors} title="Push (FCM)">
        <CmsInput colors={colors} label="API Key" value={fcm.api_key} onChangeText={(v) => setFcm({ api_key: v })} secureTextEntry />
      </CmsCard>

      <CmsCard colors={colors} title="WhatsApp">
        <CmsInput colors={colors} label="Access Token" value={whatsapp.token} onChangeText={(v) => setWhatsapp((p) => ({ ...p, token: v }))} secureTextEntry />
        <CmsInput colors={colors} label="Phone ID" value={whatsapp.phone_id} onChangeText={(v) => setWhatsapp((p) => ({ ...p, phone_id: v }))} />
      </CmsCard>

      <CmsButton colors={colors} label="Save Channel Settings" onPress={handleSave} loading={updateConfig.isPending} style={st.saveBtn} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  saveBtn: { marginTop: 4 },
});
