import { formatKrw } from '@/shared/lib/format';
import { PAY, V1 } from '@/shared/sample/data';
import { Status } from '@/shared/ui/Status';

const C = V1;
const { f, h } = C;

interface StageCellProps {
  /** 단계 이름 (확보 · 결제 · 확정). 좁은 화면에서는 값 위에 붙는다 */
  label: string;
  /** 없으면 아직 시작하지 않은 단계다 */
  tone?: 'ok' | 'run';
  text: string;
  /** 그 단계를 마친 시각 */
  time?: string;
}

/** 진행 표의 한 칸: 한 단계의 상태와 마친 시각 */
function StageCell({ label, tone, text, time }: StageCellProps) {
  return (
    <td data-l={label}>
      <span className="g2">
        <Status tone={tone}>{text}</Status>
        {time && <span className="t-xs c3 num">{time}</span>}
      </span>
    </td>
  );
}

/**
 * 판매자별 진행 상황: 판매자마다 확보 → 결제 → 확정 순서로 어디까지 갔는지 보여 준다.
 * 좁은 화면에서는 표가 판매자마다 묶음으로 쌓인다.
 */
export function PayProgress() {
  return (
    <section className="pnl">
      <div className="pnl-h jb">
        <h2 className="t-h3">판매자별 진행 상황</h2>
        <span className="t-sm c2" role="status">
          2곳 중 1곳 결제 완료
        </span>
      </div>
      <div className="pnl-b pnl-bar">
        <div
          className="prog"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={58}
          aria-label="결제 진행"
        >
          <i className="prog-58" />
        </div>
      </div>
      <table className="vt pt-t">
        <thead>
          <tr>
            <th scope="col">판매자와 상품</th>
            <th scope="col">확보</th>
            <th scope="col">결제</th>
            <th scope="col">확정</th>
            <th scope="col" className="tr">
              금액
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">
              <span className="g2">
                <span className="t-md w6">{f.air}</span>
                <span className="t-sm c2">{`항공권 ${f.out.no} / ${f.back.no}, 성인 2명`}</span>
              </span>
            </th>
            <StageCell label="확보" tone="ok" text="좌석 확보" time={PAY.air.hold} />
            <StageCell label="결제" tone="ok" text="결제 완료" time={PAY.air.pay} />
            <StageCell label="확정" tone="run" text="발권 중" />
            <td className="tr t-md num w5">{formatKrw(C.air)}</td>
          </tr>
          <tr>
            <th scope="row">
              <span className="g2">
                <span className="t-md w6">{h.name}</span>
                <span className="t-sm c2">{`숙소 3박, ${h.room} 1실`}</span>
              </span>
            </th>
            <StageCell label="확보" tone="ok" text="객실 확보" time={PAY.stay.hold} />
            <StageCell label="결제" tone="run" text="결제 중" />
            <StageCell label="확정" text="대기" />
            <td className="tr t-md num w5">{formatKrw(h.price)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
