import { formatKrw } from '@/shared/lib/format';
import { MANDATE as M, U, V1 } from '@/shared/sample/data';
import { Icon } from '@/shared/ui/Icon';
import { Status } from '@/shared/ui/Status';

// 서명해 둔 결제 권한과 이번 결제를 항목별로 대조한 결과: [항목, 권한 설정, 이번 결제, 결과]
const CHECKS = [
  ['1회 결제 한도', formatKrw(M.per), formatKrw(V1.total), '충족'],
  ['월 누적 한도', formatKrw(M.month), `누적 ${formatKrw(V1.total)}`, '충족'],
  ['허용 항목', M.scope, '항공권, 숙소', '충족'],
  ['유효기간', `${M.until}까지`, '2026.11.10 결제', '유효'],
  ['서명', `${U.name}, 기기 패스키`, '서명 검증 완료', '유효'],
] as const;

/**
 * 결제 권한 검증: 결제 권한의 한도 · 항목 · 유효기간 · 서명과 이번 결제를 한 줄씩 대조해 보여 준다.
 * 좁은 화면에서는 표가 줄마다 묶음으로 쌓이고, 칸의 이름(data-l)이 값 위에 붙는다.
 */
export function MandateCheck() {
  return (
    <section className="pnl">
      <div className="pnl-h jb">
        <div className="row g10">
          <Icon name="security" size={20} />
          <h2 className="t-h3">결제 권한 검증</h2>
        </div>
        <Status tone="ok">5개 항목 모두 통과</Status>
      </div>
      <table className="vt">
        <thead>
          <tr>
            <th scope="col">항목</th>
            <th scope="col">권한 설정</th>
            <th scope="col">이번 결제</th>
            <th scope="col" className="tr">
              결과
            </th>
          </tr>
        </thead>
        <tbody>
          {CHECKS.map(([item, allowed, now, result]) => (
            <tr key={item}>
              <th scope="row">{item}</th>
              <td className="num" data-l="권한 설정">
                {allowed}
              </td>
              <td className="num w5" data-l="이번 결제">
                {now}
              </td>
              <td className="tr">
                <Status tone="ok">{result}</Status>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="addon">
        <span className="t-xs c3 grow">{`권한 증명서 ${M.id}, ${M.signed} 서명. ${M.method}`}</span>
        <button type="button" className="tbtn t-xs w5 fn">
          권한 보기
        </button>
      </div>
    </section>
  );
}
