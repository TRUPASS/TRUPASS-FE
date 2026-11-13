import { env } from '@/shared/lib/env';
import { parseTokens } from './payload';
import { accessExpired, session, sessionFrom, type Session } from './session';

// 토큰 없이 부르는 경로 (백엔드 SecurityConfig 의 열린 경로 가운데 FE 가 부르는 것)
const OPEN_PATH = /\/auth\/(google|refresh|logout)$/;

function apiOrigin(): string {
  try {
    return new URL(env.apiBaseUrl).origin;
  } catch {
    return '';
  }
}

/** 백엔드로 가는 요청인데 열린 경로가 아니면 토큰을 붙인다. 다른 곳으로 가는 요청에는 토큰을 싣지 않는다. */
function needsToken(url: string): boolean {
  try {
    const u = new URL(url);
    return u.origin === apiOrigin() && !OPEN_PATH.test(u.pathname);
  } catch {
    return false;
  }
}

function withToken(request: Request, accessToken: string | undefined): Request {
  if (!accessToken) return request;
  const headers = new Headers(request.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  return new Request(request, { headers });
}

/**
 * API 클라이언트가 쓰는 fetch. 로그인 상태면 access token 을 붙이고, 만료됐으면 새 토큰 쌍을 받아 한 번만 다시 보낸다.
 * - 보내기 전: 만료 시각이 지났으면 먼저 바꾼다 (401 을 한 번 덜 받는다)
 * - 401 을 받으면: 토큰을 바꾼 뒤 같은 요청을 한 번 더 보낸다. 바꾸지 못하면(다시 로그인해야 함) 401 응답을 그대로 돌려준다
 */
export async function authFetch(request: Request): Promise<Response> {
  // 호출하는 때의 fetch 를 써야 테스트의 MSW 가 가로챌 수 있다
  const send = (r: Request) => globalThis.fetch(r);
  let current = needsToken(request.url) ? session.get() : null;
  if (!current) return send(request);

  const again = request.clone(); // 401 이면 다시 보낼 사본 (본문은 한 번만 읽을 수 있다)
  if (accessExpired(current)) current = await refreshSession(current.refreshToken);
  const first = await send(withToken(request, current?.accessToken));
  if (first.status !== 401 || !current) return first;

  const next = await refreshSession(current.refreshToken);
  if (!next) return first;
  return send(withToken(again, next.accessToken));
}

let inflight: Promise<Session | null> | null = null;

/**
 * refresh token 으로 새 토큰 쌍을 받아 로그인 상태를 바꾼다. 바꾸지 못하면 null.
 * refresh token 은 한 번만 쓸 수 있고, 이미 쓴 것을 다시 보내면 백엔드가 그 사람의 토큰을 모두 폐기한다. 그래서
 * - 같은 탭에서 동시에 부르면 한 번만 바꾸고 결과를 나눠 쓴다
 * - 다른 탭과는 Web Locks 로 차례를 맞추고, 차례가 오면 저장소를 다시 읽어 이미 바뀌었으면 그 토큰을 쓴다
 */
export function refreshSession(used: string): Promise<Session | null> {
  inflight ??= inTurn(() => rotate(used)).finally(() => {
    inflight = null;
  });
  return inflight;
}

function inTurn<T>(work: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (!locks) return work();
  return new Promise<T>((resolve, reject) => {
    locks.request('tp.auth.refresh', () => work().then(resolve, reject)).catch(reject);
  });
}

async function rotate(used: string): Promise<Session | null> {
  const current = session.reload();
  if (!current) return null;
  if (current.refreshToken !== used && !accessExpired(current)) return current; // 다른 탭이 이미 바꿨다

  let response: Response;
  try {
    response = await globalThis.fetch(`${env.apiBaseUrl.replace(/\/+$/, '')}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    });
  } catch {
    return null; // 서버에 닿지 못했다. 로그인 상태는 그대로 두고 이번 요청만 실패시킨다
  }
  if (response.status === 401) {
    session.clear(); // refresh token 이 만료됐거나 폐기됐다: 다시 로그인해야 한다
    return null;
  }
  if (!response.ok) return null;
  const tokens = parseTokens(
    ((await response.json().catch(() => null)) as { result?: unknown } | null)?.result,
  );
  if (!tokens) return null;
  const next = sessionFrom(tokens, current.user);
  session.set(next);
  return next;
}
