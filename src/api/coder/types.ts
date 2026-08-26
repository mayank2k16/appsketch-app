/**
 * AI Coder domain types — ported from Vite's `Containers/Builder/WebsiteBuilder/UI/CoderWorkspace`
 * (`useCoderSocket.js`, `useBuildLog.js`, `coderModels.js`) + the backend's
 * `ws/coder/<thread_id>/` protocol documented in `aiktech_backend/docs/CODER_AGENT.md`.
 * v1 (core loop) only renders a subset of this — the full union is kept so
 * phase 2 (terminal/collections/git/inspector) doesn't need a breaking type change.
 */

export type AppTypeKey = 'web' | 'mobile';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
  streaming?: boolean;
  /** Steps the agent took to produce this message — attached once the turn
   * finishes, so a past turn keeps its own collapsed "Agent worked · N
   * steps" history instead of the feed evaporating between turns. */
  activity?: ActivityStep[];
  /** Images the user attached to THIS prompt (data URLs). Shown as
   * thumbnails above the bubble, tap to enlarge — same as the web. */
  images?: string[];
};

export type ActivityStepKind =
  | 'node'
  | 'step'
  | 'thinking'
  | 'plan'
  | 'todos'
  | 'review';

export type TodoStatus = 'done' | 'doing' | 'todo';
export type TodoItem = { status: TodoStatus; text: string };

export type ActivityStep = {
  id: string;
  kind: ActivityStepKind;
  text: string;
  tool?: string;
  /** `plan` only. */
  summary?: string;
  steps?: string[];
  done?: string[];
  /** `todos` only — parsed `"[done|doing|todo] text"` items. */
  items?: TodoItem[];
  /** `review` only. */
  ok?: boolean;
  gaps?: string[];
  /** attached after the fact by a `tool_result` event, for a plain `step`. */
  result?: string;
  resultOk?: boolean;
  image?: string;
};

/** Live token meter for the turn in progress — billable = uncached input +
 * cached-at-25% + output (what actually counts against the plan). */
export type TokenUsage = {
  in: number;
  out: number;
  raw?: number;
  cached?: number;
};

export type FileTreeNode = {
  path: string;
  name: string;
  type: 'dir' | 'file';
  children?: FileTreeNode[];
};

export type WorkspaceFile = {
  path: string;
  content: string;
  is_binary?: boolean;
};

/**
 * Ground truth is Vite's `CoderWorkspace/ClarifyBlock.jsx`, not a guess —
 * `choice`/`checklist` options are plain strings (not `{id,label}` objects);
 * `palette`/`fonts` options are their own distinct shapes with no `id` field
 * at all. Rendering these as if every option were `{id,label}` (an earlier,
 * unverified assumption) made every option compare `undefined === undefined`
 * and render as permanently "selected" with a blank label.
 */
export type ClarifyQuestionType =
  | 'choice'
  | 'palette'
  | 'fonts'
  | 'checklist'
  | 'text';

export type ClarifyPaletteOption = {
  name: string;
  colors: string[];
  vibe?: string;
};
export type ClarifyFontOption = { name: string; heading: string; body: string };

export type ClarifyQuestion = {
  id: string;
  type: ClarifyQuestionType;
  label: string;
  /** `choice`/`checklist`: plain strings. `palette`/`fonts`: typed objects. Absent for `text`. */
  options?: string[] | ClarifyPaletteOption[] | ClarifyFontOption[];
  /** `checklist` only — budget-aware server defaults, pre-checked on open. */
  preselect?: string[];
  /** Whether to also show a free-text input alongside the options. Defaults to true. */
  allowCustom?: boolean;
};

export type ClarifyBlock = {
  kind: 'clarify';
  intro?: string;
  questions: ClarifyQuestion[];
  submitLabel?: string;
};

export type WebBuildStatusValue =
  | 'QUEUED'
  | 'PREPARING'
  | 'INSTALLING_DEPS'
  | 'BUILDING'
  | 'DEPLOYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type WebBuildStatus = {
  build_id: number;
  status: WebBuildStatusValue;
  error?: string | null;
  errors?: unknown[];
  log?: string;
  preview_url?: string | null;
  bundle_path?: string | null;
};

// ── Incoming WS events (ws/coder/<thread_id>/) ──────────────────────────────

export type CoderReadyHistoryMessage = {
  role: ChatRole;
  content: string;
  /** Images the USER attached to this prompt. */
  images?: string[];
  /** The assistant turn's persisted step list — the same shape the live
   * stream builds, minus the client-assigned `id`. Replayed so a reload
   * restores each turn's activity (and the screenshots in it). */
  activity?: Omit<ActivityStep, 'id'>[];
};
/** One row of `builder/agent/coder/runs.py`'s `serialize()` — a turn that was
 * already in flight when this socket connected (see `runs.live_runs`). This
 * is what a reconnect (tab refresh, or the app reopening after being closed
 * mid-run) replays from instead of showing an empty chat. */
export type CoderLiveRun = {
  run_id: number;
  status: string;
  mode: 'foreground' | 'background';
  kind: 'turn' | 'subagent';
  label?: string;
  question?: string;
  model?: string;
  effort?: string;
  activity?: Record<string, unknown>[];
  answer?: string;
  error?: string;
  built?: boolean;
  parent_id?: number | null;
  created_at?: string | null;
};
export type CoderReadyEvent = {
  event: 'ready';
  history?: CoderReadyHistoryMessage[];
  /** The agent-written name for this project — see the backend's `title.py`. */
  title?: string;
  /** In-flight turns to re-attach to — this is what makes a mid-build
   * reconnect resume the live turn instead of losing it. */
  live_runs?: CoderLiveRun[];
};
export type CoderTokenEvent = { event: 'token'; content: string };
export type CoderNodeEvent = {
  event: 'node';
  id?: string;
  label: string;
  status?: string;
};
export type CoderStepEvent = { event: 'step'; text: string; tool?: string };
export type CoderThinkingEvent = { event: 'thinking'; text: string };
export type CoderToolCallEvent = { event: 'tool_call' };
export type CoderPlanEvent = {
  event: 'plan';
  summary?: string;
  steps?: string[];
  done?: string[];
};
export type CoderTodosEvent = { event: 'todos'; items?: string[] };
export type CoderReviewEvent = {
  event: 'review';
  ok: boolean;
  gaps?: string[];
  summary?: string;
};
export type CoderToolResultEvent = {
  event: 'tool_result';
  tool: string;
  detail?: string;
  ok?: boolean;
  image?: string;
};
export type CoderUsageEvent = {
  event: 'usage';
  tokens_in?: number;
  tokens_out?: number;
  billable?: number;
  cached?: number;
};
export type CoderFileWriteEvent = {
  event: 'file_write';
  path: string;
  content: string;
  mode: 'write' | 'edit' | 'delete';
  old?: string;
  new?: string;
};
export type CoderUiBlockEvent = {
  event: 'ui_block';
  block: ClarifyBlock | Record<string, unknown>;
};
export type CoderApprovalRequestEvent = {
  event: 'approval_request';
  id: string;
  command: string;
  reason?: string;
};
export type CoderApprovalResultEvent = {
  event: 'approval_result';
  id: string;
  approved: boolean;
};
export type CoderBuildStartedEvent = {
  event: 'build_started';
  build_id: number;
};
export type CoderBuildDoneEvent = {
  event: 'build_done';
  build_id: number;
  ok: boolean;
  preview_url?: string;
  errors?: unknown[];
};
export type CoderFinalEvent = {
  event: 'final';
  content?: string;
  tree?: FileTreeNode[];
  /** 'done' | 'cancelled' | 'error' — a stopped turn must not be treated as a
   * finished, previewable build. */
  status?: string;
  /** A file actually changed this turn — a pure-chat reply has nothing new
   * to preview. */
  built?: boolean;
  /** 'chat' | 'build' — mirrors `status`'s "was this even a build" question
   * from the intent the graph classified, not the outcome. */
  intent?: string;
  /** This turn was a /compact pass, not a build. */
  compacted?: boolean;
};
export type CoderErrorEvent = { event: 'error'; detail?: string };
/** Plan's token quota for this billing period is used up — mirrors
 * `builder/agent/coder/quota.py`'s `check()` (see `CoderQuota`). Sent instead
 * of a normal turn when `check().allowed` is false. */
export type CoderQuotaExceededEvent = {
  event: 'quota_exceeded';
  used?: number;
  limit?: number;
  tier?: string;
  free?: boolean;
  upgrade?: boolean;
  detail?: string;
};
/** How long the backend expects this turn to take. Re-emitted mid-run as the
 * forecast is corrected against measured pace, so treat each one as the new
 * truth rather than accumulating them. */
export type CoderEtaEvent = { event: 'eta'; seconds?: number; live?: boolean };
/** The agent finished naming this project (or a user renamed it elsewhere). */
export type CoderTitleEvent = { event: 'title'; title?: string };
/** Plan doesn't allow another detached run. */
export type CoderBackgroundLimitEvent = {
  event: 'background_limit';
  used?: number;
  limit?: number;
  upgrade?: boolean;
  detail?: string;
};

export type CoderWsEvent =
  | CoderReadyEvent
  | CoderTokenEvent
  | CoderNodeEvent
  | CoderStepEvent
  | CoderThinkingEvent
  | CoderToolCallEvent
  | CoderPlanEvent
  | CoderTodosEvent
  | CoderReviewEvent
  | CoderToolResultEvent
  | CoderUsageEvent
  | CoderFileWriteEvent
  | CoderUiBlockEvent
  | CoderApprovalRequestEvent
  | CoderApprovalResultEvent
  | CoderBuildStartedEvent
  | CoderBuildDoneEvent
  | CoderFinalEvent
  | CoderEtaEvent
  | CoderTitleEvent
  | CoderBackgroundLimitEvent
  | CoderQuotaExceededEvent
  | CoderErrorEvent;

// ── Outgoing WS messages ─────────────────────────────────────────────────────

export type CoderSendMessagePayload = {
  type: 'message';
  content: string;
  model?: string;
  images?: string[];
  /** Detach the turn: it survives leaving the screen and pushes a
   * notification when it lands. Subject to per-plan slots. */
  background?: boolean;
};
export type CoderInteractionPayload = {
  type: 'interaction';
  value: Record<string, unknown>;
};
export type CoderApprovalPayload = {
  type: 'approval';
  value: Record<string, unknown>;
};

export type CoderOutgoingMessage =
  | CoderSendMessagePayload
  | CoderInteractionPayload
  | CoderApprovalPayload;

// ── Incoming WS events (ws/webbuild/<build_id>/) ────────────────────────────

export type WebBuildLogEvent = { event: 'log'; line: string };
export type WebBuildLogBatchEvent = { event: 'log_batch'; lines: string[] };
export type WebBuildStatusEvent = {
  event: 'status';
  status: WebBuildStatusValue;
  preview_url?: string | null;
};
export type WebBuildErrorsEvent = { event: 'errors'; errors: unknown[] };

export type WebBuildWsEvent =
  | WebBuildLogEvent
  | WebBuildLogBatchEvent
  | WebBuildStatusEvent
  | WebBuildErrorsEvent;

/** Response shape from `POST account/tenants/` (only the fields we use). */
export type CreateCoderTenantResponse = {
  id: number;
  uuid: string;
  render_engine?: string;
  app_type?: string;
  [key: string]: unknown;
};

// ── Collections / CMS (phase 2) ─────────────────────────────────────────────

/** The full set the engine validates against — `FIELD_TYPES` in
 * `builder/agent/dynamic/engine.py`. This used to list only the seven the app
 * happened to render, so `email`, `select` and `reference` fields silently fell
 * through to a plain text box: a foreign key was a number you had to know by
 * heart. */
export type CollectionFieldType =
  | 'text'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'date'
  | 'url'
  | 'image'
  | 'email'
  | 'select'
  | 'reference';

export type CollectionField = {
  name: string;
  type: CollectionFieldType;
  required?: boolean;
  /** Human label, when the schema carries one. Falls back to `name`. */
  label?: string;
  /** `select` only — the allowed values. */
  options?: string[];
  /** `reference` only — target collection slug. */
  collection?: string;
  /** `reference` only — which field of the target to show as the label. */
  display?: string;
};

/** One row of a `reference` picker: the target record's id and its label. */
export type CollectionOption = { id: number | string; label: string };

export type CollectionApi = {
  id: number | string;
  source?: 'collection' | 'sql';
  name: string;
  method: string;
  endpoint?: string;
  slug?: string;
  auth?: string;
  is_active: boolean;
};

export type CollectionRecord = {
  id: number | string;
  data: Record<string, unknown>;
  created_at?: string;
  /** `{field: label}` for this row's `reference` fields, resolved server-side
   * in one batched query (`_resolve_references` in coder/api.py). A table cell
   * showing "17" instead of "Anna Roy" is not a CMS. */
  _refs?: Record<string, string>;
};

export type Collection = {
  slug: string;
  name: string;
  description?: string;
  record_count: number;
  fields: CollectionField[];
  apis?: CollectionApi[];
  records?: CollectionRecord[];
};

export type CollectionsResponse = {
  collections: Collection[];
  sql_apis: CollectionApi[];
  totals: { collections: number; apis: number; records: number };
};

export type RecordSaveResponse = {
  ok: boolean;
  record?: CollectionRecord;
  error?: string;
};

// ── Git connect / diff / PR (phase 2) ───────────────────────────────────────

export type RepoStatus = {
  kind?: 'generated' | 'cloned';
  status?: string;
  origin_url?: string;
  working_branch?: string;
  default_branch?: string;
  previewable?: boolean;
  preview_reason?: string;
  last_pr_url?: string;
};

export type RepoChangedFile = { path: string; status: string };

export type RepoDiffResponse = {
  diff: string;
  status?: { files: RepoChangedFile[] };
};

export type OAuthConfig = { providers: Record<string, boolean> };
export type OAuthSession = {
  status: 'pending' | 'linked' | 'error';
  login?: string;
  provider?: string;
};
export type OAuthRepo = {
  id: number | string;
  full_name: string;
  private?: boolean;
  clone_url?: string;
};

// ── Visual inspector (phase 2) ──────────────────────────────────────────────

export type VisualEditResponse = { ok: boolean; reason?: string };

// ── Model quota / paywall ────────────────────────────────────────────────────

/** Mirrors `builder/agent/coder/quota.py`'s `check()` — same shape the
 * workspace socket sends on `ready`/`final`, fetched over plain HTTP here so
 * the model picker can lock paid models BEFORE a chat session exists. */
export type CoderQuota = {
  allowed: boolean;
  used: number;
  limit: number;
  tier: string;
  free: boolean;
  root: boolean;
  remaining: number;
  upgrade: boolean;
  /** Model ids this caller may run, default first. */
  models: string[];
  free_model: boolean;
};
