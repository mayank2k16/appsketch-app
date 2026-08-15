import * as React from 'react';

import type {
  ActivityStep,
  ChatMessage,
  ClarifyBlock,
  CoderWsEvent,
  FileTreeNode,
  TodoItem,
  TokenUsage,
} from '@/api/coder';
import {
  buildCoderWsUrl,
  deleteThread as deleteThreadApi,
  fsOp as fsOpApi,
  getLatestThread,
  getTree,
  onboardCoder,
  renameThread as renameThreadApi,
} from '@/api/coder';
import { getItem, setItem } from '@/lib/storage';

function threadStorageKey(tenantId: string) {
  return `coder:threadId:${tenantId}`;
}

/** Backend sends todos as `"[done|doing|todo] text"` strings — parsed here
 * rather than server-side so a malformed line still renders as a plain
 * "todo" item instead of dropping the row. */
function parseTodoItem(raw: string): TodoItem {
  const m = /^\[(done|doing|todo)\]\s*(.*)$/i.exec(raw.trim());
  return m
    ? { status: m[1].toLowerCase() as TodoItem['status'], text: m[2] }
    : { status: 'todo', text: raw };
}

/** The checklist is a LIVE view — update the existing row in place rather
 * than appending a new one each time `update_todos` fires. */
function upsertTodosRow(
  prev: ActivityStep[],
  items: TodoItem[],
  nextId: () => string
): ActivityStep[] {
  const i = prev.map((x) => x.kind).lastIndexOf('todos');
  const row: ActivityStep = {
    id: i >= 0 ? prev[i].id : nextId(),
    kind: 'todos',
    text: 'Build checklist',
    items,
  };
  if (i < 0) return [...prev, row];
  const copy = [...prev];
  copy[i] = row;
  return copy;
}

/** Streamed assistant tokens append onto an in-progress streaming bubble,
 * or start a new one — same merge rule the `final` event uses to close it. */
function appendStreamingToken(
  prev: ChatMessage[],
  text: string
): ChatMessage[] {
  const last = prev[prev.length - 1];
  if (last && last.role === 'assistant' && last.streaming) {
    const copy = [...prev];
    copy[copy.length - 1] = { ...last, content: last.content + text };
    return copy;
  }
  return [...prev, { role: 'assistant', content: text, streaming: true }];
}

/** Closes out the turn: finalizes a streaming bubble in place, or appends a
 * fresh one, attaching this turn's captured activity either way. */
function finalizeMessages(
  prev: ChatMessage[],
  content: string | undefined,
  acts: ActivityStep[]
): ChatMessage[] {
  const last = prev[prev.length - 1];
  if (last && last.role === 'assistant' && last.streaming) {
    const copy = [...prev];
    copy[copy.length - 1] = {
      ...last,
      content: content || last.content,
      streaming: false,
      activity: acts.length ? acts : last.activity,
    };
    return copy;
  }
  if (!content) return prev;
  return [
    ...prev,
    { role: 'assistant', content, activity: acts.length ? acts : undefined },
  ];
}

/** Attach a non-file tool's captured output to its most recent step (the
 * first one matching `tool` that doesn't already have a result), turning
 * that row into an expandable result accordion. */
function attachToolResult(
  prev: ActivityStep[],
  tool: string,
  patch: { result?: string; resultOk?: boolean; image?: string }
): ActivityStep[] {
  let i = -1;
  for (let idx = prev.length - 1; idx >= 0; idx--) {
    const it = prev[idx];
    if (it.kind === 'step' && it.tool === tool && it.result === undefined) {
      i = idx;
      break;
    }
  }
  if (i < 0) return prev;
  const copy = [...prev];
  copy[i] = { ...copy[i], ...patch };
  return copy;
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
  // Seeded eagerly from the route param (not waiting on onboard/socket) so
  // the user's own prompt shows as sent the instant this screen mounts,
  // instead of sitting blank through the ~2s onboard round-trip.
  const [messages, setMessages] = React.useState<ChatMessage[]>(() =>
    params.userPrompt
      ? [{ role: 'user', content: params.userPrompt }]
      : []
  );
  const [activity, setActivity] = React.useState<ActivityStep[]>([]);
  const [tokens, setTokens] = React.useState<TokenUsage>({ in: 0, out: 0 });
  const [clarifyBlock, setClarifyBlock] = React.useState<ClarifyBlock | null>(
    null
  );
  // Answers stay attached to `clarifyBlock` (rather than clearing it) once
  // submitted, so the same card freezes in place showing what was picked
  // instead of vanishing from the chat.
  const [clarifyAnswers, setClarifyAnswers] = React.useState<Record<
    string,
    string
  > | null>(null);
  const [approvalRequest, setApprovalRequest] =
    React.useState<PendingApproval | null>(null);
  const [fileTree, setFileTree] = React.useState<FileTreeNode[]>([]);
  const [openFiles, setOpenFiles] = React.useState<Record<string, string>>({});
  const [lastBuildId, setLastBuildId] = React.useState<number | null>(null);
  // The agent's name for this project, shown as the chat's heading. Arrives on
  // `ready` (so a reconnect keeps it) and again as its own `title` frame the
  // moment the namer finishes on the first turn.
  const [title, setTitle] = React.useState('');
  // The turn's forecast, as {seconds, at}: the backend re-forecasts mid-run
  // from measured pace, so `at` is when THIS number arrived and the countdown
  // is derived from it. Null between turns.
  const [eta, setEta] = React.useState<{ seconds: number; at: number } | null>(
    null
  );
  // True while the live turn was launched detached — it keeps running if the
  // user leaves, and pushes a notification when it lands.
  const [backgroundRun, setBackgroundRun] = React.useState(false);
  // Bumped once per turn that finished with a PASSING build — the trigger the
  // screen watches to jump to the Preview tab. A counter rather than a
  // boolean so two builds in a row (each landing on an already-clean state)
  // both re-trigger the navigation instead of the second being a no-op.
  const [previewReady, setPreviewReady] = React.useState(0);

  const wsRef = React.useRef<WebSocket | null>(null);
  const hasSentInitialPromptRef = React.useRef(false);
  const activityIdRef = React.useRef(0);
  const nextActivityId = () => `a-${(activityIdRef.current += 1)}`;
  // The agent's own last "verify"/"build" node result for the turn in
  // progress — true once it reports 'done', false on 'error', null while
  // unknown/running. This is what gates the jump to Preview below: the
  // agent's own verification result, not a client-side guess (a fixed delay,
  // or "a file changed so it must be fine") — so a broken build is never
  // shown as if it were the finished site.
  const verifyOkRef = React.useRef<boolean | null>(null);
  // Mirrors `activity` state so the `final` handler (in a `useCallback` that
  // can't list `activity` as a dep without tearing down and reconnecting the
  // socket on every step) can read the turn's steps synchronously to attach
  // them to the finished message.
  const activityRef = React.useRef<ActivityStep[]>([]);
  React.useEffect(() => {
    activityRef.current = activity;
  }, [activity]);

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
        case 'ready': {
          // Keep any optimistic message already shown (e.g. the initial
          // prompt sent from `ws.onopen`, before the server's own `ready`
          // arrives) when server history is still empty — otherwise this
          // unconditionally overwrites `messages`, and if `ready` lands
          // after our optimistic `send()` but before the server has
          // processed that message, it wipes the just-sent bubble out.
          const history = msg.history ?? [];
          if (history.length > 0) {
            setMessages(
              history.map((m) => ({ role: m.role, content: m.content }))
            );
          }
          // "New site" is the server-side placeholder for a project the agent
          // has not named yet — showing it as a heading would be worse than
          // showing nothing, so treat it as absent.
          if (msg.title && msg.title !== 'New site') setTitle(msg.title);

          // Re-attach to a turn that was ALREADY in flight when this socket
          // opened — the mobile twin of the web workspace's REPLAY_RUNS. The
          // server replayed the durable run row (see `runs.py`), so closing
          // the app mid-build and reopening it rebuilds the live turn here
          // instead of showing an idle composer while the agent keeps working
          // on the server.
          const live = msg.live_runs ?? [];
          const fg = live.find((r) => r.mode === 'foreground');
          const anyBackground = live.some((r) => r.mode === 'background');
          if (fg) {
            setBusy(true);
            setBackgroundRun(anyBackground);
            const acts = (fg.activity ?? []).slice(-80);
            const etaItem = acts.find((a) => a.kind === 'eta') as
              | { seconds?: number }
              | undefined;
            const began = fg.created_at ? Date.parse(fg.created_at) : NaN;
            setEta(
              etaItem?.seconds
                ? {
                    seconds: etaItem.seconds,
                    at: Number.isNaN(began) ? Date.now() : began,
                  }
                : null
            );
            setActivity(
              acts
                .filter((a) => a.kind !== 'eta')
                .map((a) => ({ ...a, id: nextActivityId() }) as ActivityStep)
            );
            // A partial answer was already streaming when we dropped — show
            // what the agent had produced so far instead of an empty bubble.
            if ((fg.answer || '').trim()) {
              setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: fg.answer || '', streaming: true },
              ]);
            }
          } else if (anyBackground) {
            setBackgroundRun(true);
          }

          void refreshTree();
          break;
        }

        case 'title':
          if (msg.title) setTitle(msg.title);
          break;

        case 'eta': {
          const secs = msg.seconds || 0;
          if (secs > 0) setEta({ seconds: secs, at: Date.now() });
          break;
        }

        case 'background_limit':
          // The turn was NOT started, so nothing is running detached.
          setBackgroundRun(false);
          setBusy(false);
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content:
                msg.detail ||
                "You've hit your plan's limit for background tasks.",
            },
          ]);
          break;

        case 'token':
          setBusy(true);
          setMessages((prev) => appendStreamingToken(prev, msg.content));
          break;

        case 'node':
          // `msg.id` is the raw node name (see `stream.node_step`) —
          // "verify"/"build" are the ones that actually attest the site
          // works. A "running" status leaves the last known result alone
          // (still repairing, verdict not in yet); any OTHER node ("plan",
          // "review", …) is not a verification signal and must not touch it.
          if (msg.id === 'verify' || msg.id === 'build') {
            if (msg.status === 'done') verifyOkRef.current = true;
            else if (msg.status === 'error') verifyOkRef.current = false;
          }
          setActivity((prev) => [
            ...prev,
            { id: nextActivityId(), kind: 'node', text: msg.label },
          ]);
          break;

        case 'step':
          setBusy(true);
          setActivity((prev) => [
            ...prev,
            {
              id: nextActivityId(),
              kind: 'step',
              text: msg.text,
              tool: msg.tool,
            },
          ]);
          break;

        case 'thinking':
          setActivity((prev) => [
            ...prev,
            { id: nextActivityId(), kind: 'thinking', text: msg.text },
          ]);
          break;

        case 'plan':
          setActivity((prev) => [
            ...prev,
            {
              id: nextActivityId(),
              kind: 'plan',
              text: msg.summary || 'Build plan',
              summary: msg.summary,
              steps: msg.steps ?? [],
              done: msg.done ?? [],
            },
          ]);
          break;

        case 'todos': {
          const items = (msg.items ?? []).map(parseTodoItem);
          setActivity((prev) => upsertTodosRow(prev, items, nextActivityId));
          break;
        }

        case 'review':
          setActivity((prev) => [
            ...prev,
            {
              id: nextActivityId(),
              kind: 'review',
              text: msg.summary || (msg.ok ? 'Looks complete' : 'Gaps found'),
              ok: msg.ok,
              gaps: msg.gaps ?? [],
            },
          ]);
          break;

        case 'tool_result':
          setActivity((prev) =>
            attachToolResult(prev, msg.tool, {
              result: msg.detail,
              resultOk: msg.ok,
              image: msg.image,
            })
          );
          break;

        case 'usage': {
          const rawOut = msg.tokens_out || 0;
          const billable = msg.billable || (msg.tokens_in || 0) + rawOut;
          setTokens({
            in: Math.max(0, billable - rawOut),
            out: rawOut,
            raw: msg.tokens_in || 0,
            cached: msg.cached || 0,
          });
          break;
        }

        case 'file_write':
          setOpenFiles((prev) => ({
            ...prev,
            [msg.path]: msg.mode === 'delete' ? '' : msg.content,
          }));
          void refreshTree();
          break;

        case 'ui_block':
          setBusy(false);
          if ((msg.block as ClarifyBlock)?.kind === 'clarify') {
            setClarifyBlock(msg.block as ClarifyBlock);
            setClarifyAnswers(null);
          }
          break;

        case 'approval_request':
          setApprovalRequest({
            id: msg.id,
            command: msg.command,
            reason: msg.reason,
          });
          break;

        case 'approval_result':
          setApprovalRequest((prev) => (prev?.id === msg.id ? null : prev));
          break;

        case 'build_started':
          setLastBuildId(msg.build_id);
          break;

        case 'build_done':
          setLastBuildId(msg.build_id);
          // `preview_url` can still be set on a FAILED build (the site's last
          // good deploy) — only a PASSING one earns the jump to Preview, or a
          // broken build would get shown as if it were the finished site.
          if (msg.ok !== false) setPreviewReady((n) => n + 1);
          void refreshTree();
          break;

        case 'final': {
          setBusy(false);
          setClarifyBlock(null);
          setEta(null);
          setBackgroundRun(false);
          const acts = activityRef.current;
          setMessages((prev) => finalizeMessages(prev, msg.content, acts));
          setActivity([]);
          if (msg.tree) setFileTree(msg.tree);
          else void refreshTree();

          // Never hand the user a broken preview. A stopped/compact/pure-chat
          // turn has nothing new to show; `verifyOkRef` is the agent's own
          // last "verify"/"build" node result for this turn (see the 'node'
          // case above) — the same signal it used to decide whether to keep
          // repairing. `null` means no verify signal fired this turn (an
          // older server, or a flow that skips it) — fall back to the
          // built-only check rather than never switching.
          const worthPreviewing =
            msg.status !== 'cancelled' &&
            !msg.compacted &&
            msg.intent !== 'chat' &&
            msg.built !== false;
          if (worthPreviewing && verifyOkRef.current !== false) {
            setPreviewReady((n) => n + 1);
          }
          verifyOkRef.current = null;
          break;
        }

        case 'error':
          setBusy(false);
          setEta(null);
          setBackgroundRun(false);
          verifyOkRef.current = null;
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: msg.detail || 'Something went wrong.',
            },
          ]);
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
  const send = React.useCallback(
    (
      content: string,
      opts?: { model?: string; images?: string[]; background?: boolean }
    ) => {
      if (!wsRef.current || !content.trim()) return;
      setMessages((prev) => [...prev, { role: 'user', content }]);
      setBusy(true);
      setTokens({ in: 0, out: 0 });
      // A stale forecast from the previous turn must not tick down under the
      // new one — the backend sends a fresh `eta` within the first few steps.
      setEta(null);
      setBackgroundRun(!!opts?.background);
      wsRef.current.send(
        JSON.stringify({
          type: 'message',
          content,
          model: opts?.model,
          images: opts?.images,
          background: opts?.background || undefined,
        })
      );
    },
    []
  );

  // ── websocket lifecycle ──────────────────────────────────────────────────
  React.useEffect(() => {
    if (!threadId) return undefined;

    const ws = new WebSocket(buildCoderWsUrl(threadId));
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // The prompt bubble itself was already seeded into `messages` at mount
      // (see the `useState` initializer above) — this only needs to push it
      // over the wire and flip into the "agent is working" state, not add
      // a second copy of the message.
      if (params.userPrompt && !hasSentInitialPromptRef.current) {
        hasSentInitialPromptRef.current = true;
        setBusy(true);
        setTokens({ in: 0, out: 0 });
        ws.send(
          JSON.stringify({
            type: 'message',
            content: params.userPrompt,
            model: params.model,
            images: params.images,
          })
        );
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

  const answerClarify = React.useCallback((value: Record<string, string>) => {
    if (!wsRef.current) return;
    setClarifyAnswers(value);
    setBusy(true);
    wsRef.current.send(JSON.stringify({ type: 'interaction', value }));
  }, []);

  const setOpenFileContent = React.useCallback(
    (path: string, content: string) => {
      setOpenFiles((prev) => ({ ...prev, [path]: content }));
    },
    []
  );

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
      const res = await fsOpApi(tenantId, 'rename', path, {
        new_path: newPath,
      });
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

  /** Rename this conversation. Optimistic: the heading is the whole point of
   * the interaction, so it updates immediately and reverts if the PATCH
   * fails. The server also broadcasts `title`, which keeps other devices and
   * the web workspace in step. */
  const rename = React.useCallback(
    async (next: string) => {
      const name = next.trim();
      if (!threadId || !name) return;
      const previous = title;
      setTitle(name);
      try {
        await renameThreadApi(threadId, name);
      } catch {
        setTitle(previous);
        throw new Error('rename failed');
      }
    },
    [threadId, title]
  );

  const remove = React.useCallback(async () => {
    if (!threadId) return;
    await deleteThreadApi(threadId);
    // The pointer must go too, or the next visit resumes a thread the server
    // no longer has and the workspace opens on an empty socket.
    void setItem(threadStorageKey(tenantId), '');
  }, [threadId, tenantId]);

  return {
    connected,
    busy,
    threadId,
    title,
    eta,
    backgroundRun,
    previewReady,
    messages,
    activity,
    tokens,
    clarifyBlock,
    clarifyAnswers,
    approvalRequest,
    fileTree,
    openFiles,
    lastBuildId,
    send,
    rename,
    remove,
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
