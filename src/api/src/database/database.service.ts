import { Injectable, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';

const { Pool } = pg;

export const defaultDatabaseUrl =
  'postgres://band_practice_room:band_practice_room@localhost:15432/band_practice_room';

// 클라우드 Postgres(Neon 등)는 SSL 연결이 필수다.
// 로컬(localhost)은 SSL을 끄고, 원격 호스트면 자동으로 켠다. DATABASE_SSL=false 로 강제 해제 가능.
export function databasePoolConfig(): pg.PoolConfig {
  const connectionString = process.env.DATABASE_URL ?? defaultDatabaseUrl;
  const isLocal =
    connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const sslDisabled = process.env.DATABASE_SSL === 'false';
  const ssl = !isLocal && !sslDisabled ? { rejectUnauthorized: false } : false;
  return { connectionString, ssl };
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
