import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type InitialEntry } from 'react-router';
import { routes } from '@/app/routes';
import { ResultsPage } from '@/pages/ResultsPage';
import { SearchingPage } from '@/pages/SearchingPage';
import { SearchPage } from '@/pages/SearchPage';

/** 새 검색 → 검색 중 → 결과 화면을 한 라우터에 올린다. 로그인 화면은 글자 하나로 대신한다 */
export function renderSearchApp(entry: InitialEntry) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      { path: routes.search, element: <SearchPage /> },
      { path: routes.searching, element: <SearchingPage /> },
      { path: routes.results, element: <ResultsPage /> },
      { path: routes.login, element: <p>로그인 화면</p> },
    ],
    { initialEntries: [entry] },
  );
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

/** 라우터가 지금 보여 주는 주소 (경로 + 쿼리) */
export const where = (router: ReturnType<typeof renderSearchApp>) =>
  router.state.location.pathname + router.state.location.search;
