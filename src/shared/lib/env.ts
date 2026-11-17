/** 브라우저에 노출되는 공개 환경 변수만 다룬다. 시크릿은 FE 에 두지 않는다. */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
  tossClientKey: import.meta.env.VITE_TOSS_CLIENT_KEY ?? '',
  /** Google 로그인 버튼(Google Identity Services)의 OAuth 클라이언트 ID. 백엔드 GOOGLE_OAUTH_CLIENT_IDS 에 든 값과 같아야 한다. */
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? '',
} as const;
