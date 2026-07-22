import * as React from 'react';

import type { WebBuildStatusValue, WebBuildWsEvent } from '@/api/coder';
import { buildWebBuildWsUrl, getLatestBuild, triggerBuild } from '@/api/coder';

const TERMINAL_STATUSES = new Set<WebBuildStatusValue>([
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

/**
 * Owns the `ws/webbuild/<build_id>/` build console — ported from Vite's
 * `useBuildLog.js`. Lives at the `CodeEditorProvider` level (not inside the
 * Preview tab) so a Deploy kicked off from Preview keeps streaming even if
 * the user switches to Chat/Code while it runs.
 */
export function useBuildLog(tenantId: string) {
  const [buildId, setBuildId] = React.useState<number | null>(null);
  const [status, setStatus] = React.useState<WebBuildStatusValue | null>(null);
  const [log, setLog] = React.useState('');
  const [errors, setErrors] = React.useState<unknown[]>([]);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [deploying, setDeploying] = React.useState(false);

  const wsRef = React.useRef<WebSocket | null>(null);

  // Load the last known build on mount so reopening the screen shows
  // where a previous deploy left off, instead of a blank state.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const latest = await getLatestBuild(tenantId);
        if (cancelled || !latest) return;
        setBuildId(latest.build_id);
        setStatus(latest.status);
        setPreviewUrl(latest.preview_url ?? null);
        setErrors(latest.errors ?? []);
      } catch {
        // no build yet — fine, Preview tab just shows the live dev preview
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  React.useEffect(() => {
    if (!buildId) return undefined;

    const ws = new WebSocket(buildWebBuildWsUrl(buildId));
    wsRef.current = ws;

    ws.onmessage = (evt) => {
      try {
        const msg: WebBuildWsEvent = JSON.parse(evt.data as string);
        switch (msg.event) {
          case 'log':
            setLog((prev) => `${prev}${msg.line}\n`);
            break;
          case 'log_batch':
            setLog((prev) => `${prev}${msg.lines.join('\n')}\n`);
            break;
          case 'status':
            setStatus(msg.status);
            if (msg.preview_url) setPreviewUrl(msg.preview_url);
            if (TERMINAL_STATUSES.has(msg.status)) setDeploying(false);
            break;
          case 'errors':
            setErrors(msg.errors);
            break;
          default:
            break;
        }
      } catch {
        // ignore malformed frames
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [buildId]);

  async function startBuild(threadId?: string) {
    setDeploying(true);
    setLog('');
    setErrors([]);
    try {
      const res = await triggerBuild(tenantId, { threadId });
      setBuildId(res.build_id);
      setStatus('QUEUED');
    } catch {
      setDeploying(false);
    }
  }

  return { buildId, status, log, errors, previewUrl, deploying, startBuild };
}

export type BuildLogState = ReturnType<typeof useBuildLog>;
