import type { ReactNode } from 'react';
import { Steps } from './Steps';

interface PageHeadProps {
  /** 화면 제목 */
  head: string;
  /** 지금 단계의 번호 (0부터): 검색 → 항공 · 숙소 → 장소 → 결제 → 완료 */
  current: number;
  /** 제목 아래 한 줄 설명 */
  sub?: ReactNode;
}

/** 화면 머리: 제목 + 진행 단계 (+ 필요한 경우 한 줄 설명). 검색 결과부터 결제 완료까지의 화면이 쓴다. */
export function PageHead({ head, current, sub }: PageHeadProps) {
  return (
    <div className="g10">
      <div className="pt">
        <h1 className="t-h1">{head}</h1>
        <Steps current={current} />
      </div>
      {sub && <p className="t-md c2 mw720">{sub}</p>}
    </div>
  );
}
