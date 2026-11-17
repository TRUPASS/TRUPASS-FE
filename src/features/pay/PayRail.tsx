import { routes } from '@/app/routes';
import { cx } from '@/shared/lib/cx';
import { formatKrw } from '@/shared/lib/format';
import { U, V1 } from '@/shared/sample/data';
import { Button } from '@/shared/ui/Button';

const C = V1;

/**
 * 결제 확인의 오른쪽 칸: 결제 금액(항목별 금액과 합계), 결제수단, 승인 버튼.
 * [패스키로 승인하고 결제]를 누르면 결제 진행으로 넘어간다.
 */
export function PayRail() {
  return (
    <aside className="two-r">
      <section className="pnl">
        <div className="pnl-h">
          <h2 className="t-h3">결제 금액</h2>
        </div>
        <div className="pnl-b g12">
          <div>
            {C.lines.map((l, i) => (
              <div key={l.k} className={cx('sl', i === 0 && 'first')}>
                <span className="k">{l.k}</span>
                <span className="t-sm grow">{l.t}</span>
                <span className="t-sm num w5 fn">{formatKrw(l.p)}</span>
              </div>
            ))}
          </div>
          <div className="hr" />
          <div className="row jb">
            <span className="t-md w6">합계</span>
            <span className="t-h2 num">{formatKrw(C.total)}</span>
          </div>
          <div className="g2">
            <div className="row jb">
              <span className="t-sm c2">결제수단</span>
              <span className="t-sm w5">{U.card}</span>
            </div>
            <div className="row jb">
              <span className="t-sm c2">할부</span>
              <span className="t-sm">일시불</span>
            </div>
          </div>
          <Button
            kind="pri"
            size="lg"
            className="fill"
            icon="fingerprint-recognition"
            iconSize={20}
            to={routes.paying}
          >
            패스키로 승인하고 결제
          </Button>
          <span className="t-xs c3">
            승인 한 번으로 판매자 2곳에 차례로 결제합니다. 한 곳이라도 실패하면 전부 취소하고 결제
            전 상태로 되돌립니다.
          </span>
        </div>
      </section>
    </aside>
  );
}
