/**
 * AI Assistant domain types — ported from Vite's
 * `Containers/Cms/AiAssistant/AiAssistant.jsx` + `Api/aiAgentAPI.js`. A
 * live WebSocket chat, not REST CRUD — see the implementation plan for why
 * there's no `use-ai-assistant.ts` React Query hooks file.
 */

export type ChatThread = {
  thread_id: string;
  title?: string;
};

export type ChatRole = 'user' | 'assistant';

export type QueryPlanStep = {
  id: string;
  tool: string;
  arguments?: Record<string, unknown>;
};

export type AiChartSpec = {
  type?: 'bar' | 'line' | 'area' | 'pie';
  title?: string;
  x?: string;
  series?: string[];
  data: Record<string, unknown>[];
};

export type ChatMessage = {
  role: ChatRole;
  content: string;
  streaming?: boolean;
  chart?: AiChartSpec | null;
};

// ── Incoming WS events ──────────────────────────────────────────────────

export type ReadyHistoryMessage = {
  role: ChatRole;
  content: string;
  query_plan?: QueryPlanStep[];
  approved?: boolean;
  chart?: AiChartSpec | null;
};

export type ReadyEvent = { event: 'ready'; history?: ReadyHistoryMessage[] };
export type TokenEvent = { event: 'token'; content: string };
export type ApprovalRequiredEvent = { event: 'approval_required'; plan?: QueryPlanStep[] };
export type FinalEvent = { event: 'final'; content?: string; chart?: AiChartSpec | null };
export type ErrorEvent = { event: 'error'; detail?: string };

export type AiAgentWsEvent = ReadyEvent | TokenEvent | ApprovalRequiredEvent | FinalEvent | ErrorEvent;

// ── Outgoing WS messages ────────────────────────────────────────────────

export type SendMessagePayload = { type: 'message'; content: string };
export type ApprovePayload = { type: 'approval'; action: 'approve' };
export type EditPlanPayload = {
  type: 'approval';
  action: 'edit';
  edited_plan: { id: string; arguments: Record<string, unknown> }[];
};
export type RejectPayload = { type: 'approval'; action: 'reject'; reason?: string };

export type AiAgentOutgoingMessage = SendMessagePayload | ApprovePayload | EditPlanPayload | RejectPayload;
