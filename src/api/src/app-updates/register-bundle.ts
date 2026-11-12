// CI(.github/workflows/ota.yml) 전용: GitHub Release 에 올린 OTA 번들을 app_bundles 에 등록한다.
// 실행: OTA_APP_ID=... OTA_NATIVE_VERSION=... OTA_BUNDLE_VERSION=... OTA_BUNDLE_URL=...
//       OTA_BUNDLE_CHECKSUM=... [OTA_GIT_SHA=...] DATABASE_URL=... npm run ota:register
import pg from 'pg';
import { databasePoolConfig } from '../database/database.service.js';
import { registerBundle } from './app-updates.repository.js';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} 환경변수가 필요합니다`);
  return value;
}

const checksum = required('OTA_BUNDLE_CHECKSUM').toLowerCase();
if (!/^[0-9a-f]{64}$/.test(checksum)) {
  throw new Error('OTA_BUNDLE_CHECKSUM 은 sha256 16진수 64자여야 합니다');
}

const pool = new pg.Pool(databasePoolConfig());
try {
  const row = await registerBundle(pool, {
    appId: required('OTA_APP_ID'),
    nativeVersion: required('OTA_NATIVE_VERSION'),
    version: required('OTA_BUNDLE_VERSION'),
    url: required('OTA_BUNDLE_URL'),
    checksum,
    gitSha: process.env.OTA_GIT_SHA?.trim() || null,
  });
  console.log(
    `OTA 번들 등록: id=${row.id} ${row.app_id} native=${row.native_version} version=${row.version}`,
  );
} finally {
  await pool.end();
}
