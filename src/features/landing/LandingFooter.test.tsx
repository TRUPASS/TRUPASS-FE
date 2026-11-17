import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/routes';
import { session, sessionFrom } from '@/shared/auth/session';
import { server } from '@/test/server';
import { LandingFooter } from './LandingFooter';

vi.mock('@/shared/auth/mode', () => ({ authMode: 'google' }));

it('푸터에서 로그인 상태에 따라 계정 버튼이 바뀌고 로그아웃할 수 있다', async () => {
  let revoked = '';
  server.use(
    http.post('*/auth/logout', async ({ request }) => {
      revoked = ((await request.json()) as { refreshToken: string }).refreshToken;
      return HttpResponse.json({ isSuccess: true, code: 'COMMON200' });
    }),
  );
  const router = createMemoryRouter([
    { path: routes.landing, element: <LandingFooter onHow={() => {}} onTop={() => {}} /> },
  ]);
  render(<RouterProvider router={router} />);

  expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', routes.login);
  act(() => {
    session.set(
      sessionFrom(
        {
          accessToken: 'access-1',
          accessTokenExpiresIn: 1800,
          refreshToken: 'refresh-1',
          refreshTokenExpiresIn: 1_209_600,
        },
        { userId: 1, email: 'traveler@example.com', name: '여행자', pictureUrl: null },
      ),
    );
  });

  expect(screen.queryByRole('link', { name: '로그인' })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

  expect(await screen.findByRole('link', { name: '로그인' })).toBeInTheDocument();
  expect(session.get()).toBeNull();
  await waitFor(() => expect(revoked).toBe('refresh-1'));
});
