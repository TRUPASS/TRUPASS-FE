import { describe, expect, it } from 'vitest';
import { checkEnv } from './env-guard';

const CLIENT_ID = '123456789012-abcdefghijklmnop0123456789abcdef.apps.googleusercontent.com';
const levels = (issues: ReturnType<typeof checkEnv>) => issues.map((i) => i.level);

describe('checkEnv', () => {
  it('비어 있으면(로그인 없이 화면만) 아무 문제 없다', () => {
    expect(checkEnv({}, 'production')).toEqual([]);
  });

  it('로컬 개발: 클라이언트 ID + localhost 백엔드는 통과한다', () => {
    expect(
      checkEnv({ VITE_GOOGLE_CLIENT_ID: CLIENT_ID, VITE_API_BASE_URL: 'http://localhost:8080' }),
    ).toEqual([]);
  });

  it('Google client secret 을 어느 VITE_ 변수에 넣어도 빌드를 멈춘다', () => {
    expect(levels(checkEnv({ VITE_GOOGLE_CLIENT_ID: 'GOCSPX-abc123' }))).toEqual(['error']);
    expect(levels(checkEnv({ VITE_GOOGLE_CLIENT_SECRET: 'GOCSPX-abc123' }))).toEqual(['error']);
  });

  it('VITE_ 가 아닌 변수(빌드에만 쓰이고 브라우저로 안 나가는 값)는 보지 않는다', () => {
    expect(checkEnv({ GOOGLE_CLIENT_SECRET: 'GOCSPX-abc123' })).toEqual([]);
  });

  it('토스 시크릿 키를 막고 클라이언트 키는 통과시킨다', () => {
    expect(levels(checkEnv({ VITE_TOSS_CLIENT_KEY: 'test_sk_abc' }))).toEqual(['error']);
    expect(levels(checkEnv({ VITE_TOSS_CLIENT_KEY: 'live_gsk_abc' }))).toEqual(['error']);
    expect(checkEnv({ VITE_TOSS_CLIENT_KEY: 'test_ck_abc' })).toEqual([]);
  });

  it('클라이언트 ID 모양이 아니면 빌드를 멈춘다', () => {
    expect(levels(checkEnv({ VITE_GOOGLE_CLIENT_ID: '123456789012' }))).toEqual(['error']);
    expect(levels(checkEnv({ VITE_GOOGLE_CLIENT_ID: 'my-app.example.com' }))).toEqual(['error']);
  });

  it('앞뒤 공백은 괜찮다 (앱도 trim 해서 쓴다)', () => {
    expect(checkEnv({ VITE_GOOGLE_CLIENT_ID: `  ${CLIENT_ID}\n` })).toEqual([]);
  });

  describe('Vercel 배포', () => {
    it('운영: 클라이언트 ID + https 백엔드면 통과한다', () => {
      expect(
        checkEnv(
          { VITE_GOOGLE_CLIENT_ID: CLIENT_ID, VITE_API_BASE_URL: 'https://api.trupass.online' },
          'production',
        ),
      ).toEqual([]);
    });

    it('운영: 백엔드 주소가 없거나 localhost 면 빌드를 멈춘다 (이전 배포가 그대로 남는다)', () => {
      expect(levels(checkEnv({ VITE_GOOGLE_CLIENT_ID: CLIENT_ID }, 'production'))).toEqual([
        'error',
      ]);
      expect(
        levels(
          checkEnv(
            { VITE_GOOGLE_CLIENT_ID: CLIENT_ID, VITE_API_BASE_URL: 'http://localhost:8080' },
            'production',
          ),
        ),
      ).toEqual(['error']);
    });

    it('운영: http 백엔드는 막는다', () => {
      expect(
        levels(
          checkEnv(
            { VITE_GOOGLE_CLIENT_ID: CLIENT_ID, VITE_API_BASE_URL: 'http://api.trupass.online' },
            'production',
          ),
        ),
      ).toEqual(['error']);
    });

    it('Mock 모드면 백엔드 주소를 보지 않는다', () => {
      expect(
        checkEnv({ VITE_GOOGLE_CLIENT_ID: CLIENT_ID, VITE_USE_MOCK: 'true' }, 'preview'),
      ).toEqual([]);
    });

    it('미리보기에 클라이언트 ID 가 있으면 경고한다', () => {
      expect(
        levels(
          checkEnv(
            { VITE_GOOGLE_CLIENT_ID: CLIENT_ID, VITE_API_BASE_URL: 'https://api.trupass.online' },
            'preview',
          ),
        ),
      ).toEqual(['warning']);
    });
  });
});
