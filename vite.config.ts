import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { checkEnv } from './config/env-guard';

/** 빌드할 때 환경 변수를 검사한다: 시크릿이 브라우저로 새거나, 배포에서 Google 로그인이 깨질 설정이면 빌드를 멈춘다 */
function envGuard(): Plugin {
  return {
    name: 'trupass:env-guard',
    apply: 'build',
    configResolved(config) {
      const issues = checkEnv(
        loadEnv(config.mode, config.envDir || process.cwd(), 'VITE_'),
        process.env.VERCEL_ENV,
      );
      for (const issue of issues) {
        if (issue.level === 'warning') config.logger.warn(`[env] ${issue.message}`);
      }
      const errors = issues.filter((issue) => issue.level === 'error');
      if (errors.length > 0) {
        throw new Error(
          `환경 변수를 확인하세요.\n${errors.map((e) => `- ${e.message}`).join('\n')}`,
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), envGuard()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'config/**/*.test.ts'],
  },
});
