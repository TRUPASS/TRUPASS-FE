import { formatKrw } from '@/shared/lib/format';
import { useMember } from '@/shared/auth/member';
import { MANDATE as M, U } from '@/shared/sample/data';
import { Kv, Note } from '@/shared/ui/Status';

/** 결제 권한 등록의 오른쪽 칸: 서명할 내용(권한 증명서)과 서명이 어떻게 쓰이는지에 대한 안내 */
export function MandateSide() {
  const member = useMember();
  return (
    <aside className="two-r">
      <div className="pnl">
        <div className="pnl-h jb">
          <h2 className="t-h3">서명할 내용</h2>
          <span className="t-xs c3">권한 증명서</span>
        </div>
        <div className="pnl-b pnl-kv">
          <Kv k="발급 대상" line={false}>
            {member.name}
            <br />
            <span className="t-xs c3">{member.email}</span>
          </Kv>
          <Kv k="결제수단">{U.card}</Kv>
          <Kv k="1회 한도">{formatKrw(M.per)}</Kv>
          <Kv k="월 누적 한도">{formatKrw(M.month)}</Kv>
          <Kv k="허용 항목">{M.scope}</Kv>
          <Kv k="유효기간">{`${M.until}까지`}</Kv>
          <Kv k="승인 방식">{M.method}</Kv>
        </div>
      </div>
      <Note icon="security">
        권한 증명서는 회원님의 기기에서 서명됩니다. Trupass와 판매자는 서명을 검증만 할 수 있으며,
        범위를 벗어난 결제는 실행되지 않습니다. 설정에서 언제든 바꾸거나 폐기할 수 있습니다.
      </Note>
    </aside>
  );
}
