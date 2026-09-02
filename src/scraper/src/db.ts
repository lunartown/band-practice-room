import pg from 'pg';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ??
  'postgres://band_practice_room:band_practice_room@localhost:15432/band_practice_room';

function stripSslConnParams(rawConnectionString: string): string {
  try {
    const url = new URL(rawConnectionString);
    url.searchParams.delete('channel_binding');
    url.searchParams.delete('sslmode');
    return url.toString();
  } catch {
    return rawConnectionString;
  }
}

// 클라우드 Postgres(Neon 등)는 SSL 필수. 로컬은 끄고, 원격이면 자동으로 켠다.
const isLocal =
  connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
const ssl = !isLocal && process.env.DATABASE_SSL !== 'false' ? { rejectUnauthorized: false } : false;

const pool = new Pool({ connectionString: stripSslConnParams(connectionString), ssl });

export function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

// 세션 GUC(예: read-only 고정)를 여러 쿼리에 걸쳐 유지해야 할 때 쓴다.
// pool.query 는 호출마다 임의의 커넥션을 잡으므로 세션 설정이 유지되지 않는다.
export function getClient(): Promise<pg.PoolClient> {
  return pool.connect();
}

export async function end() {
  await pool.end();
}
