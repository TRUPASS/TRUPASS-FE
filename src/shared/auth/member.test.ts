import { renderHook } from '@testing-library/react';
import { U } from '@/shared/sample/data';
import { displayName, useMember } from './member';
import { session, sessionFrom } from './session';

// 로그인 없이 화면만 보는 설정
vi.mock('./mode', () => ({ authMode: 'off' }));

const tokens = {
  accessToken: 'a',
  accessTokenExpiresIn: 1800,
  refreshToken: 'r',
  refreshTokenExpiresIn: 1_209_600,
};

describe('member', () => {
  it('부를 이름은 Google 계정의 이름, 없으면 이메일의 @ 앞이다', () => {
    const base = { userId: 1, email: 'traveler@example.com', pictureUrl: null };
    expect(displayName({ ...base, name: '김하림' })).toBe('김하림');
    expect(displayName({ ...base, name: '  ' })).toBe('traveler');
    expect(displayName({ ...base, name: null })).toBe('traveler');
  });

  it('로그인 없이 보는 설정에서는 남아 있는 로그인 값이 있어도 예시 회원을 보여 준다', () => {
    session.set(
      sessionFrom(tokens, { userId: 1, email: 'old@example.com', name: '예전', pictureUrl: null }),
    );
    const { result } = renderHook(() => useMember());

    expect(result.current).toEqual({ nick: U.nick, name: U.name, email: U.mail });
  });
});
