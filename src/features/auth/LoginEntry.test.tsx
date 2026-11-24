import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/routes';
import { LandingFooter } from '@/features/landing/LandingFooter';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { prompts } from '@/shared/lib/prompts';

vi.mock('@/shared/auth/mode', () => ({ authMode: 'off' }));

afterEach(() => {
  for (const key of ['flight', 'stay', 'exp'] as const) prompts.put(key, '');
});

function open(entry: string) {
  const router = createMemoryRouter(
    [
      { path: routes.landing, element: <LandingFooter onHow={() => {}} onTop={() => {}} /> },
      { path: routes.login, element: <LoginPage /> },
      { path: routes.signup, element: <SignupPage /> },
      { path: routes.search, element: <p>새 검색 화면</p> },
      { path: routes.searching, element: <p>검색 중 화면</p> },
    ],
    { initialEntries: [entry] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

it.each([
  ['', '새 검색 화면'],
  ['?from=search', '검색 중 화면'],
])('미리보기 로그인 %s도 회원 정보 입력을 거쳐 %s으로 간다', async (query, destination) => {
  prompts.put('flight', '부산에서 오사카');
  open(`${routes.login}${query}`);
  await userEvent.click(screen.getByRole('link', { name: 'Google 계정으로 계속하기' }));
  const nick = await screen.findByRole('textbox', { name: /닉네임/ });
  expect(nick).toHaveValue('');
  await userEvent.type(nick, '여행자');
  await userEvent.click(await screen.findByRole('checkbox', { name: '약관 전체 동의' }));
  await userEvent.click(screen.getByRole('radio', { name: '선택 안 함' }));
  await userEvent.click(await screen.findByRole('button', { name: '가입하고 검색 시작' }));
  expect(await screen.findByText(destination)).toBeInTheDocument();
});

it('푸터 로그인은 저장된 조건이 있어도 일반 로그인 화면을 연다', async () => {
  prompts.put('flight', '이전에 적은 여행 조건');
  const router = open(routes.landing);
  await userEvent.click(screen.getByRole('link', { name: '로그인' }));
  expect(await screen.findByText(/Trupass에서 시작하세요/)).toBeInTheDocument();
  expect(router.state.location.search).toBe('');
  expect(screen.queryByRole('link', { name: '문장 다시 적기' })).not.toBeInTheDocument();
});
