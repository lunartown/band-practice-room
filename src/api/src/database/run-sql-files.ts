import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import pg from 'pg';
import { defaultDatabaseUrl } from './database.service.js';

const { Pool } = pg;

export async function runSqlFiles(directory: string) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL ?? defaultDatabaseUrl,
  });

  try {
    const entries = await readdir(directory).catch(() => null);
    if (entries) {
      const sqlFiles = entries.filter((f) => f.endsWith('.sql')).sort();
      for (const file of sqlFiles) {
        const sql = await readFile(join(directory, file), 'utf8');
        await pool.query(sql);
      }
    } else {
      const sql = await readFile(directory, 'utf8');
      await pool.query(sql);
    }
  } finally {
    await pool.end();
  }
}
