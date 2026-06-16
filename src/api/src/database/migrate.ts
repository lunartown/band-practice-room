import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSqlFiles } from './run-sql-files.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = resolve(__dirname, '../../db/migrations');

await runSqlFiles(migrationsDir);
console.log('Database migration completed');
