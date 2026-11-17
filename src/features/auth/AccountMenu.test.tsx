import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppHeader } from '@/app/layout/AppHeader';
import { routes } from '@/app/routes';
import { SignupPage } from '@/pages/SignupPage';
import { session, sessionFrom } from '@/shared/auth/session';
import { server } from '@/test/server';

vi.mock('@/shared/auth/mode', () => ({ authMode: 'google' }));

const USER = { userId: 3, email: 'harim@example.com', name: '김하림', pictureUrl: null };
function signIn() {
  session.set(
    sessionFrom(
      {
        accessToken: 'a',
        accessTokenExpiresIn: 1800,
        refreshToken: 'refresh-3',
        refreshTokenExpiresIn: 1_209_600,
      },
      USER,
    ),
  );
}

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: routes.landing, element: <p>랜딩</p> },
      { path: routes.login, element: <p>로그인 화면</p> },
      { path: routes.search, element: <AppHeader on="새 검색" /> },
      { path: routes.signup, element: <SignupPage /> },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

describe('계정 메뉴 · 로그인이 필요한 화면', () => {
  it('로그인하지 않았으면 상단 바에 [로그인]을 둔다', () => {
    renderAt(routes.search);
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', routes.login);
  });

  it('로그인했으면 이름을 보여 주고, 메뉴의 [로그아웃]은 refresh token 을 폐기하고 랜딩으로 간다', async () => {
    let revoked = '';
    server.use(
      http.post('*/auth/logout', async ({ request }) => {
        revoked = ((await request.json()) as { refreshToken: string }).refreshToken;
        return HttpResponse.json({ isSuccess: true, code: 'COMMON200', message: '성공했습니다.' });
      }),
    );
    signIn();
    renderAt(routes.search);

    const account = screen.getByRole('button', { name: '김하림님 계정 메뉴' });
    expect(account).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(account);
    expect(screen.getByText('harim@example.com')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(await screen.findByText('랜딩')).toBeInTheDocument();
    await waitFor(() => expect(revoked).toBe('refresh-3'));
    expect(session.get()).toBeNull();
  });

  it('메뉴는 Esc 로 닫히고 초점이 계정 단추로 돌아온다', async () => {
    signIn();
    renderAt(routes.search);
    const account = screen.getByRole('button', { name: '김하림님 계정 메뉴' });

    await userEvent.click(account);
    await userEvent.keyboard('{Escape}');

    expect(account).toHaveAttribute('aria-expanded', 'false');
    expect(account).toHaveFocus();
  });

  it('회원 정보 입력은 로그인해야 볼 수 있다', () => {
    renderAt(routes.signup);
    expect(screen.getByText('로그인 화면')).toBeInTheDocument();
  });

  it('회원 정보 입력은 로그인한 Google 계정의 이메일과 이름을 채워 둔다', () => {
    signIn();
    renderAt(routes.signup);

    expect(screen.getByLabelText('이메일')).toHaveValue('harim@example.com');
    expect(screen.getByLabelText('닉네임')).toHaveValue('김하림');
    expect(screen.getAllByText('harim@example.com').length).toBeGreaterThan(0);
  });
});
