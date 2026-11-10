import createClient from 'openapi-fetch';
import { env } from '@/shared/lib/env';
import type { components, paths } from './schema';

export type Schemas = components['schemas'];

export const apiClient = createClient<paths>({
  baseUrl: env.apiBaseUrl,
  // 호출 시점의 fetch 를 사용해야 MSW 등이 패치한 fetch 가 적용된다.
  fetch: (request) => globalThis.fetch(request),
});

/** Mock 모드 전용: 현재 페이지 URL 의 `mockScenario` 쿼리를 API 요청에 실어 보낸다. */
export const MOCK_SCENARIO_PARAM = 'mockScenario';

if (env.useMock && typeof window !== 'undefined') {
  apiClient.use({
    onRequest({ request }) {
      const scenario = new URLSearchParams(window.location.search).get(MOCK_SCENARIO_PARAM);
      if (!scenario) return undefined;
      const url = new URL(request.url);
      url.searchParams.set(MOCK_SCENARIO_PARAM, scenario);
      return new Request(url, request);
    },
  });
}

/** openapi-fetch 결과에서 data 를 꺼내고, 에러면 throw 한다 (TanStack Query 용). */
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.error !== undefined || !result.response.ok) {
    throw new ApiError(result.response.status, result.error);
  }
  return result.data as T;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`API 요청 실패 (HTTP ${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}
