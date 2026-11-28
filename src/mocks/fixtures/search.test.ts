import {
  combinationOf,
  parseSearchScenario,
  progressOf,
  SEARCH_TIMELINE as T,
  searchPhase,
  versionOf,
  type MockSearch,
} from './search';

const search = (
  scenario?: MockSearch['scenario'],
  change: Partial<MockSearch> = {},
): MockSearch => ({
  searchId: 3,
  versionNo: 1,
  userId: 1,
  flightSentence: '12월 18일 인천에서 도쿄',
  staySentence: '미술관 근처 호텔 3박',
  experienceSentence: '미술관 위주',
  scenario,
  startedAt: 1_800_000_000_000,
  ...change,
});
const steps = (s: MockSearch, times: number[]) =>
  times.map((ms) => {
    const { status, step } = searchPhase(s, s.startedAt + ms);
    return `${status}:${step}`;
  });

describe('검색 목: 진행 상태', () => {
  it('기본: 문장 해석 → 항공 → 숙소 → 결과 정리 → 완료 순서로 경과 시간에 따라 바뀐다', () => {
    expect(steps(search(), [0, T.parsed, T.flight, T.stay, T.done])).toEqual([
      'IN_PROGRESS:PARSING',
      'IN_PROGRESS:FLIGHT',
      'IN_PROGRESS:STAY',
      'IN_PROGRESS:SUMMARY',
      'COMPLETED:SUMMARY',
    ]);
  });

  it('skipStay: 항공 다음 숙소 단계 없이 바로 결과 정리로 간다', () => {
    expect(steps(search('skipStay'), [T.parsed, T.flight, T.stay, T.done])).toEqual([
      'IN_PROGRESS:FLIGHT',
      'IN_PROGRESS:SUMMARY',
      'IN_PROGRESS:SUMMARY',
      'COMPLETED:SUMMARY',
    ]);
  });

  it('searchSlow: 숙소 단계에서 멈춰 3분이 지나도 진행 중이다', () => {
    expect(steps(search('searchSlow'), [T.flight, 4 * 60 * 1000])).toEqual([
      'IN_PROGRESS:STAY',
      'IN_PROGRESS:STAY',
    ]);
  });

  it('searchFailed: 문장 해석 중 몇 초 뒤 FAILED 가 된다', () => {
    expect(steps(search('searchFailed'), [0, T.failed])).toEqual([
      'IN_PROGRESS:PARSING',
      'FAILED:PARSING',
    ]);
  });

  it('취소하면 취소한 때의 단계에서 CANCELED 로 멈춘다', () => {
    const s = search(undefined, { canceledAt: 1_800_000_000_000 + T.parsed + 500 });
    expect(steps(s, [T.done + 1000])).toEqual(['CANCELED:FLIGHT']);
  });

  it('문장 해석이 끝나기 전에는 나라 · 날짜 · 인원이 모두 null 이고, 끝나면 채워진다', () => {
    const s = search();
    const before = progressOf(s, s.startedAt + 100);
    expect(before).toMatchObject({
      status: 'IN_PROGRESS',
      progressStep: 'PARSING',
      originCountryCode: null,
      destinationCountryCode: null,
      destinationCity: null,
      departDateFrom: null,
      departTimeFrom: null,
      adultCount: null,
      nights: null,
      flightOfferCount: null,
      revisionRequest: null,
      providerNames: [],
      completedAt: null,
    });
    const flying = progressOf(s, s.startedAt + T.parsed);
    expect(flying).toMatchObject({
      progressStep: 'FLIGHT',
      originCountry: '대한민국',
      originCountryCode: 'KR',
      destinationCountry: '일본',
      destinationCountryCode: 'JP',
      destinationCity: '도쿄',
      departDateFrom: '2026-12-18',
      departDateTo: '2026-12-18',
      departTimeFrom: '06:00',
      departTimeTo: '12:00',
      adultCount: 2,
      nights: 3,
      flightOfferCount: null,
      providerNames: ['Duffel'],
    });
    expect(progressOf(s, s.startedAt + T.flight).flightOfferCount).toBe(12);
    expect(progressOf(s, s.startedAt + T.done).completedAt).toBe('2027-01-15T08:00:09Z');
  });
});

describe('검색 목: 조건과 조합', () => {
  it('조합은 검색이 끝나기 전에는 없고, 끝나면 fixture 의 금액을 그대로 준다', () => {
    const s = search();
    expect(combinationOf(s, s.startedAt + T.stay)).toBeNull();
    expect(combinationOf(s, s.startedAt + T.done)).toMatchObject({
      flightAmount: 596400,
      stayAmount: 312600,
      addonAmount: 0,
      totalAmount: 909000,
      budgetAmount: 1600000,
      budgetGap: 691000,
      currency: 'KRW',
      addons: [],
    });
  });

  it('예산 없음 · 예산 초과 시나리오', () => {
    const none = search('noBudget');
    expect(combinationOf(none, none.startedAt + T.done)).toMatchObject({
      budgetAmount: null,
      budgetGap: null,
    });
    const over = search('overBudget');
    expect(combinationOf(over, over.startedAt + T.done)).toMatchObject({
      budgetAmount: 800000,
      budgetGap: -109000,
    });
  });

  it('검색 조건: 문장 해석 뒤에 생기고, 예산을 말하지 않으면 예산 조건과 budgetAmount 가 빠진다', () => {
    const s = search();
    expect(versionOf(s, s.startedAt).conditions).toEqual([]);
    const done = versionOf(s, s.startedAt + T.done);
    expect(done).toMatchObject({ latest: true, status: 'COMPLETED', budgetAmount: 1600000 });
    expect(done.conditions.map((c) => `${c.category}:${c.label}`)).toEqual([
      'FLIGHT:구간',
      'FLIGHT:출발',
      'FLIGHT:인원',
      'STAY:위치',
      'STAY:기간',
      'STAY:예산',
      'EXPERIENCE:장소',
      'EXPERIENCE:쇼핑',
    ]);
    const none = search('noBudget');
    const noBudget = versionOf(none, none.startedAt + T.done);
    expect(noBudget.budgetAmount).toBeNull();
    expect(noBudget.conditions.some((c) => c.label === '예산')).toBe(false);
  });

  it('시나리오 이름은 대소문자를 가리지 않고, 모르는 이름은 없는 것으로 본다', () => {
    expect(parseSearchScenario('searchslow')).toBe('searchSlow');
    expect(parseSearchScenario('RATELIMITED')).toBe('rateLimited');
    expect(parseSearchScenario('SOLD_OUT')).toBeUndefined();
    expect(parseSearchScenario(null)).toBeUndefined();
  });
});
