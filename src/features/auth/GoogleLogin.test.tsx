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

function renderLogin() {
  const router = createMemoryRouter(
    [
      { path: routes.login, element: <LoginPage /> },
      { path: routes.signup, element: <p>회원 정보 입력 화면</p> },
      { path: routes.search, element: <p>새 검색 화면</p> },
      { path: routes.searching, element: <p>검색 중 화면</p> },
    ],
    { initialEntries: [routes.login] },
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

  it('이미 가입한 계정이고 랜딩에서 적어 둔 문장이 있으면 바로 검색한다', async () => {
    mockDb.signIn({ sub: 'traveler', email: 'traveler@example.com', name: '여행자' });
    prompts.put('flight', '크리스마스 전에 부산에서 오사카');
    renderLogin();
    await userEvent.click(await googleButton());

    expect(await screen.findByText('검색 중 화면')).toBeInTheDocument();
  });

  it('백엔드가 거절하면(이메일 미인증) 이유를 보여 주고 이 화면에 남는다', async () => {
    window.__googleAccount = 'unverified';
    renderLogin();
    await userEvent.click(await googleButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '이메일 인증을 마친 Google 계정으로만 시작할 수 있습니다.',
    );
    expect(session.get()).toBeNull();
    expect(screen.getByRole('heading', { name: 'Google 계정으로 시작합니다' })).toBeInTheDocument();
  });

  it('이미 로그인한 채로 오면 바로 다음 화면으로 보낸다', async () => {
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
    renderLogin();

    expect(await screen.findByText('새 검색 화면')).toBeInTheDocument();
  });
});
