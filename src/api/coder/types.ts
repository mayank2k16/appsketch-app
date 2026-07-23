/**
 * AI Coder domain types — ported from Vite's `Containers/Builder/WebsiteBuilder/UI/CoderWorkspace`
 * (`useCoderSocket.js`, `useBuildLog.js`, `coderModels.js`) + the backend's
 * `ws/coder/<thread_id>/` protocol documented in `aiktech_backend/docs/CODER_AGENT.md`.
 * v1 (core loop) only renders a subset of this — the full union is kept so
 * phase 2 (terminal/collections/git/inspector) doesn't need a breaking type change.
 */

export type AppTypeKey = 'web' | 'mobile' | 'game';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
  streaming?: boolean;
  /** Steps the agent took to produce this message — attached once the turn
   * finishes, so a past turn keeps its own collapsed "Agent worked · N
   * steps" history instead of the feed evaporating between turns. */
  activity?: ActivityStep[];
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

export type CoderReadyHistoryMessage = { role: ChatRole; content: string };
export type CoderReadyEvent = {
  event: 'ready';
  history?: CoderReadyHistoryMessage[];
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
};
export type CoderErrorEvent = { event: 'error'; detail?: string };

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
  | CoderErrorEvent;

// ── Outgoing WS messages ─────────────────────────────────────────────────────

export type CoderSendMessagePayload = {
  type: 'message';
  content: string;
  model?: string;
  images?: string[];
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

export type CollectionField = {
  name: string;
  type: 'text' | 'richtext' | 'number' | 'boolean' | 'date' | 'url' | 'image';
  required?: boolean;
};

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
