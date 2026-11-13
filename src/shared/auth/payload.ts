// 백엔드 응답을 읽는다. 응답은 모두 {isSuccess, code, message, result} 형식이고, 생성한 타입은 필드가 모두 선택 사항이라
// 쓰기 전에 꼭 있어야 할 값이 있는지 여기서 확인한다.
import { parseSessionUser, type SessionUser } from './session';

export interface Tokens {
  accessToken: string;
  /** 초 */
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
}

export interface Login {
  tokens: Tokens;
  user: SessionUser;
  /** 이번 로그인으로 가입했으면 true */
  newUser: boolean;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isText = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isSeconds = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;

export function parseTokens(v: unknown): Tokens | null {
  if (!isRecord(v)) return null;
  const { accessToken, accessTokenExpiresIn, refreshToken, refreshTokenExpiresIn } = v;
  if (!isText(accessToken) || !isText(refreshToken)) return null;
  if (!isSeconds(accessTokenExpiresIn) || !isSeconds(refreshTokenExpiresIn)) return null;
  return { accessToken, accessTokenExpiresIn, refreshToken, refreshTokenExpiresIn };
}

export function parseLogin(v: unknown): Login | null {
  if (!isRecord(v)) return null;
  const tokens = parseTokens(v.tokens);
  const user = parseSessionUser(v.user);
  if (!tokens || !user) return null;
  return { tokens, user, newUser: v.newUser === true };
}

/** 실패 응답에서 에러 코드(예: AUTH401_1)와 메시지를 꺼낸다 */
export function readFailure(body: unknown): { code?: string; message?: string } {
  if (!isRecord(body)) return {};
  return {
    code: typeof body.code === 'string' ? body.code : undefined,
    message: typeof body.message === 'string' ? body.message : undefined,
  };
}
