import { cx } from '@/shared/lib/cx';
import { formatKrw } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { gapText } from './choice';

/** 합계의 한 줄: 항목 · 이름 · 설명 · 금액 */
export interface SummaryLine {
  k: string;
  t: string;
  s: string;
  p: number;
}

interface SummaryPanelProps {
  /** 줄마다의 금액 · 합계 · 예산에서 합계를 뺀 값(예산이 없으면 null). API 화면은 서버 값을 그대로 넣는다 */
  sum: { lines: readonly SummaryLine[]; total: number; left: number | null };
  /** 예산(원). 정하지 않았으면 null */
  budget: number | null;
  /** 합계 옆에 적는 인원 (성인 2명) */
  pax: string;
  /** 바뀐 합계를 스크린리더에 알리는 문구 */
  say?: string;
  /** 검색 결과의 판과 시각 (v1 14:02) */
  ver: string;
  /** 바뀌기 전의 합계 */
  prev?: number;
  /** 다음 단계 버튼의 이름과 갈 곳 */
  cta: string;
  to: string;
  /** 앞 단계로 돌아가는 버튼의 이름과 갈 곳 */
  back?: string;
  backTo?: string;
  /** 다음 단계에서 하는 일 */
  foot: string;
}

/** 오른쪽: 선택한 조합. 고른 항공권 · 숙소 · 추가 선택과 합계, 예산 대비 여유를 보여 준다. 금액은 받은 그대로 보여 준다. */
export function SummaryPanel({
  sum,
  budget,
  pax,
  say,
  ver,
  prev,
  cta,
  to,
  back,
  backTo,
  foot,
}: SummaryPanelProps) {
  return (
    <section className="pnl sum" aria-label="선택한 조합">
      <div className="pnl-h jb">
        <h2 className="t-h3">선택한 조합</h2>
        <span className="t-xs c3 num">{ver}</span>
      </div>
      <div className="pnl-b g16">
        <p className="vh" role="status">
          {say}
        </p>
        <div>
          {sum.lines.map((l, i) => (
            <div key={l.k} className={cx('sl', i === 0 && 'first')}>
              <span className="k">{l.k}</span>
              <div className="g2 grow">
                <span className="t-sm w5">{l.t}</span>
                <span className="t-xs c3">{l.s}</span>
              </div>
              <span className="t-sm num w5 fn">{formatKrw(l.p)}</span>
            </div>
          ))}
        </div>
        <div className="hr" />
        <div className="g6">
          <div className="row jb">
            <span className="t-md w6">
              합계 <span className="t-sm c3 w4">{pax}</span>
            </span>
            <span className="t-h1 num">{formatKrw(sum.total)}</span>
          </div>
          {prev !== undefined && (
            <div className="row jb">
              <span className="t-sm c2">변경 전</span>
              <span className="t-sm c3 num del">{formatKrw(prev)}</span>
            </div>
          )}
          {budget !== null && sum.left !== null ? (
            <div className="row jb">
              <span className="t-sm c2">{`예산 ${formatKrw(budget)} 대비`}</span>
              <span className={cx('t-sm', sum.left >= 0 ? 'cok' : 'cbad', 'w5 num')}>
                {gapText(sum.left)}
              </span>
            </div>
          ) : (
            <div className="row jb">
              <span className="t-sm c2">예산</span>
              <span className="t-sm c3">정하지 않음</span>
            </div>
          )}
        </div>
        <Button kind="pri" size="lg" className="fill d-only" to={to}>
          {cta}
        </Button>
        {back && backTo && (
          <Button className="fill d-only" icon="arrow--left" to={backTo}>
            {back}
          </Button>
        )}
        <span className="t-xs c3">{foot}</span>
      </div>
    </section>
  );
}
