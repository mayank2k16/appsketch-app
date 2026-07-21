import { accountClient, authenticatedClient } from '@/api/common/client';
import { buildSubdomain } from '@/api/templates';
import { useAuth } from '@/hooks/useAuth';

import type {
  AppTypeKey,
  CreateCoderTenantResponse,
  FileTreeNode,
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

  const { data } = await accountClient.post<CreateCoderTenantResponse>('account/tenants/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function onboardCoder(tenantId: number | string): Promise<{ thread_id: string; ws_url: string }> {
  const { data } = await authenticatedClient.post('api/builder/coder-onboard/', { tenant_id: tenantId });
  return data;
}

export async function getLatestThread(tenantId: number | string): Promise<{ thread_id: string | null }> {
  const { data } = await authenticatedClient.get(`api/builder/coder/${tenantId}/latest-thread/`);
  return data;
}

export async function getFile(tenantId: number | string, path: string): Promise<WorkspaceFile> {
  const { data } = await authenticatedClient.get(`api/builder/coder/${tenantId}/file/`, { params: { path } });
  return data;
}

/** Backend refuses to overwrite a non-blank file with an empty save — same
 * guard Vite's `onEditorChange` relies on (`{ok:false, skipped:"..."}`). */
export async function saveFile(
  tenantId: number | string,
  path: string,
  content: string
): Promise<{ ok: boolean; skipped?: string }> {
  const { data } = await authenticatedClient.post(`api/builder/coder/${tenantId}/file/`, { path, content });
  return data;
}

export async function getTree(tenantId: number | string): Promise<{ tree: FileTreeNode[] }> {
  const { data } = await authenticatedClient.get(`api/builder/coder/${tenantId}/tree/`);
  return data;
}

export type FsOp = 'create_file' | 'mkdir' | 'delete' | 'rename';

export async function fsOp(
  tenantId: number | string,
  op: FsOp,
  path: string,
  extra?: { new_path?: string; content?: string }
): Promise<{ tree: FileTreeNode[] }> {
  const { data } = await authenticatedClient.post(`api/builder/coder/${tenantId}/fs/`, { op, path, ...extra });
  return data;
}

export async function getLatestBuild(tenantId: number | string): Promise<WebBuildStatus | null> {
  const { data } = await authenticatedClient.get(`api/builder/coder/${tenantId}/latest-build/`);
  return data;
}

export async function triggerBuild(
  tenantId: number | string,
  params?: { threadId?: string; kind?: string }
): Promise<{ build_id: number; ws_url: string }> {
  const { data } = await authenticatedClient.post(`api/builder/coder/${tenantId}/build/`, {
    thread_id: params?.threadId,
    kind: params?.kind,
  });
  return data;
}

export async function getBuildStatus(buildId: number | string): Promise<WebBuildStatus> {
  const { data } = await authenticatedClient.get(`api/builder/coder/build/${buildId}/status/`);
  return data;
}

export async function getExpoUrl(tenantId: number | string): Promise<{ url: string | null }> {
  const { data } = await authenticatedClient.get(`api/builder/coder/${tenantId}/expo-url/`);
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

/** Live dev preview for a `render_engine=code` tenant — same-origin, no
 * build step; reflects agent edits via the framework's own HMR. */
export function previewUrlForTenant(tenantUid: string): string {
  return `https://appsketch.ai/preview/${tenantUid}/`;
}
