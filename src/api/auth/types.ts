export type AuthNextStep = 'ASK_NAME' | 'VERIFY_OTP';

export type AuthUser = Record<string, unknown>;

export type ContinueAuthResponse = {
  is_registered: boolean;
  next_step: AuthNextStep;
  otp_sent_via?: 'email' | 'sms';
  session_id?: string;
};

export type ContinueAuthRequest = {
  email?: string;
  phone?: string;
  name?: string;
};

export type VerifyOtpRequest = {
  otp: string;
  email?: string;
  phone?: string;
  session_id?: string;
};

export type VerifyOtpResponse = {
  token: {
    access: string;
    refresh: string;
  };
  user: AuthUser;
  operational: boolean;
  delivery_charge: number;
  default_delivery_charge: number;
};
