import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Dock } from './Dock';

function renderDock(to?: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <>
            <p>바깥</p>
            <Dock placeholder="예) 숙소를 더 가까운 곳으로" to={to} />
          </>
        ),
      },
      { path: '/again', element: <p>다시 검색한 결과</p> },
    ],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
}
const head = () => screen.getByRole('button', { name: /^수정 요청/ });
const toggle = () => screen.getByRole('button', { name: /^입력 창/ });
const area = () => screen.getByRole('textbox', { name: '수정 요청' });

/** 머리줄을 눌러 올리고 입력 칸을 눌러 커서를 둔다 */
async function openAndFocus() {
  await userEvent.click(head());
  await userEvent.click(area());
}

describe('Dock', () => {
  it('머리줄을 누르면 올라온다. 입력 칸으로 커서를 옮기지는 않는다', async () => {
    renderDock('/again');
    expect(head()).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(head());

    expect(head()).toHaveAttribute('aria-expanded', 'true');
    expect(area()).not.toHaveFocus();
  });

  it('마우스를 올리기만 해서는 올라오지 않는다', () => {
    renderDock('/again');

    fireEvent.pointerEnter(head(), { pointerType: 'mouse' });
    fireEvent.pointerMove(head(), { pointerType: 'mouse' });

    expect(head()).toHaveAttribute('aria-expanded', 'false');
  });

  it('올라온 뒤 머리줄을 다시 눌러도 내려가지 않고, 화살표 단추를 누르면 내려간다', async () => {
    renderDock('/again');
    await userEvent.click(toggle());
    expect(head()).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(head());
    expect(head()).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(toggle());
    expect(head()).toHaveAttribute('aria-expanded', 'false');
  });

  it('바깥을 누르면 적던 글이 있어도 내려가고, 글은 남는다', async () => {
    renderDock('/again');
    await openAndFocus();
    await userEvent.keyboard('조식 포함');

    await userEvent.click(screen.getByText('바깥'));

    expect(head()).toHaveAttribute('aria-expanded', 'false');
    expect(area()).toHaveValue('조식 포함');
  });

  it('빈 채로 Esc 를 누르면 내려가고 초점이 머리줄로 돌아온다', async () => {
    renderDock('/again');
    await openAndFocus();

    await userEvent.keyboard('{Escape}');

    expect(head()).toHaveAttribute('aria-expanded', 'false');
    expect(head()).toHaveFocus();
  });

  it('글자가 있으면 Esc 를 눌러도 내려가지 않는다', async () => {
    renderDock('/again');
    await openAndFocus();
    await userEvent.keyboard('조식 포함{Escape}');

    expect(head()).toHaveAttribute('aria-expanded', 'true');
    expect(area()).toHaveValue('조식 포함');
  });

  it('적은 글자 수를 세고, 글자가 있어야 [다시 검색]이 켜진다', async () => {
    renderDock('/again');
    const send = () => screen.getByRole('link', { name: '다시 검색' });
    expect(screen.getByText('0 / 300')).toBeInTheDocument();
    expect(send()).toHaveAttribute('aria-disabled', 'true');

    await openAndFocus();
    await userEvent.keyboard('조식 포함');

    expect(screen.getByText('5 / 300')).toBeInTheDocument();
    expect(send()).not.toHaveAttribute('aria-disabled');
    expect(send()).toHaveClass('pri');
  });

  it('엔터를 누르면 다시 검색한 결과로 간다. 비어 있으면 가지 않는다', async () => {
    renderDock('/again');
    await openAndFocus();

    await userEvent.keyboard('{Enter}');
    expect(screen.queryByText('다시 검색한 결과')).not.toBeInTheDocument();

    await userEvent.keyboard('조식 포함{Enter}');
    expect(await screen.findByText('다시 검색한 결과')).toBeInTheDocument();
  });

  it('갈 곳이 없으면 [다시 검색]을 넘어가지 않는 버튼으로 둔다', async () => {
    renderDock();
    await openAndFocus();
    await userEvent.keyboard('조식 포함{Enter}');

    expect(screen.getByRole('button', { name: '다시 검색' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '다시 검색' })).not.toBeInTheDocument();
    expect(area()).toHaveValue('조식 포함');
  });
});
