import { FLIGHTS, REQ, stays, type StayMap } from '@/shared/sample/data';
import type { ChoiceControl } from './choice';
import { FlightRow } from './FlightRow';

interface OptionTableProps {
  /** 항공권마다 그 일정에 예약할 수 있는 숙소 */
  map: StayMap;
  /** 다시 검색한 결과: 바뀐 숙소에 표식을 단다 */
  changed?: boolean;
  ctl: ChoiceControl;
}

/**
 * 항공권 표. 항공권 한 건이 한 줄이고, 화면에 들어오면 한 줄씩 떠오른다.
 * 줄 아래의 [추천 숙소 3곳]을 펼쳐 숙소를 고른다.
 */
export function OptionTable({ map, changed, ctl }: OptionTableProps) {
  return (
    <section className="ocs">
      <div className="ocs-h">
        <div className="row g10 wrap">
          <h2 className="t-h3">{`항공권 ${FLIGHTS.length}건`}</h2>
          <span className="t-sm c3">왕복, 성인 2명</span>
        </div>
        <span className="t-xs c3 fn">
          요청에 가까운 순<span className="dt-only num">{`, 요금 조회 ${REQ.at}`}</span>
        </span>
      </div>
      <div className="fo-hd d-only" aria-hidden="true">
        <span className="fo-k" />
        <span className="fo-a">항공사</span>
        <span className="fo-l">
          <span className="lg2">가는 편</span>
          <span className="lg2">오는 편</span>
        </span>
        <span className="fo-p">왕복 요금</span>
      </div>
      <div className="fos" role="radiogroup" aria-label="항공권 고르기">
        {FLIGHTS.map((f, i) => (
          <FlightRow
            key={f.id}
            flight={f}
            index={i}
            stays={stays(map, f.id)}
            changed={changed}
            ctl={ctl}
          />
        ))}
      </div>
    </section>
  );
}
