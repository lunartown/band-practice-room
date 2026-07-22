import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSqlFiles } from './run-sql-files.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// db/seeds 의 기준 데이터를 먼저 넣고, 사람이 원문을 읽어 정규화한 manual-data 를 뒤에 적용한다.
const seedsDir = resolve(__dirname, '../../db/seeds');
const manualDataDir = resolve(__dirname, '../../db/manual-data');

await runSqlFiles(seedsDir);
await runSqlFiles(manualDataDir);
console.log('Database seed completed');
