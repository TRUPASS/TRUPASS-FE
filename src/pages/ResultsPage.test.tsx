import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { SEARCH_FAILED_TEXT } from '@/features/search/progressText';
import { mockDb } from '@/mocks/db';
import { ok } from '@/mocks/fixtures/auth';
import { versionOf, type SearchScenario } from '@/mocks/fixtures/search';
import { prompts } from '@/shared/lib/prompts';
import { signInMock } from '@/test/mockSession';
import { renderSearchApp, where } from '@/test/searchApp';
import { server } from '@/test/server';

vi.mock('@/shared/auth/mode', () => ({ authMode: 'mock' }));
vi.mock('@/features/search/SearchGlobe', () => ({
  Globe: () => null,
  LiveSearchGlobe: () => null,
}));

afterEach(() => {
  for (const k of ['flight', 'stay', 'exp'] as const) prompts.put(k, '');
});

/** 로그인하고, 목 서버에 검색 하나를 만든다. ago 는 시작한 지 지난 시간(ms): 10초가 넘으면 끝난 검색이다 */
function searchStarted(ago: number, scenario?: SearchScenario) {
  const user = signInMock();
  return mockDb.createSearch({
    userId: user.userId,
    flightSentence: '12월 18일 인천에서 도쿄, 아침 출발. 성인 2명',
    staySentence: '미술관 근처 조용한 호텔 3박, 160만원 이내',
    experienceSentence: '미술관과 건축물 탐방',
    scenario,
    startedAt: Date.now() - ago,
  });
}

const PATH = '/results?searchId=1&versionNo=1';
const summary = () => screen.findByRole('region', { name: '선택한 조합' });

describe('검색 결과 (API)', () => {
  it('요청 표는 검색 조건으로, [선택한 조합]은 서버 금액 그대로 채운다', async () => {
    searchStarted(60_000);
    renderSearchApp(PATH);

    const panel = await summary();
    expect(within(panel).getByText('대한항공 KE 703 / KE 704')).toBeInTheDocument();
    expect(within(panel).getByText('이코노미, 성인 2명 왕복')).toBeInTheDocument();
    expect(within(panel).getByText('596,400원')).toBeInTheDocument();
    expect(within(panel).getByText('우에노 스테이 인')).toBeInTheDocument();
    expect(within(panel).getByText('스탠다드 더블, 3박, 조식 불포함')).toBeInTheDocument();
    expect(within(panel).getByText('909,000원')).toBeInTheDocument();
    expect(within(panel).getByText('예산 1,600,000원 대비')).toBeInTheDocument();
    expect(within(panel).getByText('691,000원 여유')).toHaveClass('cok');

    const table = await screen.findByRole('table', { name: '적은 문장과 검색에 적용한 조건' });
    expect(
      within(table).getByText('12월 18일 인천에서 도쿄, 아침 출발. 성인 2명'),
    ).toBeInTheDocument();
    expect(within(table).getByText('서울(인천) → 도쿄')).toBeInTheDocument();
    expect(
      within(table).getByText('앞뒤 날짜는 아직 넓혀 찾지 않아 12월 18일로 검색'),
    ).toBeInTheDocument();
    expect(within(table).getByText('항공 + 숙소 1,600,000원 이하')).toBeInTheDocument();
  });

  it('항공권 표 · 수정 요청 독 · 검색 기록은 숨기고 준비 중 안내 한 줄만 둔다', async () => {
    searchStarted(60_000);
    renderSearchApp(PATH);
    const root = document.body;

    await summary();
    expect(screen.getByText('항공권 · 숙소 비교 목록은 준비 중입니다')).toBeInTheDocument();
    expect(root.querySelector('.fo')).toBeNull();
    expect(root.querySelector('.dock')).toBeNull();
    expect(screen.queryByText('검색 기록')).not.toBeInTheDocument();
    expect(screen.queryByText(/항공권 \d+건을 찾았습니다/)).not.toBeInTheDocument();
    // 태블릿 · 모바일의 아래 합계 바도 서버 합계를 쓴다
    expect(root.querySelector('.cta-bar')).toHaveTextContent('909,000원');
  });

  it('예산을 말하지 않았으면 예산 대비를 비교하지 않는다', async () => {
    searchStarted(60_000, 'noBudget');
    renderSearchApp(PATH);

    const panel = await summary();
    expect(within(panel).getByText('정하지 않음')).toBeInTheDocument();
    expect(within(panel).queryByText(/대비/)).not.toBeInTheDocument();
  });

  it('예산을 넘으면 넘은 만큼을 서버의 budgetGap 그대로 보여 준다', async () => {
    searchStarted(60_000, 'overBudget');
    renderSearchApp(PATH);

    const panel = await summary();
    expect(within(panel).getByText('예산 800,000원 대비')).toBeInTheDocument();
    expect(within(panel).getByText('109,000원 초과')).toHaveClass('cbad');
  });

  it('체험 조건이 없으면 "해당 조건 없음"을 보여 준다', async () => {
    const search = searchStarted(60_000);
    server.use(
      http.get('*/searches/:searchId/versions/:versionNo', () => {
        const v = versionOf(search, Date.now());
        return HttpResponse.json(
          ok({ ...v, conditions: v.conditions.filter((c) => c.category !== 'EXPERIENCE') }),
        );
      }),
    );
    renderSearchApp(PATH);

    const table = await screen.findByRole('table', { name: '적은 문장과 검색에 적용한 조건' });
    expect(within(table).getByText('해당 조건 없음')).toBeInTheDocument();
  });

  it('조합이 아직 없고(COMBINATION404_1) 검색이 진행 중이면 검색 중 화면으로 보낸다', async () => {
    searchStarted(3000);
    const router = renderSearchApp(PATH);

    await waitFor(() => expect(where(router)).toBe('/search/progress?searchId=1&versionNo=1'));
  });

  it('조합이 아직 없고 검색이 실패했으면 새 검색으로 보낸다', async () => {
    searchStarted(10_000, 'searchFailed');
    const router = renderSearchApp(PATH);

    await waitFor(() => expect(where(router)).toBe('/search'));
    expect(await screen.findByRole('alert')).toHaveTextContent(SEARCH_FAILED_TEXT);
  });

  it('쿼리가 없으면 예시 결과를 그대로 보여 준다', async () => {
    renderSearchApp('/results');
    expect(
      await screen.findByRole('heading', { name: '항공권 3건을 찾았습니다' }),
    ).toBeInTheDocument();
  });

  it('rev=2 는 searchId 가 있어도 예시 화면이다', async () => {
    renderSearchApp('/results?rev=2&searchId=1&versionNo=1');
    expect(
      await screen.findByRole('heading', { name: '조건을 바꿔 다시 찾았습니다' }),
    ).toBeInTheDocument();
  });
});
