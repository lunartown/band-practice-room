import pg from 'pg';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ??
  'postgres://band_practice_room:band_practice_room@localhost:15432/band_practice_room';

// 클라우드 Postgres(Neon 등)는 SSL 필수. 로컬은 끄고, 원격이면 자동으로 켠다.
const isLocal =
  connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
const ssl = !isLocal && process.env.DATABASE_SSL !== 'false' ? { rejectUnauthorized: false } : false;

const pool = new Pool({ connectionString, ssl });

export function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function end() {
  await pool.end();
}
