import { MandateForm } from '@/features/pay/MandateForm';
import { MandateSide } from '@/features/pay/MandateSide';
import { PayShell } from '@/features/pay/PayShell';

/**
 * 결제 권한 등록. 결제 권한이 없는 회원이 첫 결제에 들어가면 한 번 거친다.
 * 한도 · 허용 항목 · 유효기간 · 승인 방식을 정하고 패스키로 서명하면 결제 확인으로 넘어간다. 이후 결제는 이 화면을 건너뛴다.
 */
export function MandatePage() {
  return (
    <PayShell
      tab="결제 권한 등록"
      head="결제 범위를 먼저 정합니다"
      sub="첫 결제 때 한 번 등록합니다. 이후 결제는 여기서 정한 한도와 항목 안에서만 실행됩니다."
      current={3}
    >
      <div className="two">
        <MandateForm />
        <MandateSide />
      </div>
    </PayShell>
  );
}
