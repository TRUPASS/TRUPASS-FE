import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/routes';
import { mockDb } from '@/mocks/db';
import { SignupPage } from '@/pages/SignupPage';
import { loginWithGoogle } from '@/shared/api/auth';
import { session } from '@/shared/auth/session';
import { server } from '@/test/server';

// Mock API(MSW)가 백엔드와 같은 규칙으로 회원 정보를 검사하고 저장한다
vi.mock('@/shared/auth/mode', () => ({ authMode: 'mock' }));

async function openSignup() {
  await loginWithGoogle('mock:traveler'); // 막 가입해서 회원 정보 입력 전이다
  const router = createMemoryRouter(
    [
      { path: routes.signup, element: <SignupPage /> },
      { path: routes.search, element: <p>새 검색 화면</p> },
      { path: routes.login, element: <p>로그인 화면</p> },
      { path: routes.landing, element: <p>랜딩</p> },
    ],
    { initialEntries: [routes.signup] },
  );
  render(<RouterProvider router={router} />);
  return router;
}
const submit = () => userEvent.click(screen.getByRole('button', { name: '가입하고 검색 시작' }));
const nickname = () => screen.getByLabelText('닉네임');
const birth = () => screen.getByLabelText<HTMLSelectElement>('출생 연도');
/** 꼭 채워야 하는 칸(출생 연도 · 필수 약관)만 채운다 */
async function fillRequired(year = '1994년') {
  await userEvent.selectOptions(birth(), year);
  await userEvent.click(screen.getByRole('checkbox', { name: '(필수) Trupass 이용약관' }));
  await userEvent.click(screen.getByRole('checkbox', { name: '(필수) 개인정보 수집 · 이용' }));
}
const savedProfile = () => mockDb.findUser(session.get()?.user.userId ?? -1)?.profile;

describe('회원 정보 입력 → 백엔드 저장 (PUT /users/me/profile)', () => {
  it('사람이 고르지 않은 예시 값은 없다: 출생 연도는 비어 있고 관심사는 하나도 고르지 않은 채 시작한다', async () => {
    await openSignup();

    expect(birth().value).toBe('');
    expect(screen.getByRole('option', { name: '선택해 주세요' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '문화 · 예술' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: '선택 안 함' })).toBeChecked();
  });

  it('출생 연도를 고르지 않으면 넘어가지 않는다', async () => {
    await openSignup();
    await userEvent.click(screen.getByRole('checkbox', { name: '약관 전체 동의' }));
    await submit();

    expect(screen.queryByText('새 검색 화면')).not.toBeInTheDocument();
    expect(birth()).toBeInvalid();
    expect(savedProfile()).toBeUndefined();
  });

  it('화면의 값을 백엔드 값으로 바꿔 저장하고, 로그인한 사람의 닉네임을 바꾼 뒤 검색으로 간다', async () => {
    await openSignup();
    await userEvent.clear(nickname());
    await userEvent.type(nickname(), '도쿄여행자');
    await userEvent.selectOptions(birth(), '1990년');
    await userEvent.click(screen.getByRole('radio', { name: '남성' }));
    await userEvent.click(screen.getByRole('checkbox', { name: '미식 · 맛집' }));
    await userEvent.click(screen.getByRole('checkbox', { name: '건축 · 도시 산책' }));
    await userEvent.click(screen.getByRole('checkbox', { name: '약관 전체 동의' }));
    await submit();

    expect(await screen.findByText('새 검색 화면', {}, { timeout: 2000 })).toBeInTheDocument();
    expect(savedProfile()).toMatchObject({
      nickname: '도쿄여행자',
      birthYear: 1990,
      gender: 'MALE',
      interests: ['FOOD', 'ARCHITECTURE'],
      agreements: { termsOfService: true, privacyCollection: true, marketing: true },
      marketingAgreedAt: expect.any(String),
    });
    expect(session.get()?.user).toMatchObject({ nickname: '도쿄여행자', profileCompleted: true });
  });

  it('성별을 고르지 않고 선택 약관을 빼면 성별 없이, 마케팅 수신 동의 없이 저장한다', async () => {
    await openSignup();
    await fillRequired();
    await submit();

    expect(await screen.findByText('새 검색 화면', {}, { timeout: 2000 })).toBeInTheDocument();
    expect(savedProfile()).toMatchObject({
      nickname: '여행자',
      birthYear: 1994,
      gender: null,
      interests: [],
      agreements: { marketing: false },
      marketingAgreedAt: null,
    });
  });

  it('서버가 거절하면(앞뒤 공백을 빼면 한 글자인 닉네임) 이유를 보여 주고 이 화면에 남는다', async () => {
    await openSignup();
    await userEvent.clear(nickname());
    await userEvent.type(nickname(), '   a   ');
    await fillRequired();
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('닉네임은 2~12자로 입력해 주세요.');
    expect(screen.queryByText('새 검색 화면')).not.toBeInTheDocument();
    expect(session.get()?.user.profileCompleted).toBe(false);
    expect(screen.getByRole('button', { name: '가입하고 검색 시작' })).toBeEnabled();
  });

  it('서버에 닿지 못하면 다시 시도하라고 알리고 이 화면에 남는다', async () => {
    server.use(http.put('*/users/me/profile', () => HttpResponse.error()));
    await openSignup();
    await fillRequired();
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('서버에 연결하지 못했습니다.');
    expect(screen.queryByText('새 검색 화면')).not.toBeInTheDocument();
  });

  it('저장하는 동안에는 단추를 잠가 두 번 보내지 않고, 스크린리더에 저장 중임을 알린다', async () => {
    let calls = 0;
    let release: () => void = () => {};
    server.use(
      http.put('*/users/me/profile', async () => {
        calls += 1;
        await new Promise<void>((r) => (release = r));
        return HttpResponse.error();
      }),
    );
    await openSignup();
    await fillRequired();
    await submit();

    const button = screen.getByRole('button', { name: '가입하고 검색 시작' });
    expect(button).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('회원 정보를 저장하는 중입니다.');
    await userEvent.click(button);
    expect(calls).toBe(1);
    release();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('저장을 기다리는 사이 로그아웃하면, 응답이 와도 검색 화면으로 끌려가지 않는다', async () => {
    let release: () => void = () => {};
    server.use(
      http.put('*/users/me/profile', async ({ request }) => {
        await new Promise<void>((r) => (release = r));
        const user = session.get()?.user;
        const body = (await request.json()) as { nickname: string };
        return HttpResponse.json({
          isSuccess: true,
          code: 'COMMON200',
          message: '성공했습니다.',
          result: { userId: 1, email: 'traveler@example.com', ...user, ...body },
        });
      }),
    );
    const router = await openSignup();
    await fillRequired();
    await submit();

    session.clear(); // 다른 탭에서 로그아웃한 것처럼
    expect(await screen.findByText('로그인 화면')).toBeInTheDocument();
    release();
    await new Promise((r) => setTimeout(r, 100));

    expect(router.state.location.pathname).toBe(routes.login);
    expect(screen.queryByText('새 검색 화면')).not.toBeInTheDocument();
  });

  it('저장을 기다리는 사이 로그인한 채로 다른 화면(랜딩)으로 떠나면, 응답이 와도 검색으로 끌려가지 않는다', async () => {
    let release: () => void = () => {};
    let started = false;
    server.use(
      http.put('*/users/me/profile', async () => {
        started = true;
        await new Promise<void>((r) => (release = r));
        // 저장은 성공했다: 저장 뒤 이동 판단(아직 이 화면에 있는가)을 지키는 테스트다
        const user = session.get()?.user;
        return HttpResponse.json({
          isSuccess: true,
          code: 'COMMON200',
          message: '성공했습니다.',
          result: { ...user, nickname: '여행자', profileCompleted: true },
        });
      }),
    );
    const router = await openSignup();
    await fillRequired();
    await submit();
    await waitFor(() => expect(started).toBe(true));

    await router.navigate(routes.landing); // 로고를 누른 것처럼
    expect(await screen.findByText('랜딩')).toBeInTheDocument(); // 회원 정보 입력 화면이 내려간 뒤
    release();
    await new Promise((r) => setTimeout(r, 100));

    expect(router.state.location.pathname).toBe(routes.landing);
    expect(session.get()).not.toBeNull();
  });

  it('저장을 기다리는 사이 다른 탭에서 다른 계정으로 바뀌면, 새 계정의 폼이 잠기지 않은 채 새로 열린다', async () => {
    let release: () => void = () => {};
    let started = false;
    server.use(
      http.put('*/users/me/profile', async () => {
        started = true;
        await new Promise<void>((r) => (release = r));
        return HttpResponse.error();
      }),
    );
    await openSignup();
    await fillRequired();
    await submit();
    await waitFor(() => expect(started).toBe(true));
    expect(screen.getByRole('button', { name: '가입하고 검색 시작' })).toBeDisabled();

    const other = session.get();
    if (!other) throw new Error('로그인 상태가 없다');
    session.set({ ...other, user: { ...other.user, userId: 99, email: 'other@example.com' } });
    release();

    expect(await screen.findByDisplayValue('other@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '가입하고 검색 시작' })).toBeEnabled();
    expect(birth().value).toBe('');
  });
});
