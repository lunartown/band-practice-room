import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSqlFiles } from './run-sql-files.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// db/seeds 디렉터리의 모든 .sql 을 파일명 순서로 실행한다.
// 001(기준/sources) → 002(합주실 89곳·스크랩 매핑, TRUNCATE 재생성) → 003(비주얼 UPDATE)
const seedsDir = resolve(__dirname, '../../db/seeds');

await runSqlFiles(seedsDir);
console.log('Database seed completed');
