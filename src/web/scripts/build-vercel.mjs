import { spawnSync } from 'node:child_process';

const PROD_API_BASE_URL =
  process.env.HAPJUSIL_PROD_API_BASE_URL ?? 'https://hapjusil-api.onrender.com/api/v1';
const DEV_API_BASE_URL =
  process.env.HAPJUSIL_DEV_API_BASE_URL ?? 'https://hapjusil-api-dev.onrender.com/api/v1';

const branch = process.env.VERCEL_GIT_COMMIT_REF ?? process.env.GITHUB_REF_NAME ?? 'local';

function resolveApiBaseUrl(branchName) {
  switch (branchName) {
    case 'dev':
      return DEV_API_BASE_URL;
    case 'main':
    case 'stg':
    default:
      return PROD_API_BASE_URL;
  }
}

const apiBaseUrl = resolveApiBaseUrl(branch);

console.log(`[vercel-env] branch=${branch}`);
console.log(`[vercel-env] VITE_API_BASE_URL=${apiBaseUrl}`);

const result = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_USE_MOCK_API: 'false',
    VITE_API_BASE_URL: apiBaseUrl,
  },
});

process.exit(result.status ?? 1);
