import { Link } from 'react-router';
import { routes } from '@/app/routes';
import { ACTS, AREA, PAY, REQ, TRIP, V1, type Leg } from '@/shared/sample/data';
import { Status } from '@/shared/ui/Status';
import { TripDay, TripEvent } from './TripDay';

const { f, h } = V1;

// 출발까지 남은 날: 예시 데이터의 오늘(REQ.at)부터 가는 편 날짜까지
const days = (() => {
  const [y = 0, m = 1, d = 1] = REQ.at.slice(0, 10).split('.').map(Number);
  const [fm = 1, fd = 1] = (f.out.d.split(' ')[0] ?? '').split('.').map(Number);
  return Math.round((Date.UTC(y, fm - 1, fd) - Date.UTC(y, m - 1, d)) / 864e5);
})();
const placeCount = AREA.groups.reduce((n, g) => n + g.items.length, 0);
const route = (l: Leg) => `${l.from} (${l.fc}) → ${l.to} (${l.tc})`;
const SUMMARY = [
  ['기간', REQ.range],
  ['인원', REQ.pax],
  ['주문번호', REQ.order],
] as const;

/**
 * 다가오는 여행 한 건: 요약(기간 · 인원 · 주문번호) 아래에 날짜별 일정을 둔다.
 * 일정은 가는 편 → 체크인 → 자유 일정 → 체크아웃 → 오는 편 순서이고, 자유 일정에서는 추천 장소로 다시 갈 수 있다.
 */
export function TripPanel() {
  return (
    <section className="pnl clip">
      <div className="pnl-h jb">
        <div className="row g10 wrap">
          <h2 className="t-h3">{TRIP.title}</h2>
          <Status tone="ok">예약 확정</Status>
        </div>
        <span className="t-sm c2 fn num">{`출발까지 ${days}일`}</span>
      </div>
      <dl className="trip-m">
        {SUMMARY.map(([k, v]) => (
          <div key={k} className="g2">
            <dt className="t-xs c3">{k}</dt>
            <dd className="t-md w5 num">{v}</dd>
          </div>
        ))}
      </dl>
      <ol className="tl" aria-label="날짜별 일정">
        <TripDay date={f.out.d} first>
          <TripEvent
            time={`${f.out.dep} → ${f.out.arr}`}
            title={route(f.out)}
            sub={`${f.air} ${f.out.no}, ${f.cls}, ${f.out.dur}`}
            code={`예약번호 ${PAY.air.no}`}
          />
          <TripEvent
            time={`${TRIP.checkin}부터`}
            title={`체크인, ${h.name}`}
            sub={`${h.area}, ${h.room} 1실`}
            code={`예약번호 ${PAY.stay.no}`}
          />
        </TripDay>
        <TripDay date={TRIP.free}>
          <TripEvent
            time="종일"
            title="자유 일정"
            sub={
              <>
                {`숙소 주변 추천 장소 ${placeCount}곳과 활동 ${ACTS.length}건을 골라 두었습니다. `}
                <Link className="lnk w5" to={routes.places}>
                  추천 장소 보기
                </Link>
              </>
            }
          />
        </TripDay>
        <TripDay date={f.back.d}>
          <TripEvent time={`${TRIP.checkout}까지`} title={`체크아웃, ${h.name}`} />
          <TripEvent
            time={`${f.back.dep} → ${f.back.arr}`}
            title={route(f.back)}
            sub={`${f.air} ${f.back.no}, ${f.cls}, ${f.back.dur}`}
            code={`예약번호 ${PAY.air.no}`}
          />
        </TripDay>
      </ol>
    </section>
  );
}
