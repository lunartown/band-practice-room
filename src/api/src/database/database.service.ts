import { Injectable, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';

const { Pool } = pg;

export const defaultDatabaseUrl =
  'postgres://band_practice_room:band_practice_room@localhost:15432/band_practice_room';

// SSL/SCRAM 협상은 코드의 ssl 옵션으로만 제어하고, 연결 문자열의 관련 파라미터는 떼어낸다.
// 특히 Neon 문자열의 channel_binding=require 는 node-postgres 8.21+ 가 따르는데,
// 우리는 rejectUnauthorized:false 로 붙으므로 SCRAM 채널 바인딩이 어긋나 서버가
// "password authentication failed" 로 응답한다(드라이버 버전이 올라가며 표면화됨).
// sslmode 도 함께 제거해 libpq 호환 경고와 이중 SSL 설정 충돌을 없앤다.
function stripSslConnParams(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete('channel_binding');
    url.searchParams.delete('sslmode');
    return url.toString();
  } catch {
    // URL 파싱 실패(비표준 문자열 등)면 원본을 그대로 쓴다.
    return connectionString;
  }
}

// 클라우드 Postgres(Neon 등)는 SSL 연결이 필수다.
// 로컬(localhost)은 SSL을 끄고, 원격 호스트면 자동으로 켠다. DATABASE_SSL=false 로 강제 해제 가능.
export function databasePoolConfig(): pg.PoolConfig {
  const rawConnectionString = process.env.DATABASE_URL ?? defaultDatabaseUrl;
  const isLocal =
    rawConnectionString.includes('localhost') || rawConnectionString.includes('127.0.0.1');
  const sslDisabled = process.env.DATABASE_SSL === 'false';
  const ssl = !isLocal && !sslDisabled ? { rejectUnauthorized: false } : false;
  return { connectionString: stripSslConnParams(rawConnectionString), ssl };
}

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool = new Pool(databasePoolConfig());

  query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<pg.QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
