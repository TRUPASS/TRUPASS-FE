import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/routes';
import { mockDb } from '@/mocks/db';
import { LoginPage } from '@/pages/LoginPage';
import { session, sessionFrom } from '@/shared/auth/session';
import { prompts } from '@/shared/lib/prompts';
import { installFakeGoogle, type FakeGoogle } from '@/test/fakeGoogle';

vi.mock('@/shared/auth/mode', () => ({ authMode: 'google' }));
vi.mock('@/shared/lib/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/env')>();
  return { env: { ...actual.env, googleClientId: 'test-client.apps.googleusercontent.com' } };
});

let google: FakeGoogle;
beforeAll(() => {
  google = installFakeGoogle();
});
afterEach(() => {
  window.__googleAccount = undefined;
  // 적어 둔 문장은 모듈이 기억하므로 비워 둔다 (빈 문장은 적지 않은 것으로 본다)
  for (const k of ['flight', 'stay', 'exp'] as const) prompts.put(k, '');
});

function renderLogin(search = '') {
  const router = createMemoryRouter(
    [
      { path: routes.login, element: <LoginPage /> },
      { path: routes.signup, element: <p>회원 정보 입력 화면</p> },
      { path: routes.search, element: <p>새 검색 화면</p> },
      { path: routes.searching, element: <p>검색 중 화면</p> },
    ],
    { initialEntries: [`${routes.login}${search}`] },
  );
  render(<RouterProvider router={router} />);
  return router;
}
const googleButton = () => screen.findByRole('button', { name: 'Google 계정으로 계속하기' });

describe('Google 로그인 (google 모드)', () => {
  it('Google 의 공식 버튼을 "Google 계정으로 계속하기" 모양으로 그린다', async () => {
    renderLogin();
    await googleButton();

    expect(google.initialized).toBe(1);
    expect(google.options).toMatchObject({ text: 'continue_with', shape: 'pill', locale: 'ko' });
  });

  it('처음 온 계정이면 백엔드가 가입시키고 회원 정보 입력으로 간다', async () => {
    renderLogin();
    await userEvent.click(await googleButton());

    expect(
      await screen.findByText('회원 정보 입력 화면', {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(session.get()?.user).toMatchObject({ email: 'traveler@example.com', name: '여행자' });
  });

  it('이미 가입한 계정은 회원 정보 입력을 건너뛰고, 적어 둔 문장이 없으면 새 검색으로 간다', async () => {
    mockDb.signIn({ sub: 'traveler', email: 'traveler@example.com', name: '여행자' });
    renderLogin();
    await userEvent.click(await googleButton());

    expect(await screen.findByText('새 검색 화면')).toBeInTheDocument();
  });

  it('이미 가입한 계정이고 랜딩에서 적어 둔 문장이 있으면 그 문장으로 검색을 시작하러 간다', async () => {
    mockDb.signIn({ sub: 'traveler', email: 'traveler@example.com', name: '여행자' });
    prompts.put('flight', '크리스마스 전에 부산에서 오사카');
    const router = renderLogin('?from=search');
    expect(screen.getByText('크리스마스 전에 부산에서 오사카')).toBeInTheDocument();
    await userEvent.click(await googleButton());

    // 새 검색 화면이 ?start=1 을 보고 적어 둔 문장으로 곧바로 POST /searches 를 보낸다 (SearchPage.test)
    expect(await screen.findByText('새 검색 화면')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?start=1');
  });

  it('일반 로그인은 이전 조건이 남아 있어도 요약을 숨기고 새 검색으로 간다', async () => {
    mockDb.signIn({ sub: 'traveler', email: 'traveler@example.com', name: '여행자' });
    prompts.put('flight', '이전에 적은 여행 조건');
    renderLogin();

    expect(screen.queryByText('이전에 적은 여행 조건')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '문장 다시 적기' })).not.toBeInTheDocument();
    expect(screen.getByText(/Trupass에서 시작하세요/)).toBeInTheDocument();
    await userEvent.click(await googleButton());
    expect(await screen.findByText('새 검색 화면')).toBeInTheDocument();
  });

  it('검색 경로라도 조건이 없으면 일반 로그인으로 안내한다', async () => {
    mockDb.signIn({ sub: 'traveler', email: 'traveler@example.com', name: '여행자' });
    renderLogin('?from=search');
    expect(screen.queryByRole('link', { name: '문장 다시 적기' })).not.toBeInTheDocument();
    await userEvent.click(await googleButton());
    expect(await screen.findByText('새 검색 화면')).toBeInTheDocument();
  });

  it('질문 작성 후 신규 가입은 회원 정보 입력에도 검색 경로를 전달한다', async () => {
    prompts.put('flight', '부산에서 오사카');
    const router = renderLogin('?from=search');
    await userEvent.click(await googleButton());
    expect(
      await screen.findByText('회원 정보 입력 화면', {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(router.state.location.search).toBe('?from=search');
  });

  it('백엔드가 거절하면(이메일 미인증) 이유를 보여 주고 이 화면에 남는다', async () => {
    window.__googleAccount = 'unverified';
    renderLogin();
    await userEvent.click(await googleButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '이메일 인증을 마친 Google 계정으로만 시작할 수 있습니다.',
    );
    expect(session.get()).toBeNull();
    expect(screen.getByRole('heading', { name: 'Trupass 시작하기' })).toBeInTheDocument();
  });

  it.each([
    ['', ''],
    ['?from=search', '?start=1'],
  ])(
    '이미 로그인한 채로 오면 진입 경로 %s에 맞춰 새 검색 화면(%s)으로 보낸다',
    async (search, next) => {
      prompts.put('flight', '부산에서 오사카');
      session.set(
        sessionFrom(
          {
            accessToken: 'a',
            accessTokenExpiresIn: 1800,
            refreshToken: 'r',
            refreshTokenExpiresIn: 1_209_600,
          },
          { userId: 1, email: 'traveler@example.com', name: '여행자', pictureUrl: null },
        ),
      );
      const router = renderLogin(search);

      expect(await screen.findByText('새 검색 화면')).toBeInTheDocument();
      expect(router.state.location.search).toBe(next);
    },
  );
});
