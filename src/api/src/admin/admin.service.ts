import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApiError } from '../shared/api-error.js';
import { AdminAuthService } from './admin-auth.service.js';
import {
  AdminRepository,
  ImageStatus,
  MappingStatus,
  SourcePatch,
  StudioImagePatch,
} from './admin.repository.js';

const MAPPING_STATUSES: MappingStatus[] = ['ACTIVE', 'NEEDS_MAPPING', 'DISABLED', 'NOT_FOUND'];
const IMAGE_STATUSES: ImageStatus[] = ['OK', 'MISSING', 'BAD', 'NEEDS_REVIEW', 'MANUAL_OVERRIDE', 'HIDDEN'];

@Injectable()
export class AdminService {
  constructor(
    @Inject(AdminAuthService) private readonly authService: AdminAuthService,
    @Inject(AdminRepository) private readonly adminRepository: AdminRepository,
  ) {}

  login(body: unknown, key: string) {
    const input = assertRecord(body);
    return this.authService.login(input.password, key);
  }

  async getOverview() {
    const row = await this.adminRepository.getOverview();
    return {
      mappingIssueCount: Number(row?.mapping_issue_count ?? 0),
      imageIssueCount: Number(row?.image_issue_count ?? 0),
      disabledStudioCount: Number(row?.disabled_studio_count ?? 0),
      disabledRoomCount: Number(row?.disabled_room_count ?? 0),
      failedRunCount24h: Number(row?.failed_run_count_24h ?? 0),
    };
  }

  async listMappingIssues() {
    const rows = await this.adminRepository.listMappingIssues();
    return {
      items: rows.map((row) => ({
        kind: row.kind,
        id: Number(row.id),
        sourceId: row.source_id == null ? null : Number(row.source_id),
        sourceCode: row.source_code,
        sourceName: row.source_name,
        studioId: Number(row.studio_id),
        studioName: row.studio_name,
        roomId: row.room_id == null ? null : Number(row.room_id),
        roomName: row.room_name ?? null,
        externalKey: row.external_key,
        url: row.url,
        mappingStatus: row.mapping_status,
        mappingNote: row.mapping_note,
        issueReason: row.issue_reason,
        roomCount: row.room_count,
        mappedRoomSourceCount: row.mapped_room_source_count,
        lastLookupError: row.last_lookup_error,
        lastVerifiedAt: toIso(row.last_verified_at),
        manualUpdatedAt: toIso(row.manual_updated_at),
        latestJobStatus: row.latest_job_status,
        latestJobAttempts: row.latest_job_attempts,
        latestJobError: row.latest_job_error,
        latestJobUpdatedAt: toIso(row.latest_job_updated_at),
        latestRunStatus: row.latest_run_status,
        latestErrorKind: row.latest_error_kind,
        latestErrorMessage: row.latest_error_message,
        latestFinishedAt: toIso(row.latest_finished_at),
      })),
    };
  }

  async listImageIssues() {
    const rows = await this.adminRepository.listImageIssues();
    return {
      items: rows.map((row) => ({
        id: Number(row.id),
        slug: row.slug,
        name: row.name,
        primaryAreaName: row.primary_area_name,
        isActive: row.is_active,
        imageUrlManual: row.image_url_manual,
        imageUrlScraped: row.image_url_scraped,
        effectiveImageUrl: row.image_status === 'HIDDEN' ? null : row.image_url_manual ?? row.image_url_scraped,
        imageStatus: row.image_status,
        imageNote: row.image_note,
        imageReviewedAt: toIso(row.image_reviewed_at),
        imageUpdatedAt: toIso(row.image_updated_at),
      })),
    };
  }

  async updateStudioSource(actor: string, id: number, body: unknown) {
    const patch = parseSourcePatch(body);
    const result = await this.adminRepository.updateStudioSource(id, patch);
    if (!result) throw notFound('Studio source not found');
    await this.audit(actor, 'UPDATE_STUDIO_SOURCE', 'studio_source', id, result.before, result.after);
    return { item: sourceResponse(result.after) };
  }

  async updateRoomSource(actor: string, id: number, body: unknown) {
    const patch = parseSourcePatch(body);
    const result = await this.adminRepository.updateRoomSource(id, patch);
    if (!result) throw notFound('Room source not found');
    await this.audit(actor, 'UPDATE_ROOM_SOURCE', 'room_source', id, result.before, result.after);
    return { item: sourceResponse(result.after) };
  }

  async verifyStudioSource(actor: string, id: number) {
    const result = await this.adminRepository.verifyStudioSource(id);
    if (!result) throw notFound('Studio source not found');
    await this.audit(actor, 'VERIFY_STUDIO_SOURCE', 'studio_source', id, result.before, result.after);
    return { item: sourceResponse(result.after) };
  }

  async verifyRoomSource(actor: string, id: number) {
    const result = await this.adminRepository.verifyRoomSource(id);
    if (!result) throw notFound('Room source not found');
    await this.audit(actor, 'VERIFY_ROOM_SOURCE', 'room_source', id, result.before, result.after);
    return { item: sourceResponse(result.after) };
  }

  async updateStudioImage(actor: string, id: number, body: unknown) {
    const patch = parseStudioImagePatch(body);
    const result = await this.adminRepository.updateStudioImage(id, patch);
    if (!result) throw notFound('Studio not found');
    await this.audit(actor, 'UPDATE_STUDIO_IMAGE', 'studio', id, result.before, result.after);
    return { item: result.after };
  }

  async updateStudioStatus(actor: string, id: number, body: unknown) {
    const isActive = parseIsActive(body);
    const result = await this.adminRepository.updateStudioActive(id, isActive);
    if (!result) throw notFound('Studio not found');
    await this.audit(actor, 'UPDATE_STUDIO_STATUS', 'studio', id, result.before, result.after);
    return { item: result.after };
  }

  async updateRoomStatus(actor: string, id: number, body: unknown) {
    const isActive = parseIsActive(body);
    const result = await this.adminRepository.updateRoomActive(id, isActive);
    if (!result) throw notFound('Room not found');
    await this.audit(actor, 'UPDATE_ROOM_STATUS', 'room', id, result.before, result.after);
    return { item: result.after };
  }

  async listAuditLogs(limit: number) {
    const rows = await this.adminRepository.listAuditLogs(limit);
    return {
      items: rows.map((row) => ({
        id: Number(row.id),
        actor: row.actor,
        action: row.action,
        targetType: row.target_type,
        targetId: Number(row.target_id),
        beforeValue: row.before_value,
        afterValue: row.after_value,
        createdAt: toIso(row.created_at),
      })),
    };
  }

  private audit(
    actor: string,
    action: string,
    targetType: string,
    targetId: number,
    beforeValue: unknown,
    afterValue: unknown,
  ) {
    return this.adminRepository.createAuditLog({
      actor,
      action,
      targetType,
      targetId,
      beforeValue,
      afterValue,
    });
  }
}

function parseSourcePatch(body: unknown): SourcePatch {
  const input = assertRecord(body);
  const patch: SourcePatch = {};

  if (hasOwn(input, 'externalKey')) patch.externalKey = cleanNullableString(input.externalKey, 'externalKey');
  if (hasOwn(input, 'url')) patch.url = cleanNullableString(input.url, 'url');
  if (hasOwn(input, 'mappingNote')) patch.mappingNote = cleanNullableString(input.mappingNote, 'mappingNote');
  if (hasOwn(input, 'mappingStatus')) patch.mappingStatus = parseMappingStatus(input.mappingStatus);

  if (Object.keys(patch).length === 0) {
    throw new ApiError('INVALID_PARAMETER', 'No valid fields to update', HttpStatus.BAD_REQUEST);
  }

  if (patch.mappingStatus === 'ACTIVE') {
    patch.lastLookupError = null;
  }

  return patch;
}

function parseStudioImagePatch(body: unknown): StudioImagePatch {
  const input = assertRecord(body);
  const patch: StudioImagePatch = {};

  if (hasOwn(input, 'imageUrlManual')) {
    patch.imageUrlManual = cleanNullableString(input.imageUrlManual, 'imageUrlManual');
  }
  if (hasOwn(input, 'imageNote')) patch.imageNote = cleanNullableString(input.imageNote, 'imageNote');
  if (hasOwn(input, 'imageStatus')) patch.imageStatus = parseImageStatus(input.imageStatus);

  if (patch.imageStatus === undefined && hasOwn(input, 'imageUrlManual')) {
    patch.imageStatus = patch.imageUrlManual ? 'MANUAL_OVERRIDE' : 'NEEDS_REVIEW';
  }

  if (Object.keys(patch).length === 0) {
    throw new ApiError('INVALID_PARAMETER', 'No valid fields to update', HttpStatus.BAD_REQUEST);
  }

  return patch;
}

function parseIsActive(body: unknown) {
  const input = assertRecord(body);
  if (typeof input.isActive !== 'boolean') {
    throw new ApiError('INVALID_PARAMETER', 'isActive must be boolean', HttpStatus.BAD_REQUEST);
  }
  return input.isActive;
}

function parseMappingStatus(value: unknown): MappingStatus {
  if (typeof value !== 'string' || !MAPPING_STATUSES.includes(value as MappingStatus)) {
    throw new ApiError('INVALID_PARAMETER', 'Invalid mappingStatus', HttpStatus.BAD_REQUEST);
  }
  return value as MappingStatus;
}

function parseImageStatus(value: unknown): ImageStatus {
  if (typeof value !== 'string' || !IMAGE_STATUSES.includes(value as ImageStatus)) {
    throw new ApiError('INVALID_PARAMETER', 'Invalid imageStatus', HttpStatus.BAD_REQUEST);
  }
  return value as ImageStatus;
}

function cleanNullableString(value: unknown, name: string): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new ApiError('INVALID_PARAMETER', `${name} must be string or null`, HttpStatus.BAD_REQUEST);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('INVALID_PARAMETER', 'Request body must be an object', HttpStatus.BAD_REQUEST);
  }
  return value as Record<string, unknown>;
}

function hasOwn(value: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function notFound(message: string) {
  return new ApiError('NOT_FOUND', message, HttpStatus.NOT_FOUND);
}

function sourceResponse(row: {
  id: string;
  source_id: string | null;
  source_code: string | null;
  source_name: string;
  studio_id: string;
  studio_name: string;
  room_id?: string | null;
  room_name?: string | null;
  external_key: string | null;
  url: string | null;
  mapping_status: MappingStatus;
  mapping_note: string | null;
  last_lookup_error: string | null;
  last_verified_at: Date | null;
  manual_updated_at: Date | null;
}) {
  return {
    id: Number(row.id),
    sourceId: row.source_id == null ? null : Number(row.source_id),
    sourceCode: row.source_code,
    sourceName: row.source_name,
    studioId: Number(row.studio_id),
    studioName: row.studio_name,
    roomId: row.room_id == null ? null : Number(row.room_id),
    roomName: row.room_name ?? null,
    externalKey: row.external_key,
    url: row.url,
    mappingStatus: row.mapping_status,
    mappingNote: row.mapping_note,
    lastLookupError: row.last_lookup_error,
    lastVerifiedAt: toIso(row.last_verified_at),
    manualUpdatedAt: toIso(row.manual_updated_at),
  };
}

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}
