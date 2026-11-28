// 검색 API 목 응답. 필드 이름 · null · 공통 응답 형식을 계약(팀 Notion "엔드포인트" DB, B1 · B2)과 같게 맞춘다.
// 진행 상태는 검색을 시작한 뒤 흐른 시간으로 정한다. 금액은 모두 아래에 고정값으로 적는다 (목에서도 합계를 계산하지 않는다).
import type { Schemas } from '@/shared/api/client';

type SearchStatus = Schemas['SearchStatus'];
type SearchProgressStep = Schemas['SearchProgressStep'];
type SearchCondition = Schemas['SearchCondition'];

/**
 * 검색 목 시나리오 (?mockScenario= 로 고른다. 검색을 시작할 때 정해져 그 검색 내내 쓴다)
 * - searchFailed: 문장 해석 중 몇 초 뒤 FAILED
 * - searchSlow: 숙소 검색에서 멈춰 3분이 넘도록 IN_PROGRESS
 * - skipStay: FLIGHT 다음 STAY 를 건너뛰고 바로 SUMMARY
 * - noBudget: 예산을 말하지 않음 (budgetAmount · budgetGap 이 null)
 * - overBudget: 예산을 넘음 (budgetGap 이 음수)
 * - rateLimited: 검색을 시작하면 429
 */
export const SEARCH_SCENARIOS = [
  'searchFailed',
  'searchSlow',
  'skipStay',
  'noBudget',
  'overBudget',
  'rateLimited',
] as const;
export type SearchScenario = (typeof SEARCH_SCENARIOS)[number];

export function parseSearchScenario(value: string | null | undefined): SearchScenario | undefined {
  const v = value?.toLowerCase();
  return SEARCH_SCENARIOS.find((s) => s.toLowerCase() === v);
}

/** 목 서버에 남는 검색 한 건 */
export interface MockSearch {
  searchId: number;
  versionNo: number;
  userId: number;
  flightSentence: string;
  staySentence: string;
  experienceSentence: string;
  scenario?: SearchScenario;
  /** 시작한 시각 (epoch ms) */
  startedAt: number;
  /** 취소한 시각 (epoch ms) */
  canceledAt?: number;
}

// 시간표 (시작 뒤 ms): 기본은 0–2초 문장 해석, 2–5초 항공, 5–7초 숙소, 7–9초 결과 정리, 그 뒤 완료.
// 단계마다 폴링 간격(1.5초)보다 길게 두어 기본 시나리오에서는 네 단계가 모두 보인다. 건너뛰는 경우는 skipStay 로 본다.
export const SEARCH_TIMELINE = { parsed: 2000, flight: 5000, stay: 7000, done: 9000, failed: 3000 };

interface Phase {
  status: SearchStatus;
  step: SearchProgressStep;
  /** 끝난 시각 (epoch ms). 진행 중이면 없다 */
  endedAt?: number;
}

function naturalPhase(s: MockSearch, at: number): Phase {
  const t = at - s.startedAt;
  const T = SEARCH_TIMELINE;
  if (s.scenario === 'searchFailed') {
    return t < T.failed
      ? { status: 'IN_PROGRESS', step: 'PARSING' }
      : { status: 'FAILED', step: 'PARSING', endedAt: s.startedAt + T.failed };
  }
  if (t < T.parsed) return { status: 'IN_PROGRESS', step: 'PARSING' };
  if (t < T.flight) return { status: 'IN_PROGRESS', step: 'FLIGHT' };
  if (s.scenario === 'searchSlow') return { status: 'IN_PROGRESS', step: 'STAY' };
  if (s.scenario !== 'skipStay' && t < T.stay) return { status: 'IN_PROGRESS', step: 'STAY' };
  if (t < T.done) return { status: 'IN_PROGRESS', step: 'SUMMARY' };
  return { status: 'COMPLETED', step: 'SUMMARY', endedAt: s.startedAt + T.done };
}

/** now 시점의 상태. 취소했으면 취소한 때의 단계에 멈춘다 */
export function searchPhase(s: MockSearch, now: number): Phase {
  if (s.canceledAt !== undefined) {
    return { status: 'CANCELED', step: naturalPhase(s, s.canceledAt).step, endedAt: s.canceledAt };
  }
  return naturalPhase(s, now);
}

const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');

// 문장 해석이 끝나면 알게 되는 여행 조건 (목은 늘 같은 여행: 인천 → 도쿄, 성인 2명 3박)
const TRIP = {
  originCountry: '대한민국',
  destinationCountry: '일본',
  originCountryCode: 'KR',
  destinationCountryCode: 'JP',
  destinationCity: '도쿄',
  departDateFrom: '2026-12-18',
  departDateTo: '2026-12-18',
  departTimeFrom: '06:00',
  departTimeTo: '12:00',
  adultCount: 2,
  nights: 3,
};
const UNKNOWN_TRIP: { [K in keyof typeof TRIP]: null } = {
  originCountry: null,
  destinationCountry: null,
  originCountryCode: null,
  destinationCountryCode: null,
  destinationCity: null,
  departDateFrom: null,
  departDateTo: null,
  departTimeFrom: null,
  departTimeTo: null,
  adultCount: null,
  nights: null,
};
const FLIGHT_OFFER_COUNT = 12;
const PROVIDERS: Record<SearchProgressStep, string[]> = {
  PARSING: [],
  FLIGHT: ['Duffel'],
  STAY: ['LiteAPI'],
  SUMMARY: [],
};

const parsed = (p: Phase) => p.step !== 'PARSING';
const flightFound = (p: Phase) =>
  p.step === 'STAY' || p.step === 'SUMMARY' || p.status === 'COMPLETED';

export function progressOf(s: MockSearch, now: number): Schemas['SearchProgress'] {
  const phase = searchPhase(s, now);
  return {
    searchId: s.searchId,
    versionNo: s.versionNo,
    status: phase.status,
    progressStep: phase.step,
    flightSentence: s.flightSentence,
    staySentence: s.staySentence,
    experienceSentence: s.experienceSentence,
    revisionRequest: null,
    ...(parsed(phase) ? TRIP : UNKNOWN_TRIP),
    flightOfferCount: flightFound(phase) ? FLIGHT_OFFER_COUNT : null,
    providerNames: phase.status === 'IN_PROGRESS' ? PROVIDERS[phase.step] : [],
    startedAt: iso(s.startedAt),
    completedAt: phase.endedAt === undefined ? null : iso(phase.endedAt),
  };
}

// 예산: 시나리오마다 고정값. budgetGap 도 계산하지 않고 적어 둔다 (909,000원 조합 기준)
type Budget = { budgetAmount: number | null; budgetGap: number | null; text: string | null };
const BUDGETS: Record<'normal' | 'over' | 'none', Budget> = {
  normal: { budgetAmount: 1600000, budgetGap: 691000, text: '항공 + 숙소 1,600,000원 이하' },
  over: { budgetAmount: 800000, budgetGap: -109000, text: '항공 + 숙소 800,000원 이하' },
  none: { budgetAmount: null, budgetGap: null, text: null },
};
const budgetOf = (s: MockSearch) =>
  BUDGETS[s.scenario === 'overBudget' ? 'over' : s.scenario === 'noBudget' ? 'none' : 'normal'];

function conditionsOf(s: MockSearch): SearchCondition[] {
  const budget = budgetOf(s).text;
  const rows: Omit<SearchCondition, 'conditionId' | 'sortOrder'>[] = [
    { category: 'FLIGHT', label: '구간', value: '서울(인천) → 도쿄', note: null, changed: false },
    {
      category: 'FLIGHT',
      label: '출발',
      value: '12.18 (금), 오전 06:00 ~ 12:00',
      note: '앞뒤 날짜는 아직 넓혀 찾지 않아 12월 18일로 검색',
      changed: false,
    },
    { category: 'FLIGHT', label: '인원', value: '성인 2명', note: null, changed: false },
    {
      category: 'STAY',
      label: '위치',
      value: '미술관과 가까운 조용한 호텔',
      note: null,
      changed: false,
    },
    { category: 'STAY', label: '기간', value: '3박 (12.18 ~ 12.21)', note: null, changed: false },
    ...(budget
      ? [{ category: 'STAY' as const, label: '예산', value: budget, note: null, changed: false }]
      : []),
    {
      category: 'EXPERIENCE',
      label: '장소',
      value: '미술관, 건축물 위주',
      note: null,
      changed: false,
    },
    { category: 'EXPERIENCE', label: '쇼핑', value: '하루만', note: null, changed: false },
  ];
  return rows.map((row, i) => ({ conditionId: i + 1, sortOrder: i + 1, ...row }));
}

export function versionOf(s: MockSearch, now: number): Schemas['SearchVersion'] {
  const phase = searchPhase(s, now);
  const known = parsed(phase);
  return {
    searchId: s.searchId,
    versionNo: s.versionNo,
    latest: true,
    status: phase.status,
    flightSentence: s.flightSentence,
    staySentence: s.staySentence,
    experienceSentence: s.experienceSentence,
    revisionRequest: null,
    changeSummary: null,
    conditions: known ? conditionsOf(s) : [],
    adultCount: known ? TRIP.adultCount : null,
    nights: known ? TRIP.nights : null,
    budgetAmount: known ? budgetOf(s).budgetAmount : null,
    priceCheckedAt: phase.status === 'COMPLETED' && phase.endedAt ? iso(phase.endedAt) : null,
    startedAt: iso(s.startedAt),
    completedAt: phase.endedAt === undefined ? null : iso(phase.endedAt),
  };
}

/** 검색이 끝났을 때 서버가 저장해 두는 1순위 추천 조합. 끝나지 않았으면 null */
export function combinationOf(s: MockSearch, now: number): Schemas['Combination'] | null {
  const phase = searchPhase(s, now);
  if (phase.status !== 'COMPLETED' || phase.endedAt === undefined) return null;
  const { budgetAmount, budgetGap } = budgetOf(s);
  return {
    combinationId: 40 + s.searchId,
    searchId: s.searchId,
    versionNo: s.versionNo,
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
    budgetAmount,
    budgetGap,
    currency: 'KRW',
    selectedAt: iso(phase.endedAt),
    updatedAt: iso(phase.endedAt),
  };
}
