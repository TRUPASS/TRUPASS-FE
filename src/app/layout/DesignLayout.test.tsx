import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/routes';
import { session, sessionFrom } from '@/shared/auth/session';
import { DesignLayout } from './DesignLayout';

vi.mock('@/shared/auth/mode', () => ({ authMode: 'google' }));

const tokens = {
  accessToken: 'a',
  accessTokenExpiresIn: 1800,
  refreshToken: 'r',
  refreshTokenExpiresIn: 1_209_600,
};
const user = {
  userId: 1,
  email: 'traveler@example.com',
  name: '여행자',
  pictureUrl: null,
  nickname: null,
  profileCompleted: false,
};

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: <DesignLayout />,
        children: [
          { path: routes.landing, element: <p>랜딩</p> },
          { path: routes.signup, element: <p>회원 정보 입력 화면</p> },
          { path: routes.search, element: <p>새 검색 화면</p> },
          { path: routes.searching, element: <p>검색 중 화면</p> },
          { path: routes.trips, element: <p>내 여행 화면</p> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  const view = render(<RouterProvider router={router} />);
  return { router, unmount: view.unmount };
}

describe('회원 화면 가드 (DesignLayout)', () => {
  it('회원 정보 입력을 마치지 않은 사람이 앱 안에서 회원 화면으로 오면 회원 정보 입력으로 보낸다', () => {
    session.set(sessionFrom(tokens, user), { confirmed: true }); // 이 탭에서 로그인했다
    for (const path of [routes.search, routes.searching, routes.trips]) {
      const { router, unmount } = renderAt(path);
      expect(router.state.location.pathname).toBe(routes.signup);
      expect(screen.getByText('회원 정보 입력 화면')).toBeInTheDocument();
      unmount();
    }
  });

  it('기기에 남아 있던 값(서버로 확인 전)만으로는 막지 않는다: 앱을 막 열었을 때는 SessionSync 가 확인한 뒤 옮긴다', () => {
    session.set(sessionFrom(tokens, user)); // 예전에 저장해 둔 "입력 전" 값. 다른 기기에서 입력을 마쳤을 수 있다
    const { router } = renderAt(routes.trips);
    expect(router.state.location.pathname).toBe(routes.trips);
    expect(screen.getByText('내 여행 화면')).toBeInTheDocument();
  });

  it('입력 전이어도 랜딩은 그대로 보여 준다', () => {
    session.set(sessionFrom(tokens, user), { confirmed: true });
    renderAt(routes.landing);
    expect(screen.getByText('랜딩')).toBeInTheDocument();
  });

  it('입력을 마쳤으면 막지 않는다', () => {
    session.set(sessionFrom(tokens, { ...user, nickname: '여행자', profileCompleted: true }), {
      confirmed: true,
    });
    renderAt(routes.search);
    expect(screen.getByText('새 검색 화면')).toBeInTheDocument();
  });

  it('로그인하지 않았으면 막지 않는다 (검색 화면은 아직 예시 데이터라 로그인을 요구하지 않는다)', () => {
    renderAt(routes.search);
    expect(screen.getByText('새 검색 화면')).toBeInTheDocument();
  });
});
