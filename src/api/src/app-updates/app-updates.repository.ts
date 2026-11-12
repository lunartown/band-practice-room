import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export interface AppBundleRow {
  id: string;
  app_id: string;
  native_version: string;
  version: string;
  url: string;
  checksum: string;
}

export interface RegisterBundleInput {
  appId: string;
  nativeVersion: string;
  version: string;
  url: string;
  checksum: string;
  gitSha: string | null;
}

@Injectable()
export class AppUpdatesRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  // 같은 앱·같은 네이티브 버전의 활성 번들 중 가장 나중에 등록된 행.
  // 버전 문자열 정렬은 1.0.10 < 1.0.9 가 되므로 id 로 고른다.
  async findLatestActive(appId: string, nativeVersion: string): Promise<AppBundleRow | null> {
    const result = await this.database.query<AppBundleRow>(
      `SELECT id, app_id, native_version, version, url, checksum
       FROM app_bundles
       WHERE app_id = $1 AND native_version = $2 AND is_active
       ORDER BY id DESC
       LIMIT 1`,
      [appId, nativeVersion],
    );
    return result.rows[0] ?? null;
  }
}

// CI(ota.yml)에서 번들을 올린 뒤 행을 추가한다. 같은 실행을 다시 돌리면(re-run)
// 같은 버전이 다시 들어오므로 덮어쓰고 활성으로 되돌린다.
export async function registerBundle(
  database: Pick<DatabaseService, 'query'>,
  input: RegisterBundleInput,
): Promise<AppBundleRow> {
  const result = await database.query<AppBundleRow>(
    `INSERT INTO app_bundles (app_id, native_version, version, url, checksum, git_sha)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (app_id, version) DO UPDATE
       SET native_version = EXCLUDED.native_version,
           url = EXCLUDED.url,
           checksum = EXCLUDED.checksum,
           git_sha = EXCLUDED.git_sha,
           is_active = true
     RETURNING id, app_id, native_version, version, url, checksum`,
    [input.appId, input.nativeVersion, input.version, input.url, input.checksum, input.gitSha],
  );
  return result.rows[0];
}
