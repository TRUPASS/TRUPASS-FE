// OpenAPI 스펙으로부터 src/shared/api/schema.d.ts 를 생성한다.
//
//   pnpm gen:api            # 로컬 초안 스펙(openapi/trupass.yaml)에서 생성
//   pnpm gen:api --remote   # ${VITE_API_BASE_URL}/v3/api-docs (백엔드)에서 생성
//
// VITE_API_BASE_URL 은 셸 환경 변수 → .env.local → .env 순서로 찾는다.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OUTPUT = 'src/shared/api/schema.d.ts';
const LOCAL_SPEC = 'openapi/trupass.yaml';

function readEnvFile(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
      }),
  );
}

function resolveBaseUrl() {
  return (
    process.env.VITE_API_BASE_URL ||
    readEnvFile('.env.local').VITE_API_BASE_URL ||
    readEnvFile('.env').VITE_API_BASE_URL
  );
}

const remote = process.argv.includes('--remote');
let source = LOCAL_SPEC;

if (remote) {
  const baseUrl = resolveBaseUrl();
  if (!baseUrl) {
    console.error('[gen:api] --remote 를 쓰려면 VITE_API_BASE_URL 이 필요합니다.');
    process.exit(1);
  }
  source = `${baseUrl.replace(/\/$/, '')}/v3/api-docs`;
}

console.log(`[gen:api] ${source} → ${OUTPUT}`);
execFileSync(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  ['exec', 'openapi-typescript', source, '--output', resolve(OUTPUT)],
  { stdio: 'inherit' },
);
