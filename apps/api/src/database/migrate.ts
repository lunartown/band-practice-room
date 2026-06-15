import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSqlFiles } from './run-sql-files.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = resolve(__dirname, '../../db/migrations/001_init.sql');

await runSqlFiles(migrationPath);
console.log('Database migration completed');
