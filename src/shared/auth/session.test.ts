import { act, renderHook } from '@testing-library/react';
import { accessExpired, session, sessionFrom, useSession } from './session';

const USER = { userId: 1, email: 'traveler@example.com', name: '여행자', pictureUrl: null };
const tokens = {
  accessToken: 'a',
  accessTokenExpiresIn: 1800,
  refreshToken: 'r',
  refreshTokenExpiresIn: 1_209_600,
};

describe('session', () => {
  it('백엔드가 준 유효 시간(초)으로 만료 시각을 정하고, 만료 30초 전부터 만료로 본다', () => {
    const s = sessionFrom(tokens, USER, 1_000_000);

    expect(s.accessExpiresAt).toBe(1_000_000 + 1_800_000);
    expect(s.refreshExpiresAt).toBe(1_000_000 + 1_209_600_000);
    expect(accessExpired(s, s.accessExpiresAt - 31_000)).toBe(false);
    expect(accessExpired(s, s.accessExpiresAt - 29_000)).toBe(true);
  });

  it('localStorage 에 두고, 로그인 · 로그아웃할 때 다시 그린다', () => {
    const { result } = renderHook(() => useSession());
    expect(result.current).toBeNull();

    act(() => session.set(sessionFrom(tokens, USER)));
    expect(result.current?.user.email).toBe('traveler@example.com');
    expect(JSON.parse(localStorage.getItem('tp.auth') ?? '{}').refreshToken).toBe('r');

    act(() => session.clear());
    expect(result.current).toBeNull();
    expect(localStorage.getItem('tp.auth')).toBeNull();
  });

  it('다른 탭에서 로그아웃하면 이 탭도 따라간다 (storage 이벤트)', () => {
    const { result } = renderHook(() => useSession());
    act(() => session.set(sessionFrom(tokens, USER)));

    act(() => {
      localStorage.removeItem('tp.auth');
      window.dispatchEvent(new StorageEvent('storage', { key: 'tp.auth' }));
    });

    expect(result.current).toBeNull();
  });

  it('refresh token 까지 만료됐거나 형식이 틀린 값은 버린다', async () => {
    localStorage.setItem(
      'tp.auth',
      JSON.stringify({ ...sessionFrom(tokens, USER, 0), refreshExpiresAt: Date.now() - 1 }),
    );
    expect(session.reload()).toBeNull();
    expect(localStorage.getItem('tp.auth')).toBeNull();

    localStorage.setItem('tp.auth', '{"accessToken": 1}');
    expect(session.reload()).toBeNull();
  });
});
