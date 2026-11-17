import { http, HttpResponse } from 'msw';
import { apiClient } from '@/shared/api/client';
import { env } from '@/shared/lib/env';
import { server } from '@/test/server';
import { session, sessionFrom, type Session } from './session';

const USER = { userId: 7, email: 'traveler@example.com', name: '여행자', pictureUrl: null };
const ok = (result: unknown) =>
  HttpResponse.json({ isSuccess: true, code: 'COMMON200', message: '성공했습니다.', result });
const fail = (status: number, code: string) =>
  HttpResponse.json({ isSuccess: false, code, message: code }, { status });

function signIn(over: Partial<Session> = {}) {
  session.set({
    ...sessionFrom(
      {
        accessToken: 'access-1',
        accessTokenExpiresIn: 1800,
        refreshToken: 'refresh-1',
        refreshTokenExpiresIn: 1_209_600,
      },
      USER,
    ),
    ...over,
  });
}

/**
 * 백엔드처럼 동작하는 가짜 서버: 유효한 access token 만 받고, refresh token 은 한 번만 쓸 수 있다.
 * 호출 기록(calls)으로 몇 번 바꿨는지 본다.
 */
function backend({ valid = new Set(['access-1']) } = {}) {
  const calls: string[] = [];
  const used = new Set<string>();
  let n = 1;
  server.use(
    http.get('*/users/me', ({ request }) => {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
      calls.push(`me ${token || '(없음)'}`);
      if (!token) return fail(401, 'COMMON401');
      return valid.has(token) ? ok(USER) : fail(401, 'COMMON401_1');
    }),
    http.post('*/auth/refresh', async ({ request }) => {
      const { refreshToken } = (await request.json()) as { refreshToken: string };
      calls.push(`refresh ${refreshToken}`);
      if (used.has(refreshToken) || !refreshToken.startsWith('refresh-'))
        return fail(401, 'AUTH401_3');
      used.add(refreshToken);
      n += 1;
      valid.add(`access-${n}`);
      return ok({
        tokenType: 'Bearer',
        accessToken: `access-${n}`,
        accessTokenExpiresIn: 1800,
        refreshToken: `refresh-${n}`,
        refreshTokenExpiresIn: 1_209_600,
      });
    }),
  );
  return { calls, valid };
}

describe('authFetch (API 클라이언트)', () => {
  it('로그인 상태면 access token 을 붙인다. 로그인하지 않았으면 붙이지 않는다', async () => {
    const { calls } = backend();
    await apiClient.GET('/users/me');
    signIn();
    const res = await apiClient.GET('/users/me');

    expect(calls).toEqual(['me (없음)', 'me access-1']);
    expect(res.data?.result?.email).toBe('traveler@example.com');
  });

  it('401 을 받으면 토큰 쌍을 바꿔 같은 요청을 한 번 더 보낸다', async () => {
    const { calls } = backend({ valid: new Set() }); // 서버가 access-1 을 더는 받지 않는다
    signIn();

    const res = await apiClient.GET('/users/me');

    expect(res.response.status).toBe(200);
    expect(calls).toEqual(['me access-1', 'refresh refresh-1', 'me access-2']);
    expect(session.get()).toMatchObject({ accessToken: 'access-2', refreshToken: 'refresh-2' });
  });

  it('만료 시각이 지났으면 보내기 전에 먼저 바꾼다', async () => {
    const { calls } = backend();
    signIn({ accessExpiresAt: Date.now() - 1000 });

    await apiClient.GET('/users/me');

    expect(calls).toEqual(['refresh refresh-1', 'me access-2']);
  });

  it('동시에 여러 요청이 401 을 받아도 토큰은 한 번만 바꾼다 (refresh token 은 한 번만 쓸 수 있다)', async () => {
    const { calls } = backend({ valid: new Set() });
    signIn();

    const results = await Promise.all([
      apiClient.GET('/users/me'),
      apiClient.GET('/users/me'),
      apiClient.GET('/users/me'),
    ]);

    expect(results.map((r) => r.response.status)).toEqual([200, 200, 200]);
    expect(calls.filter((c) => c.startsWith('refresh'))).toEqual(['refresh refresh-1']);
    expect(session.get()?.refreshToken).toBe('refresh-2');
  });

  it('refresh token 까지 거절되면 로그인 상태를 지우고 401 을 그대로 돌려준다', async () => {
    const { calls } = backend({ valid: new Set() });
    signIn({ refreshToken: 'stolen' });

    const res = await apiClient.GET('/users/me');

    expect(res.response.status).toBe(401);
    expect(calls).toEqual(['me access-1', 'refresh stolen']);
    expect(session.get()).toBeNull();
  });

  it('다른 탭이 먼저 바꿔 두었으면 그 토큰을 쓰고 다시 바꾸지 않는다', async () => {
    const { calls, valid } = backend({ valid: new Set() });
    signIn();
    // 다른 탭이 refresh-1 을 쓰고 받은 새 쌍을 저장소에 적었다
    valid.add('access-9');
    const fresh = { ...session.get()!, accessToken: 'access-9', refreshToken: 'refresh-9' };
    localStorage.setItem('tp.auth', JSON.stringify(fresh));

    const res = await apiClient.GET('/users/me');

    expect(res.response.status).toBe(200);
    expect(calls).toEqual(['me access-1', 'me access-9']);
  });

  it('로그인 · 재발급 · 로그아웃 경로와 다른 서버로 가는 요청에는 토큰을 싣지 않는다', async () => {
    let seen: string | null = 'unset';
    server.use(
      http.post('*/auth/logout', ({ request }) => {
        seen = request.headers.get('Authorization');
        return ok(undefined);
      }),
    );
    signIn();

    await apiClient.POST('/auth/logout', { body: { refreshToken: 'refresh-1' } });
    expect(seen).toBeNull();

    let outside: string | null = 'unset';
    server.use(
      http.get('https://elsewhere.example/users/me', ({ request }) => {
        outside = request.headers.get('Authorization');
        return ok(USER);
      }),
    );
    await apiClient.GET('/users/me', { baseUrl: 'https://elsewhere.example' });
    expect(outside).toBeNull();
    expect(env.apiBaseUrl).not.toContain('elsewhere');
  });
});
