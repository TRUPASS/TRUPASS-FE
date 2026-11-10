import { useParams } from 'react-router';
import { CheckoutResult } from '@/features/checkout/CheckoutResult';
import { CheckoutStepList } from '@/features/checkout/CheckoutStepList';
import { useCheckoutStatus } from '@/features/checkout/useCheckoutStatus';
import { PageTitle } from '@/shared/ui/PageTitle';

export function CheckoutStatusPage() {
  const { checkoutId = '' } = useParams();
  const { data, isPending, isError, isTerminal } = useCheckoutStatus(checkoutId);

  return (
    <>
      <PageTitle>진행 상태</PageTitle>
      {isPending && <p>상태를 불러오는 중…</p>}
      {isError && <p role="alert">상태를 불러오지 못했습니다.</p>}
      {data && (
        <>
          <p className="mb-2">
            상태: <strong>{data.status}</strong>
            {!isTerminal && ' (확인 중…)'}
          </p>
          <CheckoutStepList steps={data.steps} />
          <div className="mt-4">
            <CheckoutResult status={data.status} />
          </div>
        </>
      )}
    </>
  );
}
