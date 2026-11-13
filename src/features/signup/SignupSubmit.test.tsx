import { render, screen } from '@testing-library/react';
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
    ],
    { initialEntries: [routes.signup] },
  );
  render(<RouterProvider router={router} />);
  return router;
}
const submit = () => userEvent.click(screen.getByRole('button', { name: '가입하고 검색 시작' }));
const nickname = () => screen.getByLabelText('닉네임');

describe('회원 정보 입력 → 백엔드 저장 (PUT /users/me/profile)', () => {
  it('화면의 값을 백엔드 값으로 바꿔 저장하고, 로그인한 사람의 닉네임을 바꾼 뒤 검색으로 간다', async () => {
    await openSignup();
    await userEvent.clear(nickname());
    await userEvent.type(nickname(), '도쿄여행자');
    await userEvent.selectOptions(screen.getByLabelText('출생 연도'), '1990년');
    await userEvent.click(screen.getByRole('radio', { name: '남성' }));
    await userEvent.click(screen.getByRole('checkbox', { name: '미식 · 맛집' }));
    await userEvent.click(screen.getByRole('checkbox', { name: '약관 전체 동의' }));
    await submit();

    expect(await screen.findByText('새 검색 화면', {}, { timeout: 2000 })).toBeInTheDocument();
    const userId = session.get()?.user.userId ?? -1;
    expect(mockDb.findUser(userId)?.profile).toEqual({
      nickname: '도쿄여행자',
      birthYear: 1990,
      gender: 'MALE',
      interests: ['CULTURE', 'ARCHITECTURE', 'FOOD'],
      agreements: { termsOfService: true, privacyCollection: true, marketing: true },
    });
    expect(session.get()?.user).toMatchObject({ nickname: '도쿄여행자', profileCompleted: true });
  });

  it('성별을 고르지 않고 선택 약관을 빼면 성별 없이, 마케팅 수신 동의 없이 저장한다', async () => {
    await openSignup();
    await userEvent.click(screen.getByRole('checkbox', { name: '(필수) Trupass 이용약관' }));
    await userEvent.click(screen.getByRole('checkbox', { name: '(필수) 개인정보 수집 · 이용' }));
    await submit();

    expect(await screen.findByText('새 검색 화면', {}, { timeout: 2000 })).toBeInTheDocument();
    const saved = mockDb.findUser(session.get()?.user.userId ?? -1)?.profile;
    expect(saved).toMatchObject({ gender: null, birthYear: 1994, nickname: '여행자' });
    expect(saved?.agreements.marketing).toBe(false);
  });

  it('서버가 거절하면(앞뒤 공백을 빼면 한 글자인 닉네임) 이유를 보여 주고 이 화면에 남는다', async () => {
    await openSignup();
    await userEvent.clear(nickname());
    await userEvent.type(nickname(), '   a   ');
    await userEvent.click(screen.getByRole('checkbox', { name: '약관 전체 동의' }));
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('닉네임은 2~12자로 입력해 주세요.');
    expect(screen.queryByText('새 검색 화면')).not.toBeInTheDocument();
    expect(session.get()?.user.profileCompleted).toBe(false);
    expect(screen.getByRole('button', { name: '가입하고 검색 시작' })).toBeEnabled();
  });

  it('서버에 닿지 못하면 다시 시도하라고 알리고 이 화면에 남는다', async () => {
    server.use(http.put('*/users/me/profile', () => HttpResponse.error()));
    await openSignup();
    await userEvent.click(screen.getByRole('checkbox', { name: '약관 전체 동의' }));
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('서버에 연결하지 못했습니다.');
    expect(screen.queryByText('새 검색 화면')).not.toBeInTheDocument();
  });

  it('저장하는 동안에는 단추를 잠가 두 번 보내지 않는다', async () => {
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
    await userEvent.click(screen.getByRole('checkbox', { name: '약관 전체 동의' }));
    await submit();

    const button = screen.getByRole('button', { name: '가입하고 검색 시작' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(calls).toBe(1);
    release();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
