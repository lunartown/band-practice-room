import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import pg from 'pg';
import { defaultDatabaseUrl } from './database.service.js';

const { Pool } = pg;

export async function runSqlFiles(directory: string) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL ?? defaultDatabaseUrl,
  });

  try {
    const sql = await readFile(join(directory), 'utf8');
    await pool.query(sql);
  } finally {
    await pool.end();
  }
}
