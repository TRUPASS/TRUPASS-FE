import { PayComplete } from '@/features/pay/PayComplete';
import { PayShell } from '@/features/pay/PayShell';

/**
 * 결제 완료. 결제 결과와 예약번호를 확인하는 화면이다.
 * 영수증 · e-티켓 확정서 · 숙소 예약 확정서가 가입 때 등록한 이메일로 발송됐음을 문서별로 표시하고, 내 여행으로 이어진다.
 */
export function CompletePage() {
  return (
    <PayShell tab="결제 완료" head="여행 준비가 끝났습니다" current={5}>
      <PayComplete />
    </PayShell>
  );
}
