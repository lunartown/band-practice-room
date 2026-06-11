import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { defaultDatabaseUrl } from './database.service.js';

const { Pool } = pg;

const currentDir = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(currentDir, '../../../../infra/database/migrations');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL ?? defaultDatabaseUrl,
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const migrationFiles = (await readdir(migrationsDir))
      .filter((fileName) => fileName.endsWith('.sql'))
      .sort();

    for (const fileName of migrationFiles) {
      const version = fileName.replace(/\.sql$/, '');
      const applied = await pool.query('SELECT 1 FROM schema_migrations WHERE version = $1', [
        version,
      ]);

      if (applied.rowCount) {
        console.log(`Skipping ${fileName}`);
        continue;
      }

      const sql = await readFile(join(migrationsDir, fileName), 'utf8');

      await pool.query('BEGIN');
      try {
        await pool.query(sql);
        await pool.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
        await pool.query('COMMIT');
        console.log(`Applied ${fileName}`);
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

