const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export type MappingStatus = 'ACTIVE' | 'NEEDS_MAPPING' | 'DISABLED' | 'NOT_FOUND';
export type ImageStatus = 'OK' | 'MISSING' | 'BAD' | 'NEEDS_REVIEW' | 'MANUAL_OVERRIDE' | 'HIDDEN';

export interface AdminOverview {
  mappingIssueCount: number;
  imageIssueCount: number;
  disabledStudioCount: number;
  disabledRoomCount: number;
  failedRunCount24h: number;
}

export interface AdminMappingIssue {
  kind: 'studio_source' | 'room_source' | 'missing_studio_source';
  id: number;
  sourceId: number | null;
  sourceCode: string | null;
  sourceName: string;
  studioId: number;
  studioName: string;
  roomId: number | null;
  roomName: string | null;
  externalKey: string | null;
  url: string | null;
  mappingStatus: MappingStatus;
  mappingNote: string | null;
  issueReason: string | null;
  roomCount: number;
  mappedRoomSourceCount: number;
  lastLookupError: string | null;
  lastVerifiedAt: string | null;
  manualUpdatedAt: string | null;
  latestJobStatus: string | null;
  latestJobAttempts: number | null;
  latestJobError: string | null;
  latestJobUpdatedAt: string | null;
  latestRunStatus: 'SUCCESS' | 'FAILED' | 'PARTIAL' | null;
  latestErrorKind: string | null;
  latestErrorMessage: string | null;
  latestFinishedAt: string | null;
}

export interface AdminImageIssue {
  id: number;
  slug: string | null;
  name: string;
  primaryAreaName: string | null;
  isActive: boolean;
  imageUrlManual: string | null;
  imageUrlScraped: string | null;
  effectiveImageUrl: string | null;
  imageStatus: ImageStatus;
  imageNote: string | null;
  imageReviewedAt: string | null;
  imageUpdatedAt: string | null;
}

export interface AdminAuditLog {
  id: number;
  actor: string;
  action: string;
  targetType: string;
  targetId: number;
  beforeValue: unknown;
  afterValue: unknown;
  createdAt: string | null;
}

export interface SourcePatch {
  externalKey?: string | null;
  url?: string | null;
  mappingStatus?: MappingStatus;
  mappingNote?: string | null;
}

export interface StudioImagePatch {
  imageUrlManual?: string | null;
  imageStatus?: ImageStatus;
  imageNote?: string | null;
}

export async function loginAdmin(password: string) {
  return adminFetch<{ token: string; expiresInMinutes: number }>('/admin/auth/login', null, {
    method: 'POST',
    body: { password },
  });
}

export function getAdminOverview(token: string) {
  return adminFetch<AdminOverview>('/admin/overview', token);
}

export async function getAdminMappingIssues(token: string) {
  const response = await adminFetch<{ items: AdminMappingIssue[] }>('/admin/mapping-issues', token);
  return response.items;
}

export async function getAdminImageIssues(token: string) {
  const response = await adminFetch<{ items: AdminImageIssue[] }>('/admin/image-issues', token);
  return response.items;
}

export async function getAdminAuditLogs(token: string) {
  const response = await adminFetch<{ items: AdminAuditLog[] }>('/admin/audit-logs?limit=40', token);
  return response.items;
}

export function updateAdminSource(token: string, item: AdminMappingIssue, patch: SourcePatch) {
  if (!isEditableMappingIssue(item)) throw new Error('이 항목은 아직 화면에서 직접 수정할 수 없습니다');
  const base = item.kind === 'studio_source' ? 'studio-sources' : 'room-sources';
  return adminFetch(`/admin/${base}/${item.id}`, token, { method: 'PATCH', body: patch });
}

export function verifyAdminSource(token: string, item: AdminMappingIssue) {
  if (!isEditableMappingIssue(item)) throw new Error('이 항목은 아직 화면에서 직접 검증할 수 없습니다');
  const base = item.kind === 'studio_source' ? 'studio-sources' : 'room-sources';
  return adminFetch(`/admin/${base}/${item.id}/verify`, token, { method: 'POST' });
}

export function updateAdminStudioImage(token: string, studioId: number, patch: StudioImagePatch) {
  return adminFetch(`/admin/studios/${studioId}/image`, token, { method: 'PATCH', body: patch });
}

export function updateAdminStudioStatus(token: string, studioId: number, isActive: boolean) {
  return adminFetch(`/admin/studios/${studioId}/status`, token, {
    method: 'PATCH',
    body: { isActive },
  });
}

interface AdminFetchInit {
  method?: string;
  body?: unknown;
}

async function adminFetch<T>(path: string, token: string | null, init: AdminFetchInit = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  if (!response.ok) {
    let message = `API ${response.status}`;
    try {
      const data = (await response.json()) as { error?: { message?: string; code?: string } };
      message = data.error?.message ?? data.error?.code ?? message;
    } catch {
      // ignore non-JSON error body
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function isEditableMappingIssue(item: AdminMappingIssue) {
  return item.kind === 'studio_source' || item.kind === 'room_source';
}
