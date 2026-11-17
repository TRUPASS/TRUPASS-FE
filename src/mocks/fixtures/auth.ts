// Mock 로그인에 쓰는 계정과 응답 모양. 백엔드(AuthController · UserController)와 같은 형식으로 돌려준다.

/** Google 계정 대신 쓰는 계정. ID 토큰은 'mock:<이름>' 이다 (예: 'mock:traveler') */
export interface MockAccount {
  email: string;
  name: string;
  emailVerified: boolean;
}

const ACCOUNTS: Record<string, MockAccount> = {
  traveler: { email: 'traveler@example.com', name: '여행자', emailVerified: true },
  // 이메일 인증을 하지 않은 Google 계정: 백엔드처럼 AUTH401_2 로 거절한다
  unverified: { email: 'unverified@example.com', name: '미인증', emailVerified: false },
};

/** Mock ID 토큰을 계정으로 바꾼다. 형식이 틀리면 null (백엔드의 'Google 인증 실패'와 같다) */
export function accountFromIdToken(idToken: string): (MockAccount & { sub: string }) | null {
  const match = /^mock:([a-z0-9_-]{1,40})$/i.exec(idToken.trim());
  if (!match?.[1]) return null;
  const sub = match[1];
  return {
    sub,
    ...(ACCOUNTS[sub] ?? { email: `${sub}@example.com`, name: sub, emailVerified: true }),
  };
}

export const ACCESS_TTL_S = 30 * 60;
export const REFRESH_TTL_S = 14 * 24 * 60 * 60;

/** 백엔드 공통 응답 형식 */
export const ok = <T>(result?: T) =>
  result === undefined
    ? { isSuccess: true, code: 'COMMON200', message: '성공했습니다.' }
    : { isSuccess: true, code: 'COMMON200', message: '성공했습니다.', result };

export const failure = (code: string, message: string, result?: Record<string, string>) =>
  result === undefined
    ? { isSuccess: false, code, message }
    : { isSuccess: false, code, message, result };
