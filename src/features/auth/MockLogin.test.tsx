import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/routes';
import { LoginPage } from '@/pages/LoginPage';
import { session } from '@/shared/auth/session';

vi.mock('@/shared/auth/mode', () => ({ authMode: 'mock' }));

describe('Mock 로그인 (VITE_USE_MOCK=true)', () => {
  it('디자인의 버튼으로 Mock API 에 로그인한다. 두 번째부터는 이미 가입한 계정이다', async () => {
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

    const first = open();
    await userEvent.click(screen.getByRole('button', { name: 'Google 계정으로 계속하기' }));
    expect(
      await screen.findByText('회원 정보 입력 화면', {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    first.unmount();

    session.clear();
    open();
    await userEvent.click(screen.getByRole('button', { name: 'Google 계정으로 계속하기' }));
    expect(await screen.findByText('새 검색 화면')).toBeInTheDocument();
  });
});
