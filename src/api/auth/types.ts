export type AuthNextStep = 'ASK_NAME' | 'VERIFY_OTP';

export type AuthUser = Record<string, unknown>;

/**
 * Shape of `user.subscription`, inferred from the web reference (Vite
 * `Containers/Studio/Studio.jsx` reads `parsed.subscription` off the same
 * `user` object from localStorage; `Containers/HomeV3/CartPage/Cart.jsx`
 * writes this exact shape after a successful payment). Not yet confirmed
 * against a live appsketch-app login/verify-otp response — same caveat as
 * `tenant_id` in `src/api/vendors/client.ts`. `AuthUser` stays an opaque
 * `Record<string, unknown>` on purpose (see that file's comment), so this
 * type is only used for the read/write helpers in `src/hooks/useAuth`,
 * not as a field on `AuthUser` itself.
 */
export type UserSubscription = {
  active: boolean;
  plan: {
    id?: number;
    tier: string;
    display_name: string;
  };
};

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
