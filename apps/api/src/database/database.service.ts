import { Injectable, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';

const { Pool } = pg;

export const defaultDatabaseUrl =
  'postgres://band_practice_room:band_practice_room@localhost:15432/band_practice_room';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL ?? defaultDatabaseUrl,
  });

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
