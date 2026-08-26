import axios from 'axios';
import type { AxiosError } from 'axios';
import { router } from 'expo-router';

import { signOut, useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';

/** Any authenticated request that comes back 401 means the access token is
 * expired/invalid — DRF SimpleJWT's standard signal for this. Handled once
 * here rather than in every screen's catch block: clear the session and kick
 * the user back to `/login`. Guarded on current status so a burst of
 * concurrently in-flight requests after expiry doesn't fire this repeatedly. */
function handleAuthError(error: AxiosError) {
  console.log(error);
  const errorStatus = error.response?.status;
  const errorMsg = (error.response?.data as { error?: string } | undefined)?.error;
  if (errorStatus == 400 && errorMsg == 'Invalid authentication token.' && useAuth.getState().status !== 'signOut') {
    signOut();
    toast.error('Your session has expired. Please log in again.');
    router.replace('/login');
  }
  return Promise.reject(error);
}

export const client = axios.create({
  baseURL: 'https://appsketch.ai/',
  headers: {
    Accept: 'application/json',
    Origin: 'https://appsketch.ai',
    Referer: 'https://appsketch.ai/',
  },
  timeout: 10000,
});


export const authenticatedClient = axios.create({
  baseURL: 'https://appsketch.ai/',
  headers: {
    Accept: 'application/json',
    Origin: 'https://appsketch.ai',
    Referer: 'https://appsketch.ai/',
  },
  timeout: 10000,
});


authenticatedClient.interceptors.request.use((config) => {
  const token = useAuth.getState().token?.access;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

authenticatedClient.interceptors.response.use((res) => res, handleAuthError);


export const accountClient = axios.create({
  baseURL: 'https://appsketch.ai/api',
  headers: {
    Accept: 'application/json',
    Origin: 'https://appsketch.ai',
    Referer: 'https://appsketch.ai/',
  },
  timeout: 10000,
});

accountClient.interceptors.request.use((config) => {
  const token = useAuth.getState().token?.access;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

accountClient.interceptors.response.use((res) => res, handleAuthError);

