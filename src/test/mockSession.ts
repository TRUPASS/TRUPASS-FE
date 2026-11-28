import { mockDb } from '@/mocks/db';
import { session, sessionFrom } from '@/shared/auth/session';

/** Mock API(MSW)가 받아 주는 토큰으로 로그인한 상태를 만든다. 돌려주는 값은 목 서버의 사용자 */
export function signInMock() {
  const { user } = mockDb.signIn({
    sub: 'traveler',
    email: 'traveler@example.com',
    name: '여행자',
  });
  const until = Date.now() + 30 * 60 * 1000;
  session.set(
    sessionFrom(
      {
        accessToken: `mock-access.${user.userId}.${until}.1`,
        accessTokenExpiresIn: 1800,
        refreshToken: `mock-refresh.${user.userId}.${until + 14 * 86_400_000}.1`,
        refreshTokenExpiresIn: 1_209_600,
      },
      { userId: user.userId, email: user.email, name: user.name, pictureUrl: null },
    ),
  );
  return user;
}
