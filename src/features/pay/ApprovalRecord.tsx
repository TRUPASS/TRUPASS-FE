import { formatKrw } from '@/shared/lib/format';
import { MANDATE as M, PAY, V1 } from '@/shared/sample/data';
import { Kv } from '@/shared/ui/Status';

/** 승인 기록: 결제를 진행하는 동안 회원이 승인한 금액 · 방식 · 시각과 근거가 된 권한 증명서를 보여 준다 */
export function ApprovalRecord() {
  return (
    <section className="pnl">
      <div className="pnl-h">
        <h2 className="t-h3">승인 기록</h2>
      </div>
      <div className="pnl-b pnl-kv">
        <Kv k="승인 금액" line={false}>
          <span className="num w5">{formatKrw(V1.total)}</span>
        </Kv>
        <Kv k="승인 방식">패스키 본인 확인</Kv>
        <Kv k="승인 시각">
          <span className="num">{PAY.approved}</span>
        </Kv>
        <Kv k="권한 증명서">{M.id}</Kv>
      </div>
    </section>
  );
}
