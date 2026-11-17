import { forgetScrollOnFreshVisit, SCROLL_KEY } from './scrollMemory';

// 이 방문이 어떻게 시작됐는지(주소 입력 · 새로고침 · 뒤로 가기)를 브라우저 대신 알려 준다
function visitBy(type: string) {
  Object.defineProperty(performance, 'getEntriesByType', {
    configurable: true,
    value: () => [{ type }],
  });
}

describe('forgetScrollOnFreshVisit', () => {
  beforeEach(() => sessionStorage.setItem(SCROLL_KEY, '{"default":1800}'));

  it('주소를 열어 새로 들어온 방문이면 적어 둔 스크롤 자리를 지운다', () => {
    visitBy('navigate');
    forgetScrollOnFreshVisit();
    expect(sessionStorage.getItem(SCROLL_KEY)).toBeNull();
  });

  it.each(['reload', 'back_forward'])('%s 이면 자리를 남겨 둔다', (type) => {
    visitBy(type);
    forgetScrollOnFreshVisit();
    expect(sessionStorage.getItem(SCROLL_KEY)).toBe('{"default":1800}');
  });
});
