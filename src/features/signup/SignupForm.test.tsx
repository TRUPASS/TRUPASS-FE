import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/routes';
import { SignupForm } from './SignupForm';

function renderForm() {
  const router = createMemoryRouter(
    [
      { path: routes.signup, element: <SignupForm /> },
      { path: routes.searching, element: <p>검색 중 화면</p> },
    ],
    { initialEntries: [routes.signup] },
  );
  render(<RouterProvider router={router} />);
}
const box = (name: string) => screen.getByRole<HTMLInputElement>('checkbox', { name });
const INTERESTS = ['미식 · 맛집', '관광 · 명소', '쇼핑', '휴양 · 온천', '문화 · 예술'];

describe('SignupForm', () => {
  it('관심사는 세 개까지 고른다. 다 고르면 나머지 칸이 잠기고 하나를 풀면 다시 열린다', async () => {
    renderForm();
    expect(box('문화 · 예술')).toBeChecked();
    expect(box('건축 · 도시 산책')).toBeChecked();

    await userEvent.click(box('미식 · 맛집'));
    expect(box('미식 · 맛집')).toBeChecked();
    expect(box('쇼핑')).toBeDisabled();
    expect(box('문화 · 예술')).toBeEnabled();

    await userEvent.click(box('문화 · 예술'));
    expect(INTERESTS.every((name) => !box(name).disabled)).toBe(true);
  });

  it('약관 전체 동의는 세 약관을 함께 켜고, 하나를 풀면 전체 동의도 풀린다', async () => {
    renderForm();
    const all = box('약관 전체 동의');
    const optional = box('(선택) 여행 혜택 · 알림 수신');
    expect(all).not.toBeChecked();
    expect(optional).not.toBeChecked();

    await userEvent.click(all);
    expect(optional).toBeChecked();
    expect(box('(필수) Trupass 이용약관')).toBeChecked();

    await userEvent.click(optional);
    expect(all).not.toBeChecked();
  });

  it('닉네임의 글자 수를 센다', async () => {
    renderForm();
    const nick = screen.getByLabelText('닉네임');

    await userEvent.clear(nick);
    await userEvent.type(nick, '여행자');

    expect(screen.getByText('3 / 12')).toBeInTheDocument();
  });

  it('필수 약관에 동의해야 검색 중 화면으로 넘어간다', async () => {
    renderForm();
    const submit = screen.getByRole('button', { name: '가입하고 검색 시작' });

    await userEvent.click(box('(필수) 개인정보 수집 · 이용'));
    await userEvent.click(submit);
    expect(screen.queryByText('검색 중 화면')).not.toBeInTheDocument();

    await userEvent.click(box('(필수) 개인정보 수집 · 이용'));
    await userEvent.click(submit);
    expect(await screen.findByText('검색 중 화면')).toBeInTheDocument();
  });
});
