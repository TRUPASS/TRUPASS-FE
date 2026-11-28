import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { LiveTarget } from '@/features/search/globe';
import { SEARCH_FAILED_TEXT } from '@/features/search/progressText';
import { failure, ok } from '@/mocks/fixtures/auth';
import type { SearchProgress } from '@/shared/api/queries/searches';
import { prompts } from '@/shared/lib/prompts';
import { renderSearchApp, where } from '@/test/searchApp';
import { server } from '@/test/server';

vi.mock('@/shared/auth/mode', () => ({ authMode: 'mock' }));
// jsdom 에는 canvas 가 없다. 지구본에 넘긴 장면과 나라만 받아 둔다
const globe = vi.hoisted(() => ({ target: null as LiveTarget | null }));
vi.mock('@/features/search/SearchGlobe', () => ({
  Globe: () => <canvas role="img" aria-label="예시 지구본" />,
  LiveSearchGlobe: ({ target, label }: { target: LiveTarget; label: string }) => {
    globe.target = target;
    return <canvas role="img" aria-label={label} />;
  },
}));

afterEach(() => {
  globe.target = null;
  for (const k of ['flight', 'stay', 'exp'] as const) prompts.put(k, '');
});

const PATH = '/search/progress?searchId=7&versionNo=1';
const PARSED = {
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

function snapshot(change: Partial<SearchProgress> = {}): SearchProgress {
  return {
    searchId: 7,
    versionNo: 1,
    status: 'IN_PROGRESS',
    progressStep: 'PARSING',
    flightSentence: '12월 18일 인천에서 도쿄, 아침 출발. 성인 2명',
    staySentence: '미술관 근처 조용한 호텔 3박',
    experienceSentence: '미술관과 건축물 탐방',
    revisionRequest: null,
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
    flightOfferCount: null,
    providerNames: [],
    startedAt: new Date().toISOString(),
    completedAt: null,
    ...change,
  };
}

/** 진행 상태 응답을 차례로 준다 (마지막 것을 계속 준다). 몇 번 물었는지 센다 */
function respond(...list: SearchProgress[]) {
  const seen = { count: 0 };
  server.use(
    http.get('*/searches/:searchId/versions/:versionNo/progress', () => {
      const next = list[Math.min(seen.count, list.length - 1)]!;
      seen.count += 1;
      return HttpResponse.json(ok(next));
    }),
  );
  return seen;
}

describe('검색 중 (API)', () => {
  it('진행 상태로 단계 · 지구본 · 여행 조건 · 출처를 그린다', async () => {
    respond(snapshot({ ...PARSED, progressStep: 'FLIGHT', providerNames: ['Duffel'] }));
    renderSearchApp(PATH);

    await waitFor(() => expect(document.body.dataset.stage).toBe('flight'));
    expect(
      screen.getByText('대한민국에서 도쿄로 가는 항공편을 Duffel에서 조회하고 있습니다.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('12.18 (금) 출발 · 오전 06:00 ~ 12:00 · 성인 2명 · 3박'),
    ).toBeInTheDocument();
    expect(screen.getByText('대한민국 출발')).toBeInTheDocument();
    expect(screen.getByText('일본 도착')).toBeInTheDocument();
    expect(screen.getByText('미술관 근처 조용한 호텔 3박')).toBeInTheDocument();
    // 지구본: alpha-2(KR, JP)를 숫자 코드로 바꿔 칠한다
    expect(globe.target).toMatchObject({
      from: { id: '410', label: '대한민국' },
      to: { id: '392', label: '도쿄' },
      scene: 'flight',
    });
    expect(
      screen.getByRole('img', { name: '대한민국에서 일본으로 가는 경로를 표시한 지구본' }),
    ).toBeInTheDocument();
  });

  it('문장 해석 중에는 나라를 모르니 지구본을 기본 상태로 두고 조건 줄을 비운다', async () => {
    respond(snapshot());
    renderSearchApp(PATH);

    await waitFor(() => expect(document.body.dataset.stage).toBe('parse'));
    expect(globe.target).toEqual({ from: null, to: null, scene: 'idle' });
    expect(screen.queryByText(/출발 ·/)).not.toBeInTheDocument();
    expect(screen.queryByText(/도착$/)).not.toBeInTheDocument();
  });

  it('폴링 사이에 숙소 단계를 건너뛰어도(FLIGHT → SUMMARY) 그 단계로 바로 그리고, 찾은 항공권 수만 보여 준다', async () => {
    const seen = respond(
      snapshot({ ...PARSED, progressStep: 'FLIGHT' }),
      snapshot({ ...PARSED, progressStep: 'SUMMARY', flightOfferCount: 12 }),
    );
    renderSearchApp(PATH);

    await waitFor(() => expect(document.body.dataset.stage).toBe('flight'));
    await waitFor(() => expect(document.body.dataset.stage).toBe('done'), { timeout: 4000 });
    expect(seen.count).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText('찾은 항공권 12건과 숙소로 요청에 가까운 조합을 고르고 있습니다.'),
    ).toBeInTheDocument();
  });

  it('COMPLETED 가 오면 결과 화면으로 간다', async () => {
    respond(snapshot({ ...PARSED, status: 'COMPLETED', progressStep: 'SUMMARY' }));
    const router = renderSearchApp(PATH);

    await waitFor(() => expect(where(router)).toBe('/results?searchId=7&versionNo=1'));
  });

  it('FAILED 면 새 검색으로 돌아가 실패 이유를 보여 준다 (failureReason 이 있으면 그 문장)', async () => {
    respond({
      ...snapshot({ status: 'FAILED' }),
      failureReason: '아직 지원하지 않는 도시입니다.',
    } as SearchProgress);
    const router = renderSearchApp(PATH);

    expect(await screen.findByRole('alert')).toHaveTextContent('아직 지원하지 않는 도시입니다.');
    expect(where(router)).toBe('/search');
  });

  it('FAILED 인데 이유가 없으면 기본 안내를 보여 준다', async () => {
    respond(snapshot({ status: 'FAILED' }));
    renderSearchApp(PATH);

    expect(await screen.findByRole('alert')).toHaveTextContent(SEARCH_FAILED_TEXT);
  });

  it('[검색 취소]를 누르면 취소 API 를 부르고 새 검색으로 돌아간다', async () => {
    respond(snapshot({ ...PARSED, progressStep: 'FLIGHT' }));
    let canceled = false;
    server.use(
      http.post('*/searches/:searchId/versions/:versionNo/cancel', ({ params }) => {
        canceled = params.searchId === '7' && params.versionNo === '1';
        return HttpResponse.json(ok({ searchId: 7, versionNo: 1, status: 'CANCELED' }));
      }),
    );
    const router = renderSearchApp(PATH);
    await waitFor(() => expect(document.body.dataset.stage).toBe('flight'));
    await userEvent.click(screen.getByRole('button', { name: '검색 취소' }));

    await waitFor(() => expect(where(router)).toBe('/search'));
    expect(canceled).toBe(true);
    expect(await screen.findByText('검색을 취소했습니다.')).toBeInTheDocument();
  });

  it('이미 끝난 검색이면(409) 진행 상태를 한 번 다시 읽고 그 상태대로 간다', async () => {
    respond(
      snapshot({ ...PARSED, progressStep: 'SUMMARY' }),
      snapshot({ ...PARSED, status: 'COMPLETED', progressStep: 'SUMMARY' }),
    );
    server.use(
      http.post('*/searches/:searchId/versions/:versionNo/cancel', () =>
        HttpResponse.json(failure('SEARCH409_2', '이미 끝난 검색입니다.'), { status: 409 }),
      ),
    );
    const router = renderSearchApp(PATH);
    await waitFor(() => expect(document.body.dataset.stage).toBe('done'));
    await userEvent.click(screen.getByRole('button', { name: '검색 취소' }));

    await waitFor(() => expect(where(router)).toBe('/results?searchId=7&versionNo=1'));
  });

  it('시작한 지 3분이 넘도록 진행 중이면 오래 걸린다고 알리고 취소 버튼을 보인다', async () => {
    respond(
      snapshot({
        ...PARSED,
        progressStep: 'STAY',
        startedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      }),
    );
    renderSearchApp(PATH);

    const note = await screen.findByText(/오래 걸리고 있습니다/);
    expect(note).toBeInTheDocument();
    const box = note.closest('.note') as HTMLElement;
    expect(within(box).getByRole('button', { name: '검색 취소' })).toBeEnabled();
  });

  it('진행 상태를 받지 못하면(없는 검색) 백엔드 문장과 새 검색 링크를 보여 준다', async () => {
    server.use(
      http.get('*/searches/:searchId/versions/:versionNo/progress', () =>
        HttpResponse.json(failure('SEARCH404_1', '검색을 찾을 수 없습니다.'), { status: 404 }),
      ),
    );
    renderSearchApp(PATH);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('검색을 찾을 수 없습니다.');
    expect(within(alert).getByRole('link', { name: '새 검색으로' })).toHaveAttribute(
      'href',
      '/search',
    );
  });

  it('쿼리가 없으면 지금의 예시 화면을 그대로 보여 준다', () => {
    renderSearchApp('/search/progress');
    expect(screen.getByRole('img', { name: '예시 지구본' })).toBeInTheDocument();
    expect(screen.getByText('대한민국 출발')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '결과로 바로 가기' })).toBeInTheDocument();
  });
});
