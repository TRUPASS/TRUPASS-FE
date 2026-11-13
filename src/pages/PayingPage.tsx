import { routes } from '@/app/routes';
import { ApprovalRecord } from '@/features/pay/ApprovalRecord';
import { PayProgress } from '@/features/pay/PayProgress';
import { PayShell } from '@/features/pay/PayShell';
import { useAutoNext } from '@/features/pay/useAutoNext';
import { Note } from '@/shared/ui/Status';

/**
 * 결제 진행. 판매자마다 확보 → 결제 → 확정 순서로 진행 상황을 보여 준다.
 * 한 곳이라도 실패하면 전체를 취소하는 규칙을 화면에 적어 둔다. 잠시 뒤 결제 완료로 넘어간다.
 */
export function PayingPage() {
  useAutoNext(routes.complete, 5200);
  return (
    <PayShell tab="결제 진행" head="결제를 진행하고 있습니다" current={3}>
      <div className="two">
        <div className="two-m">
          <PayProgress />
          <Note>
            두 판매자의 재고를 먼저 확보한 뒤 차례로 결제합니다. 한 곳이라도 실패하면 이미 결제된
            건을 자동으로 취소하고 결제 전 상태로 되돌립니다. 이 화면을 닫아도 결제는 계속
            진행됩니다.
          </Note>
        </div>
        <aside className="two-r">
          <ApprovalRecord />
        </aside>
      </div>
    </PayShell>
  );
}
