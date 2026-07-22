import { accountClient, authenticatedClient } from '@/api/common/client';
import { buildSubdomain } from '@/api/templates';
import { useAuth } from '@/hooks/useAuth';

import type {
  AppTypeKey,
  CollectionsResponse,
  CreateCoderTenantResponse,
  FileTreeNode,
  OAuthConfig,
  OAuthRepo,
  OAuthSession,
  RecordSaveResponse,
  RepoDiffResponse,
  RepoStatus,
  VisualEditResponse,
  WebBuildStatus,
  WorkspaceFile,
} from './types';

/** Mirrors Vite's `HeroBanner.jsx` tenant-create call (`Api/tenantAPI.js` →
 * `createTenant`), but with `render_engine: 'code'` so the backend spins up
 * the AI-coder engine (`TenantWorkspace` + LangGraph agent) instead of the
 * legacy config/visual builder. Same multipart pattern as
 * `createTenantFromLayout` in `@/api/templates`. */
export async function createCoderTenant(params: {
  title: string;
  appType: AppTypeKey;
  tenantCategory?: string;
}): Promise<CreateCoderTenantResponse> {
  const { title, appType, tenantCategory = '1' } = params;
  const form = new FormData();
  form.append('title', title);
  form.append('tenant_category', tenantCategory);
  form.append('subdomain', buildSubdomain(title));
  form.append('render_engine', 'code');
  form.append('app_type', appType);

  const { data } = await accountClient.post<CreateCoderTenantResponse>(
    'account/tenants/',
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return data;
}

export async function onboardCoder(
  tenantId: number | string
): Promise<{ thread_id: string; ws_url: string }> {
  const { data } = await authenticatedClient.post(
    'api/builder/coder-onboard/',
    { tenant_id: tenantId }
  );
  return data;
}

export async function getLatestThread(
  tenantId: number | string
): Promise<{ thread_id: string | null }> {
  const { data } = await authenticatedClient.get(
    `api/builder/coder/${tenantId}/latest-thread/`
  );
  return data;
}

export async function getFile(
  tenantId: number | string,
  path: string
): Promise<WorkspaceFile> {
  const { data } = await authenticatedClient.get(
    `api/builder/coder/${tenantId}/file/`,
    { params: { path } }
  );
  return data;
}

/** Backend refuses to overwrite a non-blank file with an empty save — same
 * guard Vite's `onEditorChange` relies on (`{ok:false, skipped:"..."}`). */
export async function saveFile(
  tenantId: number | string,
  path: string,
  content: string
): Promise<{ ok: boolean; skipped?: string }> {
  const { data } = await authenticatedClient.post(
    `api/builder/coder/${tenantId}/file/`,
    { path, content }
  );
  return data;
}

export async function getTree(
  tenantId: number | string
): Promise<{ tree: FileTreeNode[] }> {
  const { data } = await authenticatedClient.get(
    `api/builder/coder/${tenantId}/tree/`
  );
  return data;
}

export type FsOp = 'create_file' | 'mkdir' | 'delete' | 'rename';

export async function fsOp(
  tenantId: number | string,
  op: FsOp,
  path: string,
  extra?: { new_path?: string; content?: string }
): Promise<{ tree: FileTreeNode[] }> {
  const { data } = await authenticatedClient.post(
    `api/builder/coder/${tenantId}/fs/`,
    { op, path, ...extra }
  );
  return data;
}

export async function getLatestBuild(
  tenantId: number | string
): Promise<WebBuildStatus | null> {
  const { data } = await authenticatedClient.get(
    `api/builder/coder/${tenantId}/latest-build/`
  );
  return data;
}

export async function triggerBuild(
  tenantId: number | string,
  params?: { threadId?: string; kind?: string }
): Promise<{ build_id: number; ws_url: string }> {
  const { data } = await authenticatedClient.post(
    `api/builder/coder/${tenantId}/build/`,
    {
      thread_id: params?.threadId,
      kind: params?.kind,
    }
  );
  return data;
}

export async function getBuildStatus(
  buildId: number | string
): Promise<WebBuildStatus> {
  const { data } = await authenticatedClient.get(
    `api/builder/coder/build/${buildId}/status/`
  );
  return data;
}

export async function getExpoUrl(
  tenantId: number | string
): Promise<{ url: string | null }> {
  const { data } = await authenticatedClient.get(
    `api/builder/coder/${tenantId}/expo-url/`
  );
  return data;
}

function wsBase(): string {
  return 'https://appsketch.ai/'.replace(/^http/, 'ws');
}

/** Auth can't ride a WS header portably in RN (same limitation as browsers),
 * so it goes in the query string — same workaround as `ai-assistant`'s
 * `buildChatWebSocketUrl` and Vite's `useCoderSocket.js`. */
export function buildCoderWsUrl(threadId: string): string {
  const token = useAuth.getState().token?.access ?? '';
  return `${wsBase()}ws/coder/${threadId}/?token=${encodeURIComponent(token)}`;
}

export function buildWebBuildWsUrl(buildId: number | string): string {
  return `${wsBase()}ws/webbuild/${buildId}/`;
}

/** Raw byte/text stream, NOT JSON — a real interactive shell on the
 * workspace's build host (ported from Vite's `Terminal.jsx`). */
export function buildTerminalWsUrl(tenantId: number | string): string {
  const token = useAuth.getState().token?.access ?? '';
  return `${wsBase()}ws/coder-terminal/${tenantId}/?token=${encodeURIComponent(token)}`;
}

/** Live dev preview for a `render_engine=code` tenant — same-origin, no
 * build step; reflects agent edits via the framework's own HMR. */
export function previewUrlForTenant(tenantUid: string): string {
  return `https://appsketch.ai/preview/${tenantUid}/`;
}

// ── Collections / CMS ────────────────────────────────────────────────────────

export async function getCollections(
  tenantId: number | string,
  params?: { collection?: string; limit?: number }
): Promise<CollectionsResponse> {
  const { data } = await authenticatedClient.get(
    `api/builder/coder/${tenantId}/collections/`,
    { params }
  );
  return data;
}

export async function setApiActive(
  tenantId: number | string,
  apiId: number | string,
  isActive: boolean
): Promise<void> {
  await authenticatedClient.patch(
    `api/builder/coder/${tenantId}/apis/${apiId}/`,
    { is_active: isActive }
  );
}

export async function createRecord(
  tenantId: number | string,
  collectionSlug: string,
  data: Record<string, unknown>
): Promise<RecordSaveResponse> {
  const { data: res } = await authenticatedClient.post(
    `api/builder/coder/${tenantId}/collections/${collectionSlug}/records/`,
    { data }
  );
  return res;
}

export async function updateRecord(
  tenantId: number | string,
  collectionSlug: string,
  recordId: number | string,
  data: Record<string, unknown>
): Promise<RecordSaveResponse> {
  const { data: res } = await authenticatedClient.patch(
    `api/builder/coder/${tenantId}/collections/${collectionSlug}/records/${recordId}/`,
    { data }
  );
  return res;
}

export async function deleteRecord(
  tenantId: number | string,
  collectionSlug: string,
  recordId: number | string
): Promise<{ ok: boolean }> {
  const { data } = await authenticatedClient.delete(
    `api/builder/coder/${tenantId}/collections/${collectionSlug}/records/${recordId}/`
  );
  return data;
}

/** Shared by the CMS image field and the Inspector's image/video replace —
 * both just need "give me a URL back for this file". */
export async function uploadAsset(
  tenantId: number | string,
  file: { uri: string; name: string; type: string }
): Promise<{ ok: boolean; url?: string }> {
  const form = new FormData();
  // React Native's FormData accepts this shape directly (uri/name/type), unlike web's File/Blob.
  form.append('file', file as unknown as Blob);
  const { data } = await authenticatedClient.post(
    `api/builder/coder/${tenantId}/upload-asset/`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return data;
}

// ── Git connect / diff / PR ──────────────────────────────────────────────────

export async function connectRepo(
  tenantId: number | string,
  params: { repoUrl: string; token?: string; provider?: string }
): Promise<{ thread_id: string; ws_url: string }> {
  const { data } = await authenticatedClient.post(
    'api/builder/coder/connect-repo/',
    {
      tenant_id: tenantId,
      repo_url: params.repoUrl,
      token: params.token,
      provider: params.provider,
    }
  );
  return data;
}

export async function getRepoStatus(
  tenantId: number | string
): Promise<RepoStatus> {
  const { data } = await authenticatedClient.get(
    `api/builder/coder/${tenantId}/repo-status/`
  );
  return data;
}

export async function getRepoDiff(
  tenantId: number | string
): Promise<RepoDiffResponse> {
  const { data } = await authenticatedClient.get(
    `api/builder/coder/${tenantId}/repo-diff/`
  );
  return data;
}

export async function openPr(
  tenantId: number | string,
  title: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const { data } = await authenticatedClient.post(
    `api/builder/coder/${tenantId}/open-pr/`,
    { title }
  );
  return data;
}

export async function getOAuthConfig(): Promise<OAuthConfig> {
  const { data } = await authenticatedClient.get(
    'api/builder/coder/oauth/config/'
  );
  return data;
}

/** Returns the provider consent URL to open in a browser (`expo-web-browser`
 * `openAuthSessionAsync`) — the callback then redirects to a page that
 * `postMessage`s the `link_id` back, same as Vite's popup-window flow. */
export function buildOAuthStartUrl(provider: string): string {
  return `https://appsketch.ai/api/builder/coder/oauth/start/?provider=${encodeURIComponent(provider)}`;
}

export async function getOAuthSession(linkId: string): Promise<OAuthSession> {
  const { data } = await authenticatedClient.get(
    'api/builder/coder/oauth/session/',
    { params: { link_id: linkId } }
  );
  return data;
}

export async function getOAuthRepos(linkId: string): Promise<OAuthRepo[]> {
  const { data } = await authenticatedClient.get(
    'api/builder/coder/oauth/repos/',
    { params: { link_id: linkId } }
  );
  return Array.isArray(data) ? data : (data?.repos ?? []);
}

// ── Visual inspector (direct, deterministic edits — no AI turn) ─────────────

export async function visualEditStyle(
  tenantId: number | string,
  selector: string,
  styles: Record<string, string>
): Promise<VisualEditResponse> {
  const { data } = await authenticatedClient.post(
    `api/builder/coder/${tenantId}/visual-edit/`,
    {
      op: 'style',
      selector,
      styles,
    }
  );
  return data;
}

export async function visualEditText(
  tenantId: number | string,
  oldText: string,
  newText: string
): Promise<VisualEditResponse> {
  const { data } = await authenticatedClient.post(
    `api/builder/coder/${tenantId}/visual-edit/`,
    {
      op: 'text',
      old: oldText,
      new: newText,
    }
  );
  return data;
}

export async function visualEditSrc(
  tenantId: number | string,
  oldSrc: string,
  newSrc: string
): Promise<VisualEditResponse> {
  const { data } = await authenticatedClient.post(
    `api/builder/coder/${tenantId}/visual-edit/`,
    {
      op: 'src',
      old: oldSrc,
      new: newSrc,
    }
  );
  return data;
}
