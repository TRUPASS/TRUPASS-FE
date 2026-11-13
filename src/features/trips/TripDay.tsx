import type { ReactNode } from 'react';
import { cx } from '@/shared/lib/cx';

interface TripEventProps {
  /** 시각 (또는 '종일') */
  time: string;
  /** 무엇을 하는지 */
  title: string;
  /** 설명 */
  sub?: ReactNode;
  /** 예약번호 */
  code?: string;
}

/** 일정 한 줄: 시각 | 무엇을 하는지와 설명 | 예약번호 */
export function TripEvent({ time, title, sub, code }: TripEventProps) {
  return (
    <li className="tl-i">
      <span className="tl-t num">{time}</span>
      <div className="tl-x">
        <span className="t-md w6">{title}</span>
        {sub && <span className="t-sm c2">{sub}</span>}
      </div>
      {code && <span className="tl-c t-xs c3 num">{code}</span>}
    </li>
  );
}

interface TripDayProps {
  date: string;
  /** 일정의 첫 날: 위쪽 선을 긋지 않는다 */
  first?: boolean;
  /** 그날의 일 (TripEvent). 시각 순서로 놓는다 */
  children: ReactNode;
}

/** 일정의 하루: 날짜는 왼쪽 칸에, 그날의 일은 오른쪽에 놓는다 */
export function TripDay({ date, first, children }: TripDayProps) {
  return (
    <li className={cx('tl-d', first && 'first')}>
      <h3 className="tl-k t-md">{date}</h3>
      <ol className="tl-l">{children}</ol>
    </li>
  );
}
