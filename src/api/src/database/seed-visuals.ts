import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSqlFiles } from './run-sql-files.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// 비주얼(썸네일·평점·리뷰수) 시드만 따로 실행한다.
// 003 은 slug 기준 멱등 UPDATE 라 TRUNCATE 가 없어, 콜드스타트/배포/크론마다 안전하게 돌릴 수 있다.
// (전체 db:seed 는 002 가 studios·slots 까지 TRUNCATE 하므로 수동 실행 전용이다.)
const visualsSeed = resolve(__dirname, '../../db/seeds/003_studio_visuals.sql');

await runSqlFiles(visualsSeed);
console.log('Database visuals seed completed');
