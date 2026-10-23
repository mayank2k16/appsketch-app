import { isAxiosError } from 'axios';

/** The server's `{"error": "…"}` message, or a calm fallback. */
export function apiError(
  err: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: unknown; detail?: unknown }
      | undefined;
    if (data && typeof data === 'object') {
      if (typeof data.error === 'string' && data.error) return data.error;
      if (typeof data.detail === 'string' && data.detail) return data.detail;
    }
    if (!err.response)
      return 'No connection. Check your internet and try again.';
  }
  return fallback;
}
