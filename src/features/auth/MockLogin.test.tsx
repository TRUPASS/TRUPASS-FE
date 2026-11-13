import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/routes';
import { COMPLETED_PROFILE } from '@/mocks/fixtures/profile';
import { LoginPage } from '@/pages/LoginPage';
import { saveProfile } from '@/shared/api/auth';
import { session } from '@/shared/auth/session';

vi.mock('@/shared/auth/mode', () => ({ authMode: 'mock' }));

describe('Mock 로그인 (VITE_USE_MOCK=true)', () => {
  it('디자인의 버튼으로 Mock API 에 로그인한다. 회원 정보 입력을 마칠 때까지는 다시 로그인해도 회원 정보 입력으로 간다', async () => {
    const open = () => {
      const router = createMemoryRouter(
        [
          { path: routes.login, element: <LoginPage /> },
          { path: routes.signup, element: <p>회원 정보 입력 화면</p> },
          { path: routes.search, element: <p>새 검색 화면</p> },
        ],
        { initialEntries: [routes.login] },
      );
      return render(<RouterProvider router={router} />);
    };
    const login = async () => {
      session.clear();
      const view = open();
      await userEvent.click(screen.getByRole('button', { name: 'Google 계정으로 계속하기' }));
      return view;
    };

    // 처음: 가입되고 회원 정보 입력으로
    const first = await login();
    expect(
      await screen.findByText('회원 정보 입력 화면', {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    first.unmount();

    // 입력을 마치지 않고 다시 로그인: 또 회원 정보 입력으로
    const second = await login();
    expect(
      await screen.findByText('회원 정보 입력 화면', {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    await saveProfile(COMPLETED_PROFILE);
    second.unmount();

    // 입력을 마친 뒤 다시 로그인: 검색으로
    await login();
    expect(await screen.findByText('새 검색 화면', {}, { timeout: 2000 })).toBeInTheDocument();
    expect(session.get()?.user).toMatchObject({ nickname: '여행자', profileCompleted: true });
  });
});
