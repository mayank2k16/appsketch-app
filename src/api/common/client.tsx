import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';

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

