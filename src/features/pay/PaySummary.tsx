import { formatKrw } from '@/shared/lib/format';
import { PAY, REQ, U, V1 } from '@/shared/sample/data';
import { Kv } from '@/shared/ui/Status';

/** 결제 요약: 결제 금액 · 결제수단 · 결제 일시 · 주문번호. 결제 완료와 내 여행의 오른쪽 칸이 함께 쓴다. */
export function PaySummary() {
  return (
    <section className="pnl">
      <div className="pnl-h">
        <h2 className="t-h3">결제 요약</h2>
      </div>
      <div className="pnl-b pnl-kv">
        <Kv k="결제 금액" line={false}>
          <span className="t-h3 num">{formatKrw(V1.total)}</span>
        </Kv>
        <Kv k="결제수단">
          {U.card}
          <br />
          <span className="t-sm c2">일시불</span>
        </Kv>
        <Kv k="결제 일시">
          <span className="num">{PAY.at}</span>
        </Kv>
        <Kv k="주문번호">{REQ.order}</Kv>
      </div>
    </section>
  );
}
