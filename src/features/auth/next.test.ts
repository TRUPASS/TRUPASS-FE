import { routes } from '@/app/routes';
import { prompts } from '@/shared/lib/prompts';
import { nextAfterLogin, profileRedirect } from './next';

const done = { profileCompleted: true };
const notYet = { profileCompleted: false };

afterEach(() => {
  for (const k of ['flight', 'stay', 'exp'] as const) prompts.put(k, '');
});

describe('로그인한 뒤 갈 곳', () => {
  it('회원 정보 입력을 마치지 않았으면 회원 정보 입력, 마쳤으면 검색이다', () => {
    expect(nextAfterLogin(notYet)).toBe(routes.signup);
    expect(nextAfterLogin(done)).toBe(routes.search);

    prompts.put('flight', '부산에서 오사카');
    expect(nextAfterLogin(done)).toBe(routes.searching);
  });

  it('앱을 열 때: 입력 전인데 회원 화면에 있으면 회원 정보 입력으로 옮긴다', () => {
    for (const path of [routes.search, routes.results, routes.trips, routes.mandate, '/chat']) {
      expect(profileRedirect(notYet, path)).toBe(routes.signup);
    }
  });

  it('앱을 열 때: 입력 전이어도 랜딩 · 로그인 · 회원 정보 입력 · 스타일 가이드에는 머문다', () => {
    for (const path of [routes.landing, routes.login, routes.signup, routes.styleguide]) {
      expect(profileRedirect(notYet, path)).toBeNull();
    }
  });

  it('앱을 열 때: 입력을 마쳤는데 회원 정보 입력에 있으면 검색으로 옮기고, 다른 화면은 그대로 둔다', () => {
    expect(profileRedirect(done, routes.signup)).toBe(routes.search);
    expect(profileRedirect(done, routes.results)).toBeNull();
    expect(profileRedirect(done, routes.landing)).toBeNull();
  });
});
