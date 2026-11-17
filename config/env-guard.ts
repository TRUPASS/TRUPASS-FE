// 빌드할 때 환경 변수를 검사한다 (vite.config.ts 의 envGuard 플러그인).
// VITE_ 로 시작하는 값은 빌드 결과물(브라우저)에 그대로 들어가므로, 잘못 넣으면 바로 밖으로 새거나 로그인이 깨진다.
// - error: 빌드를 멈춘다. Vercel 은 실패한 빌드를 배포하지 않으니 이전 배포가 그대로 남는다.
// - warning: 빌드는 하되 로그에 남긴다.

export interface EnvIssue {
  level: 'error' | 'warning';
  message: string;
}

/** Google OAuth 클라이언트 ID 모양: <숫자>-<영숫자>.apps.googleusercontent.com */
const GOOGLE_CLIENT_ID = /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/;
/** Google OAuth client secret 은 GOCSPX- 로 시작한다 */
const GOOGLE_CLIENT_SECRET = /GOCSPX-/i;
/** 토스페이먼츠 시크릿 키는 test_sk_ / live_sk_ (클라이언트 키는 _ck_, 결제위젯 키는 _gck_) */
const TOSS_SECRET_KEY = /^(test|live)_(g?sk)_/;

const isLocalUrl = (url: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/.test(url);

/**
 * @param env 빌드에 쓰이는 환경 변수 (Vite 의 loadEnv 결과 + Vercel 이 주는 VERCEL_ENV)
 * @param vercelEnv Vercel 에서 빌드할 때의 환경: production | preview | development. 그 밖에서는 undefined
 */
export function checkEnv(env: Record<string, string | undefined>, vercelEnv?: string): EnvIssue[] {
  const issues: EnvIssue[] = [];
  const value = (key: string) => env[key]?.trim() ?? '';

  // 1. 시크릿이 브라우저로 나가지 않게 한다
  for (const [key, raw] of Object.entries(env)) {
    if (!key.startsWith('VITE_') || !raw) continue;
    if (GOOGLE_CLIENT_SECRET.test(raw)) {
      issues.push({
        level: 'error',
        message: `${key} 에 Google client secret(GOCSPX-…)이 들어 있습니다. FE 에는 클라이언트 ID 만 넣습니다. secret 은 지우고, 이미 배포됐다면 Google Cloud Console 에서 secret 을 새로 발급하세요.`,
      });
    }
    if (TOSS_SECRET_KEY.test(raw.trim())) {
      issues.push({
        level: 'error',
        message: `${key} 에 토스페이먼츠 시크릿 키(…_sk_)가 들어 있습니다. FE 에는 클라이언트 키(…_ck_)만 넣습니다.`,
      });
    }
  }

  // 2. Google 클라이언트 ID 모양
  const clientId = value('VITE_GOOGLE_CLIENT_ID');
  if (clientId && !GOOGLE_CLIENT_ID.test(clientId) && !GOOGLE_CLIENT_SECRET.test(clientId)) {
    issues.push({
      level: 'error',
      message:
        'VITE_GOOGLE_CLIENT_ID 가 Google OAuth 클라이언트 ID 모양(…apps.googleusercontent.com)이 아닙니다. Google Cloud Console → 사용자 인증 정보의 "클라이언트 ID" 를 그대로 넣으세요.',
    });
  }

  // 3. Vercel 배포에서 Google 로그인을 켰을 때
  const googleMode = Boolean(clientId) && value('VITE_USE_MOCK') !== 'true';
  if (vercelEnv && googleMode) {
    const apiBaseUrl = value('VITE_API_BASE_URL');
    if (!apiBaseUrl || isLocalUrl(apiBaseUrl)) {
      issues.push({
        level: 'error',
        message:
          'Google 로그인을 켰는데(VITE_GOOGLE_CLIENT_ID) VITE_API_BASE_URL 이 없거나 localhost 입니다. 배포된 화면에서는 로그인이 실패합니다. 운영 백엔드 주소를 같이 넣거나, 백엔드가 준비될 때까지 VITE_GOOGLE_CLIENT_ID 를 빼 두세요.',
      });
    } else if (!apiBaseUrl.startsWith('https://')) {
      issues.push({
        level: 'error',
        message:
          'VITE_API_BASE_URL 은 https 주소여야 합니다. https 페이지에서 http 백엔드는 브라우저가 막습니다.',
      });
    }
    if (vercelEnv === 'preview') {
      issues.push({
        level: 'warning',
        message:
          'Vercel 미리보기 빌드에 VITE_GOOGLE_CLIENT_ID 가 들어 있습니다. 미리보기 주소는 Google 의 승인된 JavaScript 원본에 없어서 로그인 버튼이 동작하지 않습니다. 이 값은 Production 에만 두고, Preview 는 VITE_USE_MOCK=true 를 권장합니다.',
      });
    }
  }

  return issues;
}
