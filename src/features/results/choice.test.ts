import { act, renderHook } from '@testing-library/react';
import { combo, V1, type StayMap } from '@/shared/sample/data';
import { gapText, useChoice } from './choice';

const start = () => renderHook(() => useChoice(V1, false)).result;

describe('useChoice', () => {
  it('처음에는 골라 둔 조합의 합계를 내고, 알림 문구는 비어 있다', () => {
    const c = start();

    expect(c.current.choice).toEqual({ f: 'F1', h: 'H4', bag: false, meal: false });
    expect(c.current.sum.lines.map((l) => l.k)).toEqual(['항공권', '숙소']);
    expect(c.current.sum).toMatchObject({ total: 909000, left: 691000 });
    expect(c.current.open).toEqual([]);
    expect(c.current.say).toBe('');
  });

  it('고른 항공권의 숙소를 처음부터 펼쳐 둘 수 있다', () => {
    const { result } = renderHook(() => useChoice(V1, true));

    expect(result.current.open).toEqual(['F1']);
  });

  it('항공권을 고르면 그 줄의 숙소를 펼치고, 고른 숙소를 그 일정의 요금으로 이어 간다', () => {
    const c = start();

    act(() => c.current.pickFlight('F2'));

    expect(c.current.choice).toMatchObject({ f: 'F2', h: 'H4' });
    expect(c.current.open).toEqual(['F2']);
    expect(c.current.sum.total).toBe(438200 + 298200);
    expect(c.current.say).toBe('합계 736,400원, 예산 대비 863,600원 여유');
  });

  it('이미 고른 항공권을 다시 고르면 숙소만 펼치고 알리지 않는다', () => {
    const c = start();

    act(() => c.current.pickFlight('F1'));

    expect(c.current.open).toEqual(['F1']);
    expect(c.current.say).toBe('');
  });

  it('고른 숙소가 새 항공권의 일정에 없으면 그 일정의 첫 숙소로 바꾼다', () => {
    const map: StayMap = {
      F1: [
        ['H4', 300000],
        ['H5', 400000],
      ],
      F2: [
        ['H6', 250000],
        ['H7', 420000],
      ],
      F3: [['H4', 310000]],
    };
    const { result: c } = renderHook(() => useChoice(combo({ map }), false));

    act(() => c.current.pickFlight('F2'));

    expect(c.current.choice).toMatchObject({ f: 'F2', h: 'H6' });
    expect(c.current.sum.total).toBe(438200 + 250000);
  });

  it('숙소를 고르면 그 숙소가 딸린 항공권도 함께 고른다', () => {
    const c = start();

    act(() => c.current.pickStay('F3', 'H5'));

    expect(c.current.choice).toMatchObject({ f: 'F3', h: 'H5' });
    expect(c.current.sum.total).toBe(742000 + 421800);
  });

  it('조식 추가는 조식이 빠진 숙소에서 합계에 들어가고, 숙소나 항공권을 바꾸면 풀린다', () => {
    const c = start();

    act(() => c.current.setAddOn('F1', 'meal', true));
    expect(c.current.sum.lines.map((l) => l.k)).toEqual(['항공권', '숙소', '조식']);
    expect(c.current.sum.total).toBe(909000 + 48000);

    act(() => c.current.pickStay('F1', 'H6'));
    expect(c.current.choice.meal).toBe(false);

    act(() => c.current.setAddOn('F1', 'meal', true));
    act(() => c.current.pickFlight('F2'));
    expect(c.current.choice.meal).toBe(false);
  });

  it('수하물 추가는 항공권을 바꿔도 이어진다', () => {
    const c = start();

    act(() => c.current.setAddOn('F1', 'bag', true));
    act(() => c.current.pickFlight('F3'));

    expect(c.current.sum.lines.map((l) => l.k)).toEqual(['항공권', '수하물', '숙소']);
    expect(c.current.sum.total).toBe(742000 + 44000 + 312600);
  });

  it('고르지 않은 항공권의 추가 선택은 받지 않는다', () => {
    const c = start();

    act(() => c.current.setAddOn('F2', 'bag', true));

    expect(c.current.choice.bag).toBe(false);
    expect(c.current.say).toBe('');
  });

  it('숙소 목록은 항공권을 고르지 않고도 펼치고 접을 수 있다', () => {
    const c = start();

    act(() => c.current.setOpen('F3', true));
    expect(c.current.open).toEqual(['F3']);
    expect(c.current.choice.f).toBe('F1');

    act(() => c.current.setOpen('F3', false));
    expect(c.current.open).toEqual([]);
  });
});

describe('gapText', () => {
  it('예산 안이면 여유, 넘으면 초과라고 적는다', () => {
    expect(gapText(691000)).toBe('691,000원 여유');
    expect(gapText(0)).toBe('0원 여유');
    expect(gapText(-54600)).toBe('54,600원 초과');
  });
});
