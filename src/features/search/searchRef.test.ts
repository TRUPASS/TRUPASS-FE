import { GLOBE_COUNTRIES, globePlace } from './countries';
import { readSearchKey, searchPaths } from './searchRef';

describe('검색 주소', () => {
  it('searchId · versionNo 가 둘 다 양의 정수일 때만 읽는다', () => {
    expect(readSearchKey(new URLSearchParams('searchId=12&versionNo=1'))).toEqual({
      searchId: 12,
      versionNo: 1,
    });
    expect(readSearchKey(new URLSearchParams('searchId=12'))).toBeNull();
    expect(readSearchKey(new URLSearchParams('searchId=abc&versionNo=1'))).toBeNull();
    expect(readSearchKey(new URLSearchParams('searchId=0&versionNo=1'))).toBeNull();
    expect(readSearchKey(new URLSearchParams('searchId=1.5&versionNo=1'))).toBeNull();
    expect(readSearchKey(new URLSearchParams('rev=2'))).toBeNull();
  });

  it('검색 중 · 결과 주소를 만든다', () => {
    expect(searchPaths.progress({ searchId: 12, versionNo: 1 })).toBe(
      '/search/progress?searchId=12&versionNo=1',
    );
    expect(searchPaths.results({ searchId: 12, versionNo: 2 })).toBe(
      '/results?searchId=12&versionNo=2',
    );
  });
});

describe('지구본 국가 코드', () => {
  it('백엔드가 지원하는 나라의 alpha-2 를 숫자 코드로 바꾼다', () => {
    expect(Object.fromEntries(Object.entries(GLOBE_COUNTRIES).map(([k, v]) => [k, v.id]))).toEqual({
      KR: '410',
      JP: '392',
      TH: '764',
      TW: '158',
      HK: '344',
      SG: '702',
      VN: '704',
    });
  });

  it('표에 없는 나라는 칠하지 않고(코드 없음), 나라를 모르면 null', () => {
    expect(globePlace('jp', '도쿄')).toEqual({ id: '392', at: undefined, label: '도쿄' });
    expect(globePlace('US', '뉴욕')).toEqual({ id: undefined, at: undefined, label: '뉴욕' });
    expect(globePlace(null, '')).toBeNull();
    // 지도 데이터에 도형이 없는 홍콩 · 싱가포르는 좌표를 함께 준다
    expect(globePlace('SG', '싱가포르')?.at).toEqual([103.82, 1.35]);
  });
});
