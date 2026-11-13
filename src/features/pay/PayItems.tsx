import { formatKrw } from '@/shared/lib/format';
import { REQ, V1, type Leg } from '@/shared/sample/data';
import { BrandSource } from '@/shared/ui/BrandMark';
import { Icon } from '@/shared/ui/Icon';

const C = V1;
const { f, h } = C;
// 한 구간: 날짜, 출발 시각과 공항 → 도착 시각과 공항
const legLine = (l: Leg) => `${l.d} ${l.dep} ${l.from} → ${l.arr} ${l.to}`;

/** 결제 내용: 결제할 항공권과 숙소를 판매자별로 한 줄씩 보여 준다. 금액 아래에는 요금을 조회한 곳을 적는다. */
export function PayItems() {
  return (
    <section className="pnl">
      <div className="pnl-h jb">
        <h2 className="t-h3">결제 내용</h2>
        <span className="t-sm c3">예약 2건, 판매자 2곳</span>
      </div>
      <div className="li first">
        <Icon name="plane" size={20} className="c2" />
        <div className="g2 grow">
          <span className="t-md w6">{`${f.air} ${f.out.no} / ${f.back.no}`}</span>
          <span className="t-sm c2">{legLine(f.out)}</span>
          <span className="t-sm c2">{legLine(f.back)}</span>
          <span className="t-xs c3">{`${f.cls}, 성인 2명, ${f.bag}`}</span>
          <span className="t-xs c3">{`판매자 ${f.air}`}</span>
        </div>
        <div className="pr">
          <span className="t-h3 num">{formatKrw(C.air)}</span>
          <BrandSource name={f.src} />
        </div>
      </div>
      <div className="li">
        <Icon name="hotel" size={20} className="c2" />
        <div className="g2 grow">
          <span className="t-md w6">{h.name}</span>
          <span className="t-sm c2">{`${REQ.range}, 3박, ${h.room} 1실`}</span>
          <span className="t-sm c2">{`${h.grade}, ${h.area}, ${h.meal}`}</span>
          <span className="t-xs c3">{h.cancel}</span>
          <span className="t-xs c3">{`판매자 ${h.name}`}</span>
        </div>
        <div className="pr">
          <span className="t-h3 num">{formatKrw(h.price)}</span>
          <BrandSource name={h.src} />
        </div>
      </div>
    </section>
  );
}
