import { Link } from 'react-router';
import type { CheckoutStatus } from '@/shared/api/queries/checkouts';
import { Todo } from '@/shared/ui/Todo';

/** 최종 상태별 안내 (디자인 없음) */
export function CheckoutResult({ status }: { status: CheckoutStatus }) {
  switch (status) {
    case 'COMPLETED':
      return (
        <section>
          <p>예약이 확정되었습니다.</p>
          <Todo>영수증 표시</Todo>
        </section>
      );
    case 'FAILED':
      return (
        <section>
          <p>예약에 실패했습니다. 결제는 취소(보상) 처리되었습니다.</p>
          <Todo>대체 패키지 제안</Todo>
          <Link to="/" className="underline">
            처음부터 다시
          </Link>
        </section>
      );
    case 'NEEDS_MANUAL_REVIEW':
      return (
        <section>
          <p>운영자가 확인 중입니다. 처리 결과를 곧 안내드릴게요.</p>
        </section>
      );
    default:
      return null;
  }
}
