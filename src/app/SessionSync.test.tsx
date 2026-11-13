import { render, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter } from 'react-router';
import { routes } from '@/app/routes';
import { mockDb } from '@/mocks/db';
import { COMPLETED_PROFILE } from '@/mocks/fixtures/profile';
import { loginWithGoogle } from '@/shared/api/auth';
import { session } from '@/shared/auth/session';
import { server } from '@/test/server';
import { SessionSync } from './SessionSync';

vi.mock('@/shared/auth/mode', () => ({ authMode: 'mock' }));
// SessionSync 는 앱의 라우터로 화면을 옮긴다. 테스트에서는 메모리 라우터로 바꿔 끼운다
const app = vi.hoisted(() => ({ router: null as unknown }));
vi.mock('./router', () => ({
  get router() {
    return app.router;
  },
}));

/** GET /users/me 를 붙잡아 두었다가 release() 로 내보내는 핸들러. 응답은 respond() 가 만든다 */
function holdMe(respond: () => object) {
  const hold = { started: false, answered: false, release: () => {} };
  server.use(
    http.get('*/users/me', async () => {
      await new Promise<void>((r) => {
        hold.release = r;
        hold.started = true;
      });
      hold.answered = true;
      return HttpResponse.json({
        isSuccess: true,
        code: 'COMMON200',
        message: '성공했습니다.',
        result: respond(),
      });
    }),
  );
  return hold;
}

function openAt(path: string) {
  const router = createMemoryRouter([{ path: '*', element: null }], { initialEntries: [path] });
  app.router = router;
  render(<SessionSync />);
  return router;
}

describe('SessionSync (앱을 열 때 로그인 · 회원 정보 확인)', () => {
  it('회원 정보 입력을 마치지 않았는데 회원 화면(새 검색)에서 열면 회원 정보 입력으로 옮긴다', async () => {
    await loginWithGoogle('mock:traveler');
    const router = openAt(routes.search);

    await waitFor(() => expect(router.state.location.pathname).toBe(routes.signup));
  });

  it('입력을 마쳤는데 회원 정보 입력에서 열면 검색으로 옮기고, 닉네임을 최신으로 맞춘다', async () => {
    const { user } = await loginWithGoogle('mock:traveler');
    mockDb.saveProfile(user.userId, COMPLETED_PROFILE); // 다른 기기에서 입력을 마쳤다
    const router = openAt(routes.signup);

    await waitFor(() => expect(router.state.location.pathname).toBe(routes.search));
    expect(session.get()?.user).toMatchObject({ nickname: '여행자', profileCompleted: true });
  });

  it('기다리는 사이 회원 정보를 저장했으면, 늦게 온 "입력 전" 응답으로 덮거나 회원 정보 입력으로 되돌리지 않는다', async () => {
    const { user } = await loginWithGoogle('mock:traveler');
    const hold = holdMe(() => ({ ...user, profileCompleted: false }));
    const router = openAt(routes.search);
    await waitFor(() => expect(hold.started).toBe(true));

    session.setUser({ ...user, nickname: '도쿄여행자', profileCompleted: true }); // 저장이 먼저 끝났다
    hold.release();

    await waitFor(() => expect(hold.answered).toBe(true));
    await new Promise((r) => setTimeout(r, 50));
    expect(session.get()?.user).toMatchObject({ nickname: '도쿄여행자', profileCompleted: true });
    expect(router.state.location.pathname).toBe(routes.search);
  });

  it('다른 탭이 같은 내용을 다시 저장해도(storage 이벤트) 백엔드 응답을 버리지 않는다', async () => {
    const { user } = await loginWithGoogle('mock:traveler');
    const hold = holdMe(() => ({ ...user, nickname: '새 닉네임', profileCompleted: false }));
    const router = openAt(routes.search);
    await waitFor(() => expect(hold.started).toBe(true));

    // 내용은 같고 객체만 새로 읽힌다
    window.dispatchEvent(new StorageEvent('storage', { key: 'tp.auth' }));
    hold.release();

    await waitFor(() => expect(router.state.location.pathname).toBe(routes.signup));
    expect(session.get()?.user.nickname).toBe('새 닉네임');
  });
});
