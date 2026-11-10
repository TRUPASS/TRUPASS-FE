import { useLocation, useNavigate, useParams } from 'react-router';
import { paths } from '@/app/routes';
import { ApprovalSummary } from '@/features/approval/ApprovalSummary';
import type { Schemas } from '@/shared/api/client';
import { useSubmitMandate } from '@/shared/api/queries/checkouts';
import { PageTitle } from '@/shared/ui/PageTitle';
import { Todo } from '@/shared/ui/Todo';

interface ApprovalLocationState {
  option?: Schemas['PackageOption'];
}

export function ApprovalPage() {
  const { checkoutId = '' } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation() as { state: ApprovalLocationState | null };
  const submitMandate = useSubmitMandate(checkoutId);

  function handleApprove() {
    // TODO: shared/lib/passkey.ts 의 signMandateWithPasskey 로 서명한 결과를 body 에 담는다.
    // TODO: 서명 후 토스페이먼츠 결제창(shared/lib/toss.ts)으로 결제한다.
    submitMandate.mutate({}, { onSuccess: () => navigate(paths.checkoutStatus(checkoutId)) });
  }

  return (
    <>
      <PageTitle>승인</PageTitle>
      {state?.option ? (
        <ApprovalSummary option={state.option} />
      ) : (
        <Todo>체크아웃 상세 조회 API 로 패키지 정보 표시</Todo>
      )}
      <Todo>패스키(WebAuthn) 서명 → 토스페이먼츠 결제</Todo>
      <button
        type="button"
        className="border px-3 py-1"
        onClick={handleApprove}
        disabled={submitMandate.isPending}
      >
        패스키로 한 번에 승인 (스텁)
      </button>
      {submitMandate.isError && <p role="alert">승인에 실패했습니다.</p>}
    </>
  );
}
