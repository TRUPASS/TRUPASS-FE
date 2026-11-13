import { renderHook } from '@testing-library/react';
import { U } from '@/shared/sample/data';
import { displayName, useMember } from './member';
import { parseSessionUser, session, sessionFrom } from './session';

// 로그인 없이 화면만 보는 설정
vi.mock('./mode', () => ({ authMode: 'off' }));

const tokens = {
  accessToken: 'a',
  accessTokenExpiresIn: 1800,
  refreshToken: 'r',
  refreshTokenExpiresIn: 1_209_600,
};
const base = {
  userId: 1,
  email: 'traveler@example.com',
  pictureUrl: null,
  nickname: null,
  profileCompleted: false,
};

describe('member', () => {
  it('부를 이름은 닉네임, 없으면 Google 계정의 이름, 그것도 없으면 이메일의 @ 앞이다', () => {
    expect(displayName({ ...base, name: '김하림', nickname: '도쿄여행자' })).toBe('도쿄여행자');
    expect(displayName({ ...base, name: '김하림', nickname: '  ' })).toBe('김하림');
    expect(displayName({ ...base, name: '김하림' })).toBe('김하림');
    expect(displayName({ ...base, name: '  ' })).toBe('traveler');
    expect(displayName({ ...base, name: null })).toBe('traveler');
  });

  it('회원 정보 입력 전에 저장해 둔 로그인 값(닉네임 · 입력 여부 없음)도 읽고, 입력 전으로 본다', () => {
    const old = { userId: 1, email: 'traveler@example.com', name: '여행자', pictureUrl: null };
    expect(parseSessionUser(old)).toEqual({ ...old, nickname: null, profileCompleted: false });
    expect(parseSessionUser({ ...old, nickname: '도쿄여행자', profileCompleted: true })).toEqual({
      ...old,
      nickname: '도쿄여행자',
      profileCompleted: true,
    });
  });

  it('로그인 없이 보는 설정에서는 남아 있는 로그인 값이 있어도 예시 회원을 보여 준다', () => {
    session.set(sessionFrom(tokens, { ...base, email: 'old@example.com', name: '예전' }));
    const { result } = renderHook(() => useMember());

    expect(result.current).toEqual({ nick: U.nick, name: U.name, email: U.mail });
  });
});
