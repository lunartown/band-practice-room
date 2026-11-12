import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApiError } from '../shared/api-error.js';
import { AppUpdatesRepository } from './app-updates.repository.js';

// 업데이터 플러그인(@capgo/capacitor-updater v8)의 자체 호스팅 응답 규격.
// 플러그인은 응답의 version 이 기기의 현재 번들 버전과 "다르면" url 의 zip 을 받는다.
// 더 새로운지 비교하지 않으므로, 최신 활성 번들을 끄면 그보다 오래된 직전 번들로도
// 내려갈 수 있다(수동 롤백). version 이 'builtin' 이면 스토어 내장 번들로 되돌린다.
// kind 가 있으면 "업데이트 없음/실패"로 처리하고 아무것도 받지 않는다.
export type AppUpdateResponse =
  | { version: string; url: string; checksum: string }
  | { version: 'builtin' }
  | { kind: 'up_to_date'; error: 'no_new_version_available'; message: string; version: string };

const BUILTIN = 'builtin';

@Injectable()
export class AppUpdatesService {
  constructor(@Inject(AppUpdatesRepository) private readonly repository: AppUpdatesRepository) {}

  async check(body: unknown): Promise<AppUpdateResponse> {
    const record = assertRecord(body);
    const appId = assertNonEmptyString(record.app_id, 'app_id');
    // 스토어 바이너리 버전(iOS CFBundleShortVersionString, Android versionName).
    const nativeVersion = assertNonEmptyString(record.version_build, 'version_build');
    // 지금 실행 중인 번들 버전. 내장 번들이면 플러그인이 네이티브 버전을 그대로 보낸다.
    const currentVersion = assertNonEmptyString(record.version_name, 'version_name');

    // 네이티브 버전이 정확히 같은 번들만 준다. 스토어 빌드에 담긴 웹 코드보다 오래된
    // 번들이 새 바이너리를 덮는 일을 막는다(버전을 올린 바이너리는 새 번들부터 받는다).
    const latest = await this.repository.findLatestActive(appId, nativeVersion);

    if (latest) {
      if (latest.version === currentVersion) return upToDate(currentVersion);
      return { version: latest.version, url: latest.url, checksum: latest.checksum };
    }

    // 이 네이티브 버전의 활성 번들이 하나도 없다. 이미 내장 번들이면 그대로 두고,
    // 내려받은 번들을 쓰는 중이면(전부 롤백된 경우) 내장 번들로 되돌린다.
    if (currentVersion === nativeVersion || currentVersion === BUILTIN) {
      return upToDate(currentVersion);
    }
    return { version: BUILTIN };
  }
}

function upToDate(version: string): AppUpdateResponse {
  return {
    kind: 'up_to_date',
    error: 'no_new_version_available',
    message: 'No new version available',
    version,
  };
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ApiError('INVALID_BODY', '요청 본문이 올바르지 않습니다', HttpStatus.BAD_REQUEST);
  }
  return value as Record<string, unknown>;
}

function assertNonEmptyString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError('INVALID_PARAMETER', `${name} is required`, HttpStatus.BAD_REQUEST);
  }
  return value.trim();
}
