import { ApiError } from '@/shared/api/client';
import type { SearchProgress } from '@/shared/api/queries/searches';
import {
  apiErrorText,
  clockText,
  dateText,
  failureText,
  providerText,
  SEARCH_FAILED_TEXT,
  shortDate,
  timeText,
  tripFacts,
  withRo,
} from './progressText';

const progress = (change: Partial<SearchProgress> = {}): SearchProgress => ({
  searchId: 1,
  versionNo: 1,
  status: 'IN_PROGRESS',
  progressStep: 'FLIGHT',
  flightSentence: 'f',
  staySentence: 's',
  experienceSentence: 'e',
  providerNames: [],
  startedAt: '2026-11-10T05:01:55Z',
  ...change,
});

describe('검색 화면 문구', () => {
  it('날짜는 "월.일 (요일)", 두 날이 다르면 범위로 보여 준다', () => {
    expect(shortDate('2026-12-18')).toBe('12.18 (금)');
    expect(dateText('2026-12-18', '2026-12-18')).toBe('12.18 (금)');
    expect(dateText('2026-12-17', '2026-12-19')).toBe('12.17 (목) ~ 12.19 (토)');
    expect(dateText(null, null)).toBeNull();
    expect(shortDate('12월 18일')).toBe('12월 18일');
  });

  it('출발 시간대는 정해진 구간이면 이름을 붙이고, 말하지 않았으면 null', () => {
    expect(timeText('06:00', '12:00')).toBe('오전 06:00 ~ 12:00');
    expect(timeText('12:00', '18:00')).toBe('오후 12:00 ~ 18:00');
    expect(timeText('18:00:00', '23:59:00')).toBe('저녁 18:00 ~ 23:59');
    expect(timeText('09:00', '11:00')).toBe('09:00 ~ 11:00');
    expect(timeText(null, null)).toBeNull();
  });

  it('여행 조건 한 줄: 아는 값만 차례로 늘어놓는다', () => {
    expect(
      tripFacts(
        progress({
          departDateFrom: '2026-12-18',
          departDateTo: '2026-12-18',
          departTimeFrom: '06:00',
          departTimeTo: '12:00',
          adultCount: 2,
          nights: 3,
        }),
      ),
    ).toEqual(['12.18 (금) 출발', '오전 06:00 ~ 12:00', '성인 2명', '3박']);
    expect(tripFacts(progress({ adultCount: 1 }))).toEqual(['성인 1명']);
    expect(tripFacts(undefined)).toEqual([]);
  });

  it('받침에 맞춰 으로/로를 붙인다', () => {
    expect(withRo('도쿄')).toBe('도쿄로');
    expect(withRo('서울')).toBe('서울로');
    expect(withRo('방콕')).toBe('방콕으로');
    expect(withRo('홍콩')).toBe('홍콩으로');
    expect(withRo('Bangkok')).toBe('Bangkok(으)로');
  });

  it('실패 이유: failureReason 이 있으면 그 문장, 없으면 기본 안내', () => {
    expect(
      failureText({
        ...progress(),
        failureReason: '아직 지원하지 않는 도시입니다.',
      } as SearchProgress),
    ).toBe('아직 지원하지 않는 도시입니다.');
    expect(failureText(progress())).toBe(SEARCH_FAILED_TEXT);
    expect(failureText({ ...progress(), failureReason: '  ' } as SearchProgress)).toBe(
      SEARCH_FAILED_TEXT,
    );
  });

  it('출처 이름은 글자로 잇고, 서버 시각은 한국 시각으로 보여 준다', () => {
    expect(providerText(['Duffel', 'LiteAPI'])).toBe('Duffel · LiteAPI');
    expect(providerText([])).toBe('');
    expect(clockText('2026-11-10T05:01:55Z')).toBe('14:01');
    expect(clockText(null)).toBe('');
  });

  it('백엔드 오류면 백엔드가 보낸 문장을, 아니면 대신할 문장을 쓴다', () => {
    const tooMany = new ApiError(429, {
      isSuccess: false,
      code: 'SEARCH429_1',
      message: '검색 요청이 너무 잦습니다.',
    });
    expect(apiErrorText(tooMany, '실패')).toBe('검색 요청이 너무 잦습니다.');
    expect(apiErrorText(new TypeError('Failed to fetch'), '실패')).toBe('실패');
  });
});
