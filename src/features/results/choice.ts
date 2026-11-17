// 검색 결과에서 고른 조합(항공권 · 숙소 · 추가 선택)과 거기서 나오는 합계.
// 항공권은 하나, 숙소는 고른 항공권의 일정에 맞는 3곳 가운데 하나, 추가 선택(수하물 · 조식)은 고른 항공권에서만 켤 수 있다.
import { useState } from 'react';
import { formatKrw } from '@/shared/lib/format';
import {
  combo,
  MEAL,
  REQ,
  type Combo,
  type FlightId,
  type Hotel,
  type HotelId,
  type StayMap,
  type SumLine,
} from '@/shared/sample/data';

/** 고른 조합: 항공권(f) · 숙소(h) · 수하물 추가(bag) · 조식 추가(meal) */
export interface Choice {
  f: FlightId;
  h: HotelId;
  bag: boolean;
  meal: boolean;
}
/** 추가 선택: 수하물은 항공권에, 조식은 숙소에 붙는다 */
export type AddOnKey = 'bag' | 'meal';

/** 합계의 한 줄: 항목 · 이름 · 설명 · 금액 */
type Line = Pick<SumLine, 'k' | 't' | 's' | 'p'>;
export interface Sum {
  lines: Line[];
  total: number;
  /** 예산에서 합계를 뺀 값. 음수면 예산을 넘은 것이다 */
  left: number;
}

/** 조식이 빠진 숙소인가 (조식 추가는 이런 숙소를 골랐을 때만 보인다) */
export const noMeal = (h: Hotel) => h.meal === '조식 불포함';

/** 고른 조합의 합계: 항공권 · (수하물) · 숙소 · (조식) */
function summarize(map: StayMap, { f, h, bag, meal }: Choice): Sum {
  const c = combo({ flight: f, hotel: h, bag, map });
  const lines: Line[] =
    meal && noMeal(c.h)
      ? [...c.lines, { k: '조식', t: MEAL.label, s: MEAL.sub, p: MEAL.price }]
      : c.lines;
  const total = lines.reduce((s, l) => s + l.p, 0);
  return { lines, total, left: REQ.budget - total };
}

/** 예산 대비: "691,000원 여유" 또는 "12,000원 초과" */
export const gapText = (left: number) =>
  left >= 0 ? `${formatKrw(left)} 여유` : `${formatKrw(-left)} 초과`;

interface State {
  choice: Choice;
  /** 숙소를 펼쳐 둔 항공권 */
  open: FlightId[];
  /** 고른 것을 한 번이라도 바꿨는가 */
  touched: boolean;
}

/**
 * 고른 조합을 들고 있고, 고를 때마다 합계를 다시 낸다.
 * start 는 처음에 골라 둔 조합, openStart 는 고른 항공권의 숙소를 처음부터 펼쳐 둘지다.
 */
export function useChoice(start: Combo, openStart: boolean) {
  const { map } = start;
  const [state, setState] = useState<State>(() => ({
    choice: { f: start.f.id, h: start.h.id, bag: start.bag, meal: false },
    open: openStart ? [start.f.id] : [],
    touched: false,
  }));

  /** 항공권을 고른다. 그 항공권의 숙소를 펼치고, 고른 숙소가 그 일정에 없으면 첫 숙소로 바꾼다. */
  const pickFlight = (f: FlightId) =>
    setState((s) => {
      const open = s.open.includes(f) ? s.open : [...s.open, f];
      if (s.choice.f === f) return open === s.open ? s : { ...s, open };
      const ids = map[f].map(([id]) => id);
      const h = ids.includes(s.choice.h) ? s.choice.h : (ids[0] ?? s.choice.h);
      return { choice: { ...s.choice, f, h, meal: false }, open, touched: true };
    });

  /** 숙소를 고른다. 그 숙소가 딸린 항공권도 함께 고른다. */
  const pickStay = (f: FlightId, h: HotelId) =>
    setState((s) =>
      s.choice.f === f && s.choice.h === h
        ? s
        : { ...s, choice: { ...s.choice, f, h, meal: false }, touched: true },
    );

  /** 추가 선택을 켜거나 끈다. 고른 항공권의 것만 받는다. */
  const setAddOn = (f: FlightId, key: AddOnKey, on: boolean) =>
    setState((s) =>
      s.choice.f === f ? { ...s, choice: { ...s.choice, [key]: on }, touched: true } : s,
    );

  /** 항공권 줄의 숙소를 펼치거나 접는다 */
  const setOpen = (f: FlightId, on: boolean) =>
    setState((s) =>
      s.open.includes(f) === on
        ? s
        : { ...s, open: on ? [...s.open, f] : s.open.filter((x) => x !== f) },
    );

  const sum = summarize(map, state.choice);
  return {
    choice: state.choice,
    open: state.open,
    sum,
    /** 바뀐 합계를 스크린리더에 알리는 문구. 고른 것을 바꾸기 전에는 비어 있다. */
    say: state.touched ? `합계 ${formatKrw(sum.total)}, 예산 대비 ${gapText(sum.left)}` : '',
    pickFlight,
    pickStay,
    setAddOn,
    setOpen,
  };
}

export type ChoiceControl = ReturnType<typeof useChoice>;
