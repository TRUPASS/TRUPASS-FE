import { PageTitle } from '@/shared/ui/PageTitle';
import { Todo } from '@/shared/ui/Todo';

/** 토스페이먼츠 결제 실패 리다이렉트 (failUrl) */
export function PaymentFailPage() {
  return (
    <>
      <PageTitle>결제 실패</PageTitle>
      <Todo>code·message 쿼리 표시 및 재시도 안내</Todo>
    </>
  );
}
