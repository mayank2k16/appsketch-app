/**
 * Single source of truth for everything auth-related: session state/storage,
 * the email/phone OTP flow, and Google Sign-In. Deliberately kept as one file
 * rather than split across lib/hooks/components — this used to be scattered
 * across `src/lib/auth/*` (store + storage) and
 * `src/components/auth/use-continue-auth-flow.ts` (OTP steps), plus an
 * orphaned duplicate that used to live at this exact path. Consolidated here.
 */
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { Animated, Easing } from 'react-native';
import { create } from 'zustand';

import { continueAuth, continueGoogle, verifyOtp } from '@/api/auth';
import type { AuthNextStep, AuthUser, ContinueAuthResponse, VerifyOtpResponse } from '@/api/auth/types';
import { Env } from '@env';
import { getItem, removeItem, setItem } from '@/lib/storage';
import { toast } from '@/lib/toast';
import { createSelectors } from '@/lib/utils';

WebBrowser.maybeCompleteAuthSession();

// ─────────────────────────────────────────────────────────────────────────────
//  Token/user storage (MMKV)
// ─────────────────────────────────────────────────────────────────────────────
const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const GUEST_KEY = 'guest_mode';

export type TokenType = {
  access: string;
  refresh: string;
};

const getToken = () => getItem<TokenType>(TOKEN_KEY);
const removeToken = () => removeItem(TOKEN_KEY);
const setToken = (value: TokenType) => setItem<TokenType>(TOKEN_KEY, value);

const getUser = () => getItem<AuthUser>(USER_KEY);
const removeUser = () => removeItem(USER_KEY);
const setUser = (value: AuthUser) => setItem<AuthUser>(USER_KEY, value);

// ─────────────────────────────────────────────────────────────────────────────
//  Session state (zustand)
// ─────────────────────────────────────────────────────────────────────────────
interface AuthState {
  token: TokenType | null;
  user: AuthUser | null;
  status: 'idle' | 'signOut' | 'signIn' | 'guest';
  signIn: (data: TokenType, user?: AuthUser) => void;
  signOut: () => void;
  signInAsGuest: () => void;
  hydrate: () => void;
}

const _useAuth = create<AuthState>((set, get) => ({
  status: 'idle',
  token: null,
  user: null,

  signIn: (token, user) => {
    setToken(token);
    if (user) setUser(user); else removeUser();
    // Clear guest flag if they were browsing as guest
    removeItem(GUEST_KEY);
    set({ status: 'signIn', token, user: user ?? null });
  },

  signOut: () => {
    removeToken();
    removeUser();
    removeItem(GUEST_KEY);
    set({ status: 'signOut', token: null, user: null });
  },

  signInAsGuest: () => {
    setItem(GUEST_KEY, true);
    set({ status: 'guest', token: null, user: null });
  },

  hydrate: () => {
    try {
      const userToken = getToken();
      if (userToken !== null) {
        get().signIn(userToken, getUser() ?? undefined);
      } else {
        // Restore guest session if they were in guest mode before
        const wasGuest = getItem<boolean>(GUEST_KEY);
        if (wasGuest) {
          set({ status: 'guest', token: null, user: null });
        } else {
          get().signOut();
        }
      }
    } catch (e) {
      console.error(e);
    }
  },
}));

export const useAuth = createSelectors(_useAuth);

export const signOut = () => _useAuth.getState().signOut();
export const signIn = (token: TokenType, user?: AuthUser) => _useAuth.getState().signIn(token, user);
export const signInAsGuest = () => _useAuth.getState().signInAsGuest();
export const hydrateAuth = () => _useAuth.getState().hydrate();

/** True when the user is browsing without an account */
export const isGuest = () => _useAuth.getState().status === 'guest';

/** Session bootstrap shared by the OTP and Google flows: signs in, then
 * replays any cart items a guest added before authenticating.
 *
 * `cart-store` is required lazily (not statically imported) because it pulls
 * in `api/common/client`, which itself imports `useAuth` from this file —
 * a static import here would create a module cycle that leaves `useAuth`
 * undefined for early consumers (e.g. splash.tsx) at app startup. */
function signInAfterVerify(response: VerifyOtpResponse): void {
  const pendingItems = getItem<{ id: number; quantity: number }[]>('pending_cart_sync') ?? [];

  signIn({
    access: response.token.access,
    refresh: response.token.refresh,
  }, response.user);

  void removeItem('pending_cart_sync');

  if (pendingItems.length) {
    const { useCart } = require('@/lib/store/cart-store');
    void useCart.getState().syncPendingCartItems(pendingItems);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Email/phone OTP flow
// ─────────────────────────────────────────────────────────────────────────────
export type Step = 'landing' | 'contact' | 'name' | 'otp';

// OTP length isn't fixed by the backend, so the input is a plain free-length
// field rather than a fixed set of digit boxes — only a loose sanity minimum
// is enforced here.
const OTP_MIN_LENGTH = 4;
const RESEND_COOLDOWN_SECONDS = 30;
// Matches the web reference (Vite/src/Containers/Login/LoginForm) — Indian mobile numbers.
const INDIAN_PHONE_REGEX = /^(?:\+91|91|0)?[6-9]\d{9}$/;

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isValidIndianPhone = (v: string) => INDIAN_PHONE_REGEX.test(v.trim());

type AuthFlowState = {
  nextStep: AuthNextStep | null;
  otpSentVia?: string;
  email?: string;
  phone?: string;
  sessionId?: string;
};

function showErrorFlash(err: unknown, fallback: string) {
  let msg: string | null = null;
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as any).response?.data;
    if (typeof res === 'object' && res !== null && 'detail' in res) {
      const d = res.detail;
      msg = Array.isArray(d) ? d.map(String).join(' ') : String(d);
    }
  }
  toast.error(msg || fallback);
}

/**
 * Shared state machine for the contact -> (name) -> otp -> verify flow, used
 * by both the full-page login screen and the AuthSheet modal so the two
 * can't drift out of sync (e.g. one having session_id handling and the other not).
 */
export function useContinueAuthFlow(initialStep: Step, onVerified: () => void) {
  const [step, setStep] = React.useState<Step>(initialStep);
  const [loading, setLoading] = React.useState(false);
  const [resendLoading, setResendLoading] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [authState, setAuthState] = React.useState<AuthFlowState | null>(null);

  const [contact, setContact] = React.useState('');
  const [name, setName] = React.useState('');
  const [otp, setOtp] = React.useState('');

  const stepAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  function transitionStep(newStep: Step) {
    Animated.timing(stepAnim, {
      toValue: 0, duration: 120, easing: Easing.out(Easing.ease), useNativeDriver: true,
    }).start(() => {
      setStep(newStep);
      Animated.spring(stepAnim, { toValue: 1, tension: 70, friction: 12, useNativeDriver: true }).start();
    });
  }

  function reset() {
    setStep(initialStep);
    setAuthState(null);
    setContact('');
    setName('');
    setOtp('');
    setResendCooldown(0);
  }

  async function handleContinueContact() {
    const c = contact.trim();
    if (!c) { toast.error('Enter your email or phone number'); return; }

    let payload: { email: string } | { phone: string };
    if (isEmail(c)) {
      payload = { email: c };
    } else {
      if (!isValidIndianPhone(c)) { toast.error('Enter a valid phone number'); return; }
      payload = { phone: c };
    }

    setLoading(true);
    try {
      const res: ContinueAuthResponse = await continueAuth(payload);
      setAuthState({
        nextStep: res.next_step, otpSentVia: res.otp_sent_via, sessionId: res.session_id,
        ...payload,
      });
      if (res.next_step === 'ASK_NAME') {
        transitionStep('name');
      } else if (res.next_step === 'VERIFY_OTP') {
        transitionStep('otp');
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        toast.success(`Code sent to your ${'email' in payload ? 'email' : 'phone'}.`);
      }
    } catch (err) { showErrorFlash(err, 'Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  }

  async function handleSubmitName() {
    const n = name.trim();
    if (!n) { toast.error('Please enter your name'); return; }
    if (!authState) return;
    setLoading(true);
    try {
      const payload = authState.email ? { email: authState.email, name: n } : { phone: authState.phone, name: n };
      const res: ContinueAuthResponse = await continueAuth(payload);
      setAuthState((prev) => (prev
        ? { ...prev, nextStep: res.next_step, otpSentVia: res.otp_sent_via, sessionId: res.session_id }
        : null));
      transitionStep('otp');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(`Code sent to your ${authState.email ? 'email' : 'phone'}.`);
    } catch (err) { showErrorFlash(err, 'Registration failed. Please try again.'); }
    finally { setLoading(false); }
  }

  async function handleVerifyOtp(directOtp?: string) {
    const o = (directOtp ?? otp).replace(/\s/g, '');
    if (o.length < OTP_MIN_LENGTH) { toast.error('Enter the code sent to you'); return; }
    if (!authState?.email && !authState?.phone) {
      toast.error('Session expired. Please start again.'); reset(); return;
    }
    setLoading(true);
    try {
      const payload = authState.email
        ? { otp: o, email: authState.email }
        : { otp: o, phone: authState.phone, session_id: authState.sessionId };
      const data = await verifyOtp(payload);
      signInAfterVerify(data);
      const saved = authState.phone || authState.email || '';
      if (saved) void setItem('user_contact', saved);
      toast.success('Welcome to AppSketch! 👋');
      onVerified();
    } catch (err) { showErrorFlash(err, 'Invalid code. Please try again.'); }
    finally { setLoading(false); }
  }

  async function handleResendOtp() {
    if (!authState?.email && !authState?.phone) return;
    if (resendCooldown > 0) return;
    setResendLoading(true);
    try {
      const payload = authState.email ? { email: authState.email } : { phone: authState.phone };
      const res: ContinueAuthResponse = await continueAuth(payload);
      setAuthState((prev) => (prev ? { ...prev, sessionId: res.session_id } : prev));
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(`New code sent to your ${authState.email ? 'email' : 'phone'}.`);
    } catch (err) { showErrorFlash(err, 'Could not resend. Please try again.'); }
    finally { setResendLoading(false); }
  }

  return {
    step, setStep, transitionStep, stepAnim, reset,
    loading, resendLoading, resendCooldown,
    contact, setContact, name, setName, otp, setOtp,
    authState,
    handleContinueContact, handleSubmitName, handleVerifyOtp, handleResendOtp,
  };
}

const GOOGLE_AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

export function useGoogleSignIn(onSuccess: () => void) {
  const [loading, setLoading] = React.useState(false);
  const isConfigured = Boolean(Env.GOOGLE_OAUTH_CLIENT_ID);

  const redirectUri = AuthSession.makeRedirectUri();

  console.log("Redirect URI:", redirectUri);
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: Env.GOOGLE_OAUTH_CLIENT_ID || 'unconfigured',
      scopes: ['openid', 'email', 'profile'],
      responseType: AuthSession.ResponseType.Token,
      usePKCE: false,
      redirectUri: redirectUri,
    },
    { authorizationEndpoint: GOOGLE_AUTHORIZATION_ENDPOINT }
  );

  React.useEffect(() => {
    if (response?.type !== 'success') return;
    const accessToken = response.params?.access_token;
    if (!accessToken) return;

    (async () => {
      setLoading(true);
      try {
        const data = await continueGoogle({ token: accessToken });
        signInAfterVerify(data);
        toast.success('Welcome to AppSketch! 👋');
        onSuccess();
      } catch {
        toast.error('Google sign-in failed. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const signInWithGoogle = React.useCallback(() => {
    if (!isConfigured) {
      toast.error('Google Sign-In is not configured yet.');
      return;
    }
    void promptAsync();
  }, [isConfigured, promptAsync]);

  return { signInWithGoogle, loading, isConfigured, ready: Boolean(request) };
}
