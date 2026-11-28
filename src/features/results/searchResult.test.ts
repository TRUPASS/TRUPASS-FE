import type { Combination, SearchVersion } from '@/shared/api/queries/searches';
import { requestRows, summaryOf } from './searchResult';

const version = (change: Partial<SearchVersion> = {}): SearchVersion => ({
  searchId: 1,
  versionNo: 1,
  latest: true,
  status: 'COMPLETED',
  flightSentence: '12월 18일 인천에서 도쿄',
  staySentence: '미술관 근처 3박',
  experienceSentence: '미술관 위주',
  conditions: [],
  startedAt: '2026-11-10T05:01:55Z',
  ...change,
});

const combination = (change: Partial<Combination> = {}): Combination => ({
  combinationId: 41,
  searchId: 1,
  versionNo: 1,
  flight: {
    flightOfferId: 101,
    airlineName: '대한항공',
    outboundFlightNo: 'KE 703',
    inboundFlightNo: 'KE 704',
    cabinClass: 'ECONOMY',
    passengerCount: 2,
  },
  stay: {
    stayOfferId: 201,
    hotelName: '우에노 스테이 인',
    roomType: '스탠다드 더블',
    nights: 3,
    breakfastIncluded: false,
  },
  addons: [],
  flightAmount: 596400,
  stayAmount: 312600,
  addonAmount: 0,
  totalAmount: 909000,
  budgetAmount: 1600000,
  budgetGap: 691000,
  currency: 'KRW',
  selectedAt: '2026-11-10T05:02:30Z',
  updatedAt: '2026-11-10T05:02:30Z',
  ...change,
});

describe('요청 표 매핑', () => {
  it('category 로 문장을 나누고 sortOrder 순서로 늘어놓는다. note 는 표식, changed 는 바뀐 조건', () => {
    const rows = requestRows(
      version({
        conditions: [
          {
            conditionId: 9,
            category: 'STAY',
            label: '기간',
            value: '3박',
            changed: false,
            sortOrder: 5,
          },
          {
            conditionId: 3,
            category: 'FLIGHT',
            label: '출발',
            value: '12.18 (금)',
            note: '돌아오는 날을 몰라 3박으로 검색',
            changed: false,
            sortOrder: 2,
          },
          {
            conditionId: 2,
            category: 'FLIGHT',
            label: '구간',
            value: '서울 → 도쿄',
            note: null,
            changed: false,
            sortOrder: 1,
          },
          {
            conditionId: 7,
            category: 'STAY',
            label: '위치',
            value: '우에노역 5분',
            note: null,
            changed: true,
            sortOrder: 4,
          },
        ],
      }),
    );
    expect(rows.flight.sentence).toBe('12월 18일 인천에서 도쿄');
    expect(rows.flight.conds.map((c) => [c.name, c.value, c.mark])).toEqual([
      ['구간', '서울 → 도쿄', undefined],
      ['출발', '12.18 (금)', '돌아오는 날을 몰라 3박으로 검색'],
    ]);
    expect(rows.stay.conds.map((c) => [c.name, c.mark, c.changed])).toEqual([
      ['위치', '변경', true],
      ['기간', undefined, false],
    ]);
    // 체험 조건이 없으면 빈 묶음 (화면은 "해당 조건 없음")
    expect(rows.exp.conds).toEqual([]);
  });
});

describe('선택한 조합 매핑', () => {
  it('금액은 서버 값을 그대로 쓴다 (합계는 totalAmount, 예산 대비는 budgetGap)', () => {
    const { sum, pax } = summaryOf(combination({ totalAmount: 1, budgetGap: -7 }), 2);
    expect(pax).toBe('성인 2명');
    expect(sum.total).toBe(1);
    expect(sum.left).toBe(-7);
    expect(sum.lines).toEqual([
      { k: '항공권', t: '대한항공 KE 703 / KE 704', s: '이코노미, 성인 2명 왕복', p: 596400 },
      { k: '숙소', t: '우에노 스테이 인', s: '스탠다드 더블, 3박, 조식 불포함', p: 312600 },
    ]);
  });

  it('예산이 없으면 left 는 null, 추가 선택 금액이 있을 때만 그 줄을 보인다', () => {
    expect(summaryOf(combination({ budgetAmount: null, budgetGap: null })).sum.left).toBeNull();
    const withAddon = summaryOf(combination({ addonAmount: 30000 })).sum.lines;
    expect(withAddon.at(-1)).toMatchObject({ k: '추가', p: 30000 });
    expect(summaryOf(combination()).pax).toBe('2명');
  });
});
