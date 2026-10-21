import * as React from 'react';

import { getExpoUrl } from '@/api/coder';

const POLL_INTERVAL_MS = 5000;
/** The runner stops a dev server that has had no new request for ~90s. */
const KEEPALIVE_MS = 30000;
/** How often to knock again while no server has come up. */
const WAKE_RETRY_MS = 20000;

const previewBase = (tenantUid: string) =>
  `https://appsketch.ai/preview/${tenantUid}`;

/** Fire-and-forget GET: only its arrival at the runner matters. */
function knock(url: string) {
  fetch(url, { method: 'GET', cache: 'no-store' }).catch(() => {});
}

/**
 * Polls the Expo-Go tunnel URL for a mobile app_type tenant. `enabled` should
 * be gated to the Preview tab's own focus state (`useIsFocused()`) — there's
 * no reason to hit this endpoint every 5s while the user is on Chat/Code,
 * even though the Preview screen itself stays mounted in the background.
 *
 * The URL only exists while the app's dev server (Metro) runs, and nothing
 * here would start one: the runner boots Metro when the app's
 * `/preview/<uuid>/` page is requested, which the web builder's preview frame
 * does just by loading. A freshly copied template ("Use app") has no server
 * yet, so the poll waited forever. While focused this requests that page
 * until a URL arrives, then pings `__keepalive` so a quiet session keeps it.
 */
export function useExpoUrlPoll(
  tenantId: string,
  enabled: boolean,
  tenantUid?: string
) {
  const [url, setUrl] = React.useState<string | null>(null);
  const urlRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    async function poll() {
      try {
        const res = await getExpoUrl(tenantId);
        if (cancelled) return;
        urlRef.current = res.url ?? null;
        setUrl(urlRef.current);
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

  React.useEffect(() => {
    if (!enabled || !tenantUid) return undefined;
    const base = previewBase(tenantUid);
    knock(`${base}/`);
    const wake = setInterval(() => {
      if (!urlRef.current) knock(`${base}/`);
    }, WAKE_RETRY_MS);
    const keepalive = setInterval(
      () => knock(`${base}/__keepalive`),
      KEEPALIVE_MS
    );
    return () => {
      clearInterval(wake);
      clearInterval(keepalive);
    };
  }, [tenantUid, enabled]);

  return url;
}
