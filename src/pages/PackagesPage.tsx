import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/routes';
import { PackageOptionCard } from '@/features/packages/PackageOptionCard';
import { useCreateCheckout } from '@/shared/api/queries/checkouts';
import { usePackageOptions } from '@/shared/api/queries/tripRequests';
import { PageTitle } from '@/shared/ui/PageTitle';
import { Todo } from '@/shared/ui/Todo';

export function PackagesPage() {
  const { requestId = '' } = useParams();
  const navigate = useNavigate();
  const packages = usePackageOptions(requestId);
  const createCheckout = useCreateCheckout();

  return (
    <>
      <PageTitle>패키지 비교</PageTitle>
      <Todo>패키지 비교 UI</Todo>
      {packages.isPending && <p>패키지를 불러오는 중…</p>}
      {packages.isError && <p role="alert">패키지를 불러오지 못했습니다.</p>}
      {packages.data && (
        <ul className="flex flex-col gap-3">
          {packages.data.map((option) => (
            <PackageOptionCard
              key={option.packageId}
              option={option}
              disabled={createCheckout.isPending}
              onSelect={(selected) =>
                createCheckout.mutate(
                  { packageId: selected.packageId },
                  {
                    onSuccess: ({ checkoutId }) =>
                      // TODO: 백엔드에 체크아웃 상세 조회 API 가 생기면 state 대신 API 로 조회한다.
                      navigate(paths.approval(checkoutId), { state: { option: selected } }),
                  },
                )
              }
            />
          ))}
        </ul>
      )}
    </>
  );
}
