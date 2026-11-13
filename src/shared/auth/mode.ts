import { env } from '@/shared/lib/env';

/**
 * 로그인을 어떻게 하는가.
 * - google: Google 로그인 버튼으로 받은 ID 토큰을 백엔드(POST /auth/google)로 보낸다. VITE_GOOGLE_CLIENT_ID 가 있을 때
 * - mock: 백엔드 없이 Mock API(MSW)로 로그인한다. VITE_USE_MOCK=true 일 때 (Google 창은 뜨지 않는다)
 * - off: 둘 다 없으면 로그인 없이 화면만 이어 본다(디자인 확인용). 회원 정보 입력도 예시 값으로 채운다
 */
export type AuthMode = 'google' | 'mock' | 'off';

export const authMode: AuthMode = env.useMock ? 'mock' : env.googleClientId ? 'google' : 'off';
