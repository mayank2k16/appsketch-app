export type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'FCM';
export type NotificationLogStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';

export type NotificationLog = {
  id: number;
  event_code: string;
  channel: NotificationChannel;
  target: string;
  status: NotificationLogStatus;
  error: string | null;
  created_on: string;
};

export type NotificationLogFilters = {
  event_code?: string;
  channel?: NotificationChannel;
  status?: NotificationLogStatus;
};

export type NotificationCustomer = {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  is_verified: boolean;
  inventory_name?: string;
};

export type NotificationCustomerFilters = {
  q?: string;
  is_verified?: boolean;
};

/**
 * Channels — tenant-level provider credentials (SMTP email, SMS, FCM push,
 * WhatsApp Cloud API). Secret fields (smtp_password, sms/fcm api_key,
 * whatsapp token) come back masked (`"••••••••"`) — see `MASKED_SECRET` in
 * `Channels/ChannelsScreen.tsx` for the unchanged-value-is-omitted-on-save
 * logic that keeps a masked field from overwriting the real secret.
 */
export type EmailChannelConfig = {
  sender_email: string;
  sender_name: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_password: string;
  smtp_use_tls: boolean;
};

export type SmsChannelConfig = { api_key: string };
export type FcmChannelConfig = { api_key: string };
export type WhatsappChannelConfig = { token: string; phone_id: string };

export type NotificationConfig = {
  email: EmailChannelConfig;
  sms: SmsChannelConfig;
  fcm: FcmChannelConfig;
  whatsapp: WhatsappChannelConfig;
};

/** Save payload — each section is partial so an unchanged (still-masked)
 * secret field can be omitted entirely rather than overwriting the real
 * value on the backend with the mask string. */
export type NotificationConfigPayload = {
  email?: Partial<EmailChannelConfig>;
  sms?: Partial<SmsChannelConfig>;
  fcm?: Partial<FcmChannelConfig>;
  whatsapp?: Partial<WhatsappChannelConfig>;
};

export const EMPTY_NOTIFICATION_CONFIG: NotificationConfig = {
  email: { sender_email: '', sender_name: '', smtp_host: '', smtp_port: '', smtp_user: '', smtp_password: '', smtp_use_tls: false },
  sms: { api_key: '' },
  fcm: { api_key: '' },
  whatsapp: { token: '', phone_id: '' },
};

/** Variables — system (read-only, platform-provided) and custom (tenant CRUD). */
export type SystemVariable = {
  id: number;
  name: string;
  label: string;
  description: string;
  example: string;
};

export type VariableSource = 'STATIC' | 'ATTRIBUTE';

export type CustomVariable = {
  id: number;
  name: string;
  label: string;
  description: string;
  source: VariableSource;
  static_value: string | null;
  attribute_path: string | null;
  default_value: string | null;
  is_active: boolean;
};

export type CustomVariablePayload = Omit<CustomVariable, 'id'>;
