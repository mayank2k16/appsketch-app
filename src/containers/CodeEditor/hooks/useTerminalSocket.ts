import * as React from 'react';

import { buildTerminalWsUrl } from '@/api/coder';

const MAX_OUTPUT_CHARS = 20000;

const ANSI_RE = /\x1b\[[0-9;?]*[A-Za-z]/g;

const OSC_RE = /\x1b\][^\x07]*\x07/g;

function clean(text: string): string {
  return (text || '').replace(ANSI_RE, '').replace(OSC_RE, '');
}

/** connecting → open, or connecting → retrying → … → offline. */
export type TerminalPhase = 'connecting' | 'open' | 'retrying' | 'offline';

/** Why the server hung up (`CoderTerminalConsumer.connect`). These are
 * permanent for this mount — reconnecting cannot change the answer, so retrying
 * just burns the budget and leaves the user staring at a spinner. Every one of
 * them is actionable, so say which one it was. */
const FATAL_CLOSE: Record<number, string> = {
  4001: 'Your session expired — sign in again to use the terminal.',
  4003: 'This terminal belongs to a different project than the one you are signed in to.',
  4004: 'No project files yet — the terminal opens once your project has been generated.',
};

/** How long to wait before retry N (ms). Bounded: a shell that is down for a
 * while still reconnects on its own once it comes back, but a shell that is
 * never coming back stops pretending. */
const RETRY_MS = [400, 1000, 2500, 5000, 10000];

/**
 * Raw-byte (not JSON) interactive shell — ported from Vite's `Terminal.jsx`.
 * A real `pexpect` bash process on the workspace host, one per tenant.
 * Deliberately kept local to `TerminalPane` (not lifted into
 * `CodeEditorProvider`) — the top tab navigator already keeps a tab mounted
 * after its first (lazy) visit, so the shell connects only once the user
 * actually opens the Terminal tab, then stays alive for the rest of the
 * session exactly like the other tabs.
 *
 * The socket used to be a single `connected` boolean with no retry and no
 * close handling, so EVERY failure — an expired token, a workspace that has
 * not been generated yet, a build host that restarted — looked identical:
 * "Connecting…", forever. That is the bug this hook exists to not have.
 */
export function useTerminalSocket(tenantId: string) {
  const [output, setOutput] = React.useState('');
  const [phase, setPhase] = React.useState<TerminalPhase>('connecting');
  const [attempt, setAttempt] = React.useState(0); // bumping this reconnects
  // A manual reconnect from `offline` after a FATAL close is still at attempt
  // 0, so resetting `attempt` alone would not re-run the effect and the button
  // would do nothing. This always changes.
  const [epoch, setEpoch] = React.useState(0);
  const wsRef = React.useRef<WebSocket | null>(null);

  React.useEffect(() => {
    if (!tenantId) return undefined;
    let torndown = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    setPhase(attempt === 0 ? 'connecting' : 'retrying');

    const ws = new WebSocket(buildTerminalWsUrl(tenantId));
    wsRef.current = ws;

    const note = (line: string) =>
      setOutput((prev) =>
        `${prev}${!prev || prev.endsWith('\n') ? '' : '\n'}${line}\n`.slice(
          -MAX_OUTPUT_CHARS
        )
      );

    const onClose = (evt: { code?: number } | undefined) => {
      if (torndown) return;
      const fatal = evt?.code != null ? FATAL_CLOSE[evt.code] : undefined;
      if (fatal) {
        note(fatal);
        setPhase('offline');
        return;
      }
      if (attempt >= RETRY_MS.length) {
        note('Shell unavailable — tap reconnect to try again.');
        setPhase('offline');
        return;
      }
      setPhase('retrying');
      timer = setTimeout(() => setAttempt((n) => n + 1), RETRY_MS[attempt]);
    };

    ws.onopen = () => {
      if (!torndown) setPhase('open');
    };
    ws.onerror = () => {
      /* `onclose` always follows — retry there, once. */
    };
    ws.onclose = onClose;
    ws.onmessage = (evt) => {
      const text = typeof evt.data === 'string' ? evt.data : '';
      setOutput((prev) => (prev + clean(text)).slice(-MAX_OUTPUT_CHARS));
    };

    return () => {
      torndown = true;
      if (timer) clearTimeout(timer);
      ws.onclose = null; // our own teardown must not schedule a retry
      ws.close();
      wsRef.current = null;
    };
  }, [tenantId, attempt, epoch]);

  const send = React.useCallback((line: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(`${line}\n`);
    setOutput((prev) => `${prev}$ ${line}\n`);
  }, []);

  /** Manual retry from the header — starts the backoff ladder over. */
  const reconnect = React.useCallback(() => {
    setPhase('connecting');
    setAttempt(0);
    setEpoch((n) => n + 1);
  }, []);

  return { output, phase, connected: phase === 'open', send, reconnect };
}
