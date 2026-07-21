import * as React from 'react';

import { getExpoUrl } from '@/api/coder';

const POLL_INTERVAL_MS = 5000;

/**
 * Polls the Expo-Go tunnel URL for a mobile app_type tenant. `enabled` should
 * be gated to the Preview tab's own focus state (`useIsFocused()`) — there's
 * no reason to hit this endpoint every 5s while the user is on Chat/Code,
 * even though the Preview screen itself stays mounted in the background.
 */
export function useExpoUrlPoll(tenantId: string, enabled: boolean) {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    async function poll() {
      try {
        const res = await getExpoUrl(tenantId);
        if (!cancelled) setUrl(res.url ?? null);
      } catch {
        // keep last known url on a transient failure
      }
    }

    void poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tenantId, enabled]);

  return url;
}
