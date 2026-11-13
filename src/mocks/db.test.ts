import { mockDb } from './db';
import { COMPLETED_PROFILE } from './fixtures/profile';

describe('Mock DB (탭마다 따로 도는 Mock API)', () => {
  it('다른 탭이 가입 · 회원 정보를 저장하면(storage 이벤트) 다음에 다시 읽어 그 값을 본다', () => {
    const { user } = mockDb.signIn({
      sub: 'traveler',
      email: 'traveler@example.com',
      name: '여행자',
    });
    expect(mockDb.findUser(user.userId)?.profile).toBeUndefined(); // 이 탭은 목록을 기억해 둔다

    // 다른 탭이 회원 정보를 저장했다
    const stored = JSON.parse(localStorage.getItem('tp.mock.users') ?? '[]') as {
      profile?: unknown;
    }[];
    stored[0] = { ...stored[0], profile: { ...COMPLETED_PROFILE } };
    localStorage.setItem('tp.mock.users', JSON.stringify(stored));
    window.dispatchEvent(new StorageEvent('storage', { key: 'tp.mock.users' }));

    expect(mockDb.findUser(user.userId)?.profile).toMatchObject({ nickname: '여행자' });
  });
});
