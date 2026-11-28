import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { withNotice } from '@/features/search/notice';
import { mockDb } from '@/mocks/db';
import { failure } from '@/mocks/fixtures/auth';
import { createHandlers } from '@/mocks/handlers';
import { session, sessionFrom } from '@/shared/auth/session';
import { prompts } from '@/shared/lib/prompts';
import { PROMPTS } from '@/shared/sample/data';
import { signInMock } from '@/test/mockSession';
import { renderSearchApp, where } from '@/test/searchApp';
import { server } from '@/test/server';

vi.mock('@/shared/auth/mode', () => ({ authMode: 'mock' }));
// 검색 중 화면으로 넘어간 뒤의 지구본(canvas)은 이 테스트에서 보지 않는다
vi.mock('@/features/search/SearchGlobe', () => ({
  Globe: () => null,
  LiveSearchGlobe: () => null,
}));

afterEach(() => {
  for (const k of ['flight', 'stay', 'exp'] as const) prompts.put(k, '');
});

const lastInput = () => screen.getByRole('textbox', { name: PROMPTS[2]!.q });
const pressEnterOnLast = async () => {
  await userEvent.click(lastInput());
  await userEvent.keyboard('{Enter}');
};

describe('새 검색 (API)', () => {
  it('마지막 칸에서 엔터를 누르면 문장 세 개로 POST /searches 를 보내고 검색 중 화면으로 간다', async () => {
    const user = signInMock();
    const router = renderSearchApp('/search');
    await pressEnterOnLast();

    await waitFor(() => expect(where(router)).toBe('/search/progress?searchId=1&versionNo=1'));
    expect(mockDb.findSearch(1)).toMatchObject({
      userId: user.userId,
      flightSentence: PROMPTS[0]!.v,
      staySentence: PROMPTS[1]!.v,
      experienceSentence: PROMPTS[2]!.v,
    });
  });

  it('보내는 중에는 다시 보내지 않는다', async () => {
    signInMock();
    let calls = 0;
    server.use(
      http.post('*/searches', async () => {
        calls += 1;
        await delay(200);
        return HttpResponse.json({
          isSuccess: true,
          code: 'COMMON200',
          message: '성공했습니다.',
          result: {
            searchId: 5,
            versionNo: 1,
            status: 'IN_PROGRESS',
            progressStep: 'PARSING',
            startedAt: '2026-11-10T05:01:55Z',
          },
        });
      }),
    );
    const router = renderSearchApp('/search');
    await userEvent.click(lastInput());
    await userEvent.keyboard('{Enter}{Enter}{Enter}');

    await waitFor(() => expect(where(router)).toBe('/search/progress?searchId=5&versionNo=1'));
    expect(calls).toBe(1);
  });

  it('요청이 너무 잦으면(429) 백엔드 문장을 보여 주고 적은 문장은 그대로 둔다', async () => {
    signInMock();
    server.use(...createHandlers({ searchScenario: 'rateLimited' }));
    const router = renderSearchApp('/search');
    await userEvent.clear(lastInput());
    await userEvent.type(lastInput(), '현지 시장과 골목 식당');
    await userEvent.keyboard('{Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '검색 요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.',
    );
    expect(where(router)).toBe('/search');
    expect(lastInput()).toHaveValue('현지 시장과 골목 식당');
  });

  it('로그인 전이면 적은 문장을 남겨 두고 로그인으로 보낸다', async () => {
    const router = renderSearchApp('/search');
    await pressEnterOnLast();

    expect(await screen.findByText('로그인 화면', {}, { timeout: 2000 })).toBeInTheDocument();
    expect(where(router)).toBe('/login?from=search');
    expect(prompts.get()).toMatchObject({ flight: PROMPTS[0]!.v, exp: PROMPTS[2]!.v });
  });

  it('토큰을 바꿔도 401 이면(로그인이 풀림) 로그인으로 보낸다', async () => {
    session.set(
      sessionFrom(
        {
          accessToken: 'expired',
          accessTokenExpiresIn: 1800,
          refreshToken: 'revoked',
          refreshTokenExpiresIn: 1_209_600,
        },
        { userId: 1, email: 'traveler@example.com', name: '여행자', pictureUrl: null },
      ),
    );
    const router = renderSearchApp('/search');
    await pressEnterOnLast();

    expect(await screen.findByText('로그인 화면', {}, { timeout: 2000 })).toBeInTheDocument();
    expect(where(router)).toBe('/login?from=search');
    expect(session.get()).toBeNull();
  });

  it('로그인이 남아 있는데도 401 이면 오가며 돌지 않게 문구만 보인다', async () => {
    signInMock();
    server.use(
      http.post('*/searches', () =>
        HttpResponse.json(failure('COMMON401_1', '인증 정보가 올바르지 않습니다.'), {
          status: 401,
        }),
      ),
      http.post('*/auth/refresh', () =>
        HttpResponse.json(
          {
            isSuccess: true,
            code: 'COMMON200',
            message: '성공했습니다.',
            result: {
              accessToken: 'next',
              accessTokenExpiresIn: 1800,
              refreshToken: 'next-r',
              refreshTokenExpiresIn: 1_209_600,
            },
          },
          { status: 200 },
        ),
      ),
    );
    const router = renderSearchApp('/search');
    await pressEnterOnLast();

    expect(await screen.findByRole('alert')).toHaveTextContent('인증 정보가 올바르지 않습니다.');
    expect(where(router)).toBe('/search');
  });

  it('로그인하고 돌아오면(?start=1) 적어 둔 문장으로 곧바로 검색을 시작한다', async () => {
    signInMock();
    prompts.put('flight', '1월 9일 부산에서 오사카, 성인 2명');
    prompts.put('stay', '난바역 근처 깔끔한 호텔 2박');
    prompts.put('exp', '먹거리 위주, 유니버설 하루');
    const router = renderSearchApp('/search?start=1');

    await waitFor(() => expect(where(router)).toBe('/search/progress?searchId=1&versionNo=1'));
    expect(mockDb.findSearch(1)).toMatchObject({
      flightSentence: '1월 9일 부산에서 오사카, 성인 2명',
      staySentence: '난바역 근처 깔끔한 호텔 2박',
      experienceSentence: '먹거리 위주, 유니버설 하루',
    });
  });

  it('검색이 실패해 돌아오면 그 이유를 보여 준다', async () => {
    renderSearchApp({
      pathname: '/search',
      state: withNotice({ tone: 'fail', text: '아직 지원하지 않는 도시입니다.' }),
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('아직 지원하지 않는 도시입니다.');
  });
});
