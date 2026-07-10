import axios from 'axios';
import type {
  ContinueAuthRequest,
  ContinueAuthResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from './types';

const AUTH_BASE_URL = 'https://appsketch.ai/api';
const AUTH_ORIGIN = 'https://appsketch.ai/';

const authClient = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Origin: AUTH_ORIGIN,
    Referer: `${AUTH_ORIGIN}/`,
    'User-Agent': 'FashionApp/1.0 (React Native)',
  },
});

export async function continueAuth(
  payload: ContinueAuthRequest
): Promise<ContinueAuthResponse> {
  const { data } = await authClient.post<ContinueAuthResponse>(
    'account/tenant_user/continue/',
    payload
  );
  return data;
}

export async function verifyOtp(
  payload: VerifyOtpRequest
): Promise<VerifyOtpResponse> {
  const { data } = await authClient.post<VerifyOtpResponse>(
    'account/tenant_user/verify-tenant/',
    payload
  );
  return data;
}

/** Google Sign-In — payload is the Google OAuth access token obtained via
 * expo-auth-session. Returns the same envelope as `verifyOtp`. */
export async function continueGoogle(payload: {
  token: string;
}): Promise<VerifyOtpResponse> {
  const { data } = await authClient.post<VerifyOtpResponse>(
    'account/auth/google-tenant-login/',
    payload
  );
  return data;
}
