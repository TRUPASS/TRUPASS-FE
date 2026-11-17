import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Dock } from './Dock';

function renderDock(to?: string) {
  const router = createMemoryRouter(
    [
      { path: '/', element: <Dock placeholder="예) 숙소를 더 가까운 곳으로" to={to} /> },
      { path: '/again', element: <p>다시 검색한 결과</p> },
    ],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
}
const head = () => screen.getByRole('button', { name: /^수정 요청/ });
const area = () => screen.getByRole('textbox', { name: '수정 요청' });

describe('Dock', () => {
  it('머리줄을 누르면 올라오고 입력 칸에 커서가 간다', async () => {
    renderDock('/again');
    expect(head()).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(head());

    expect(head()).toHaveAttribute('aria-expanded', 'true');
    expect(area()).toHaveFocus();
  });

  it('들어온 신호를 놓쳤어도 독 위에서 마우스가 처음 움직이면 올라온다. 터치로는 올라오지 않는다', () => {
    renderDock('/again');

    fireEvent.pointerMove(head(), { pointerType: 'touch' });
    expect(head()).toHaveAttribute('aria-expanded', 'false');

    fireEvent.pointerMove(head(), { pointerType: 'mouse' });
    expect(head()).toHaveAttribute('aria-expanded', 'true');
  });

  it('빈 채로 Esc 를 누르면 내려가고 초점이 머리줄로 돌아온다', async () => {
    renderDock('/again');
    await userEvent.click(head());

    await userEvent.keyboard('{Escape}');

    expect(head()).toHaveAttribute('aria-expanded', 'false');
    expect(head()).toHaveFocus();
  });

  it('글자가 있으면 Esc 를 눌러도 내려가지 않는다', async () => {
    renderDock('/again');
    await userEvent.click(head());
    await userEvent.keyboard('조식 포함{Escape}');

    expect(head()).toHaveAttribute('aria-expanded', 'true');
    expect(area()).toHaveValue('조식 포함');
  });

  it('적은 글자 수를 세고, 글자가 있어야 [다시 검색]이 켜진다', async () => {
    renderDock('/again');
    const send = () => screen.getByRole('link', { name: '다시 검색' });
    expect(screen.getByText('0 / 300')).toBeInTheDocument();
    expect(send()).toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(head());
    await userEvent.keyboard('조식 포함');

    expect(screen.getByText('5 / 300')).toBeInTheDocument();
    expect(send()).not.toHaveAttribute('aria-disabled');
    expect(send()).toHaveClass('pri');
  });

  it('엔터를 누르면 다시 검색한 결과로 간다. 비어 있으면 가지 않는다', async () => {
    renderDock('/again');
    await userEvent.click(head());

    await userEvent.keyboard('{Enter}');
    expect(screen.queryByText('다시 검색한 결과')).not.toBeInTheDocument();

    await userEvent.keyboard('조식 포함{Enter}');
    expect(await screen.findByText('다시 검색한 결과')).toBeInTheDocument();
  });

  it('갈 곳이 없으면 [다시 검색]을 넘어가지 않는 버튼으로 둔다', async () => {
    renderDock();
    await userEvent.click(head());
    await userEvent.keyboard('조식 포함{Enter}');

    expect(screen.getByRole('button', { name: '다시 검색' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '다시 검색' })).not.toBeInTheDocument();
    expect(area()).toHaveValue('조식 포함');
  });
});
