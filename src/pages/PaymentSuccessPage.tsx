import { PageTitle } from '@/shared/ui/PageTitle';
import { Todo } from '@/shared/ui/Todo';

/** 토스페이먼츠 결제 성공 리다이렉트 (successUrl) */
export function PaymentSuccessPage() {
  return (
    <>
      <PageTitle>결제 성공</PageTitle>
      <Todo>
        paymentKey·orderId·amount 쿼리를 백엔드에 전달해 결제 승인 → 진행 상태 페이지로 이동
      </Todo>
    </>
  );
}
