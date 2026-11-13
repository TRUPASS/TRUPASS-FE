import { routes } from '@/app/routes';
import { formatKrw } from '@/shared/lib/format';
import { MANDATE as M, PAY, REQ, U, V1, type Leg } from '@/shared/sample/data';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { Kv, Status } from '@/shared/ui/Status';
import { DocRow } from './DocRow';
import { DOCS } from './docs';
import { PaySummary } from './PaySummary';

const C = V1;
const { f, h } = C;
// 한 구간: 날짜, 출발 시각과 공항 → 도착 공항
const legLine = (l: Leg) => `${l.d} ${l.dep} ${l.from} → ${l.to}`;

/** 결제 결과: 결제가 끝났고 예약이 모두 확정됐음을 알린다 */
function CompleteResult() {
  return (
    <section className="pnl">
      <div className="done-h">
        <Icon name="checkmark--filled" size={28} className="cok" />
        <div className="g4 grow">
          <h2 className="t-h2">결제가 완료되었습니다</h2>
          <p className="t-md c2">{`예약 2건이 모두 확정되었습니다. 주문번호 ${REQ.order}`}</p>
        </div>
      </div>
    </section>
  );
}

/** 이메일 발송: 영수증과 확정서를 가입 때 등록한 이메일로 보냈음을 문서별로 보여 준다 */
function CompleteEmail() {
  return (
    <section className="pnl">
      <div className="pnl-h jb">
        <div className="row g10">
          <Icon name="email" size={20} />
          <h2 className="t-h3">이메일 발송</h2>
        </div>
        <Status tone="ok">3건 발송 완료</Status>
      </div>
      <div className="pnl-b g4">
        <p className="t-md">
          영수증과 예약 확정서를 <b>{U.mail}</b> 주소로 보냈습니다.
        </p>
        <p className="t-sm c3">
          가입할 때 등록한 이메일입니다. 메일이 보이지 않으면 스팸함을 확인해 주세요.
        </p>
      </div>
      {DOCS.map((doc) => (
        <DocRow key={doc.title} doc={doc} />
      ))}
      <div className="pnl-f">
        <span className="t-sm c3 dt-only">PDF는 내 여행 &gt; 문서함에서도 받을 수 있습니다.</span>
        <div className="acts">
          <Button icon="email">메일 다시 보내기</Button>
          <Button icon="download">PDF로 받기</Button>
        </div>
      </div>
    </section>
  );
}

/** 예약 내역: 확정된 항공권과 숙소, 예약번호와 확정 시각 */
function CompleteBookings() {
  return (
    <section className="pnl">
      <div className="pnl-h jb">
        <h2 className="t-h3">예약 내역</h2>
        <span className="t-sm c3">{`${REQ.range}, ${REQ.pax}`}</span>
      </div>
      <div className="li first">
        <Icon name="plane" size={20} className="c2" />
        <div className="g2 grow">
          <span className="t-md w6">{`${f.air} ${f.out.no} / ${f.back.no}`}</span>
          <span className="t-sm c2">{legLine(f.out)}</span>
          <span className="t-sm c2">{legLine(f.back)}</span>
          <span className="t-xs c3">{`예약번호 ${PAY.air.no}, 발권 완료 ${PAY.air.done}`}</span>
        </div>
        <div className="pr">
          <span className="t-h3 num">{formatKrw(C.air)}</span>
          <Status tone="ok">확정</Status>
        </div>
      </div>
      <div className="li">
        <Icon name="hotel" size={20} className="c2" />
        <div className="g2 grow">
          <span className="t-md w6">{h.name}</span>
          <span className="t-sm c2">{`${REQ.range}, 3박, ${h.room} 1실`}</span>
          <span className="t-sm c2">{h.area}</span>
          <span className="t-xs c3">{`예약번호 ${PAY.stay.no}, 예약 확정 ${PAY.stay.done}`}</span>
        </div>
        <div className="pr">
          <span className="t-h3 num">{formatKrw(h.price)}</span>
          <Status tone="ok">확정</Status>
        </div>
      </div>
    </section>
  );
}

/** 승인 기록: 어느 권한 증명서의 어떤 범위 안에서 승인된 결제인지 남긴다 */
function CompleteApproval() {
  return (
    <section className="pnl">
      <div className="pnl-h jb">
        <h2 className="t-h3">승인 기록</h2>
        <Status tone="ok">검증 유효</Status>
      </div>
      <div className="pnl-b pnl-kv">
        <Kv k="권한 증명서" line={false}>
          {M.id}
        </Kv>
        <Kv k="승인">
          패스키 본인 확인
          <br />
          <span className="t-xs c3 num">{PAY.approved}</span>
        </Kv>
        <Kv k="승인 범위">
          {`1회 ${formatKrw(M.per)} 이하`}
          <br />
          {M.scope}
        </Kv>
        <div className="kv line">
          <span className="t-xs c3 grow">
            이 기록은 변경할 수 없으며, 결제에 이의가 생기면 승인 범위의 근거로 쓰입니다.
          </span>
        </div>
      </div>
    </section>
  );
}

/**
 * 결제 완료의 본문. 왼쪽에는 결제 결과 · 이메일 발송 · 예약 내역을, 오른쪽에는 결제 요약 · 승인 기록과 다음에 갈 곳을 둔다.
 */
export function PayComplete() {
  return (
    <div className="two">
      <div className="two-m">
        <CompleteResult />
        <CompleteEmail />
        <CompleteBookings />
      </div>
      <aside className="two-r">
        <PaySummary />
        <CompleteApproval />
        <div className="g8">
          <Button kind="pri" size="lg" className="fill" to={routes.trips}>
            내 여행에서 일정 보기
          </Button>
          <Button size="lg" className="fill" to={routes.search}>
            새 검색
          </Button>
        </div>
      </aside>
    </div>
  );
}
