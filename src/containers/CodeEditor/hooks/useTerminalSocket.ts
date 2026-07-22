import * as React from 'react';

import { buildTerminalWsUrl } from '@/api/coder';

const MAX_OUTPUT_CHARS = 20000;

const ANSI_RE = /\x1b\[[0-9;?]*[A-Za-z]/g;

const OSC_RE = /\x1b\][^\x07]*\x07/g;

function clean(text: string): string {
  return (text || '').replace(ANSI_RE, '').replace(OSC_RE, '');
}

/**
 * Raw-byte (not JSON) interactive shell — ported from Vite's `Terminal.jsx`.
 * A real `pexpect` bash process on the workspace host, one per tenant.
 * Deliberately kept local to `TerminalPane` (not lifted into
 * `CodeEditorProvider`) — the top tab navigator already keeps a tab mounted
 * after its first (lazy) visit, so the shell connects only once the user
 * actually opens the Terminal tab, then stays alive for the rest of the
 * session exactly like the other tabs.
 */
export function useTerminalSocket(tenantId: string) {
  const [output, setOutput] = React.useState('');
  const [connected, setConnected] = React.useState(false);
  const wsRef = React.useRef<WebSocket | null>(null);

  React.useEffect(() => {
    if (!tenantId) return undefined;

    const ws = new WebSocket(buildTerminalWsUrl(tenantId));
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (evt) => {
      const text = typeof evt.data === 'string' ? evt.data : '';
      setOutput((prev) => (prev + clean(text)).slice(-MAX_OUTPUT_CHARS));
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [tenantId]);

  const send = React.useCallback((line: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(`${line}\n`);
    setOutput((prev) => `${prev}$ ${line}\n`);
  }, []);

  return { output, connected, send };
}
