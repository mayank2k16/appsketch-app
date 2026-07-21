import * as React from 'react';

import {
  buildCoderWsUrl,
  fsOp as fsOpApi,
  getLatestThread,
  getTree,
  onboardCoder,
} from '@/api/coder';
import type {
  ActivityStep,
  ChatMessage,
  ClarifyBlock,
  CoderWsEvent,
  FileTreeNode,
} from '@/api/coder';
import { getItem, setItem } from '@/lib/storage';

function threadStorageKey(tenantId: string) {
  return `coder:threadId:${tenantId}`;
}

export type CoderSocketParams = {
  tenantId: string;
  userPrompt?: string;
  model?: string;
  images?: string[];
};

export type PendingApproval = { id: string; command: string; reason?: string };

/**
 * Owns the single `ws/coder/<thread_id>/` connection for a tenant's coding
 * session — ported from Vite's `useCoderSocket.js`. Instantiated once inside
 * `CodeEditorProvider` (not per-tab), so switching between the Chat/Code/
 * Preview tabs never reconnects it or loses in-flight state.
 */
export function useCoderSocket(params: CoderSocketParams) {
  const { tenantId } = params;

  const [connected, setConnected] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [threadId, setThreadId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [activity, setActivity] = React.useState<ActivityStep[]>([]);
  const [clarifyBlock, setClarifyBlock] = React.useState<ClarifyBlock | null>(null);
  const [approvalRequest, setApprovalRequest] = React.useState<PendingApproval | null>(null);
  const [fileTree, setFileTree] = React.useState<FileTreeNode[]>([]);
  const [openFiles, setOpenFiles] = React.useState<Record<string, string>>({});
  const [lastBuildId, setLastBuildId] = React.useState<number | null>(null);

  const wsRef = React.useRef<WebSocket | null>(null);
  const hasSentInitialPromptRef = React.useRef(false);
  const activityIdRef = React.useRef(0);
  const nextActivityId = () => `a-${(activityIdRef.current += 1)}`;

  const refreshTree = React.useCallback(async () => {
    try {
      const res = await getTree(tenantId);
      setFileTree(res.tree ?? []);
    } catch {
      // silent — file tree just stays stale, chat still works
    }
  }, [tenantId]);

  const handleEvent = React.useCallback(
    (msg: CoderWsEvent) => {
      switch (msg.event) {
        case 'ready':
          setMessages((msg.history ?? []).map((m) => ({ role: m.role, content: m.content })));
          void refreshTree();
          break;

        case 'token':
          setBusy(true);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && last.streaming) {
              const copy = [...prev];
              copy[copy.length - 1] = { ...last, content: last.content + msg.content };
              return copy;
            }
            return [...prev, { role: 'assistant', content: msg.content, streaming: true }];
          });
          break;

        case 'node':
          setActivity((prev) => [...prev, { id: nextActivityId(), kind: 'node', text: msg.label }]);
          break;

        case 'step':
          setBusy(true);
          setActivity((prev) => [...prev, { id: nextActivityId(), kind: 'step', text: msg.text, tool: msg.tool }]);
          break;

        case 'thinking':
          setActivity((prev) => [...prev, { id: nextActivityId(), kind: 'thinking', text: msg.text }]);
          break;

        case 'file_write':
          setOpenFiles((prev) => ({ ...prev, [msg.path]: msg.mode === 'delete' ? '' : msg.content }));
          void refreshTree();
          break;

        case 'ui_block':
          setBusy(false);
          if ((msg.block as ClarifyBlock)?.kind === 'clarify') {
            setClarifyBlock(msg.block as ClarifyBlock);
          }
          break;

        case 'approval_request':
          setApprovalRequest({ id: msg.id, command: msg.command, reason: msg.reason });
          break;

        case 'approval_result':
          setApprovalRequest((prev) => (prev?.id === msg.id ? null : prev));
          break;

        case 'build_started':
          setLastBuildId(msg.build_id);
          break;

        case 'build_done':
          setLastBuildId(msg.build_id);
          void refreshTree();
          break;

        case 'final':
          setBusy(false);
          setClarifyBlock(null);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && last.streaming) {
              const copy = [...prev];
              copy[copy.length - 1] = { ...last, content: msg.content || last.content, streaming: false };
              return copy;
            }
            return msg.content ? [...prev, { role: 'assistant', content: msg.content }] : prev;
          });
          if (msg.tree) setFileTree(msg.tree);
          else void refreshTree();
          break;

        case 'error':
          setBusy(false);
          setMessages((prev) => [...prev, { role: 'assistant', content: msg.detail || 'Something went wrong.' }]);
          break;

        default:
          break;
      }
    },
    [refreshTree]
  );

  // ── bootstrap: resume the tenant's latest thread, else onboard a fresh one ──
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const cachedThreadId = getItem<string>(threadStorageKey(tenantId));
      try {
        const latest = await getLatestThread(tenantId);
        if (cancelled) return;
        if (latest?.thread_id) {
          setThreadId(latest.thread_id);
          void setItem(threadStorageKey(tenantId), latest.thread_id);
          return;
        }
      } catch {
        // fall through to cached/onboard
      }
      if (cachedThreadId) {
        if (!cancelled) setThreadId(cachedThreadId);
        return;
      }
      try {
        const onboarded = await onboardCoder(tenantId);
        if (cancelled) return;
        setThreadId(onboarded.thread_id);
        void setItem(threadStorageKey(tenantId), onboarded.thread_id);
      } catch {
        // leave threadId null — connection effect below just won't run
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  // Stable across renders (empty dep array — only closes over the `wsRef`
  // ref and `useState` setters, both of which are themselves stable) so
  // consumers that pass this down as a prop never see it change identity.
  // That matters concretely: `@rivascva/react-native-code-editor` has an
  // internal `useEffect(() => onChange(value), [onChange, value])` — handing
  // it a freshly-recreated function every render would refire that effect
  // on every render, which (since our `onChange` also triggers a state
  // update) becomes an infinite render loop ("Maximum update depth
  // exceeded"). Every function returned from this hook is memoized for the
  // same reason.
  const send = React.useCallback((content: string, opts?: { model?: string; images?: string[] }) => {
    if (!wsRef.current || !content.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setBusy(true);
    wsRef.current.send(JSON.stringify({ type: 'message', content, model: opts?.model, images: opts?.images }));
  }, []);

  // ── websocket lifecycle ──────────────────────────────────────────────────
  React.useEffect(() => {
    if (!threadId) return undefined;

    const ws = new WebSocket(buildCoderWsUrl(threadId));
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      if (params.userPrompt && !hasSentInitialPromptRef.current) {
        hasSentInitialPromptRef.current = true;
        send(params.userPrompt, { model: params.model, images: params.images });
      }
    };
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (evt) => {
      try {
        handleEvent(JSON.parse(evt.data as string));
      } catch {
        // ignore malformed frames
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, handleEvent]);

  const answerClarify = React.useCallback((value: Record<string, unknown>) => {
    if (!wsRef.current) return;
    setClarifyBlock(null);
    setBusy(true);
    wsRef.current.send(JSON.stringify({ type: 'interaction', value }));
  }, []);

  const setOpenFileContent = React.useCallback((path: string, content: string) => {
    setOpenFiles((prev) => ({ ...prev, [path]: content }));
  }, []);

  const createFile = React.useCallback(
    async (path: string) => {
      const res = await fsOpApi(tenantId, 'create_file', path);
      setFileTree(res.tree ?? []);
    },
    [tenantId]
  );
  const createFolder = React.useCallback(
    async (path: string) => {
      const res = await fsOpApi(tenantId, 'mkdir', path);
      setFileTree(res.tree ?? []);
    },
    [tenantId]
  );
  const renamePath = React.useCallback(
    async (path: string, newPath: string) => {
      const res = await fsOpApi(tenantId, 'rename', path, { new_path: newPath });
      setFileTree(res.tree ?? []);
    },
    [tenantId]
  );
  const deletePath = React.useCallback(
    async (path: string) => {
      const res = await fsOpApi(tenantId, 'delete', path);
      setFileTree(res.tree ?? []);
    },
    [tenantId]
  );

  return {
    connected,
    busy,
    threadId,
    messages,
    activity,
    clarifyBlock,
    approvalRequest,
    fileTree,
    openFiles,
    lastBuildId,
    send,
    answerClarify,
    setOpenFileContent,
    createFile,
    createFolder,
    renamePath,
    deletePath,
    refreshTree,
  };
}

export type CoderSocketState = ReturnType<typeof useCoderSocket>;
