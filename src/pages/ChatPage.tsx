import { useNavigate } from 'react-router';
import { paths } from '@/app/routes';
import { TripRequestForm } from '@/features/chat/TripRequestForm';
import { useCreateTripRequest } from '@/shared/api/queries/tripRequests';
import { PageTitle } from '@/shared/ui/PageTitle';
import { Todo } from '@/shared/ui/Todo';

export function ChatPage() {
  const navigate = useNavigate();
  const createTripRequest = useCreateTripRequest();

  return (
    <>
      <PageTitle>대화</PageTitle>
      <Todo>대화형 UI (메시지 목록, 스트리밍 등)</Todo>
      <TripRequestForm
        isPending={createTripRequest.isPending}
        onSubmit={(message) =>
          createTripRequest.mutate(
            { message },
            { onSuccess: ({ requestId }) => navigate(paths.packages(requestId)) },
          )
        }
      />
      {createTripRequest.isError && <p role="alert">요청에 실패했습니다.</p>}
    </>
  );
}
