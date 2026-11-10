import { Link } from 'react-router';
import { PageTitle } from '@/shared/ui/PageTitle';

export function NotFoundPage() {
  return (
    <>
      <PageTitle>페이지를 찾을 수 없습니다</PageTitle>
      <Link to="/" className="underline">
        처음으로
      </Link>
    </>
  );
}
