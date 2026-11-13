import { MandateCheck } from '@/features/pay/MandateCheck';
import { PayItems } from '@/features/pay/PayItems';
import { PayRail } from '@/features/pay/PayRail';
import { PayShell } from '@/features/pay/PayShell';
import { PayTerms } from '@/features/pay/PayTerms';
import { PayTravelers } from '@/features/pay/PayTravelers';

/**
 * 결제 확인. 숙소 위치와 추천 장소까지 확인한 뒤 결제로 넘어온 화면이다.
 * 서명해 둔 결제 권한(한도 · 항목 · 유효기간 · 서명)과 이번 결제를 항목별로 대조해 보여 주고, 패스키 승인 한 번으로 결제한다.
 */
export function CheckoutPage() {
  return (
    <PayShell
      tab="결제 확인"
      head="결제 내용을 확인해 주세요"
      sub="서명해 둔 결제 권한과 이번 결제를 항목별로 대조했습니다. 패스키 승인 한 번으로 두 곳에 차례로 결제합니다."
      current={3}
    >
      <div className="two">
        <div className="two-m">
          <PayItems />
          <PayTravelers />
          <MandateCheck />
          <PayTerms />
        </div>
        <PayRail />
      </div>
    </PayShell>
  );
}
