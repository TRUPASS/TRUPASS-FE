import createClient from 'openapi-fetch';
import { authFetch } from '@/shared/auth/authFetch';
import { readFailure } from '@/shared/auth/payload';
import { env } from '@/shared/lib/env';
import type { components, paths } from './schema';

export type Schemas = components['schemas'];

export const apiClient = createClient<paths>({
  baseUrl: env.apiBaseUrl,
  // 로그인 상태면 access token 을 붙이고 만료되면 바꿔서 다시 보낸다. 안에서 호출 시점의 fetch 를 쓰므로 MSW 도 그대로 가로챈다.
  fetch: (request) => authFetch(request),
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

/**
 * 백엔드 공통 응답({isSuccess, code, message, result})에서 result 를 꺼낸다. 실패 응답이면 throw 한다.
 * result 가 없는 응답(예: 로그아웃)은 undefined 를 돌려준다.
 */
export function unwrapResult<T extends { result?: unknown }>(res: {
  data?: T;
  error?: unknown;
  response: Response;
}): T['result'] {
  const data = unwrap(res) as (T & { isSuccess?: boolean }) | undefined;
  if (data?.isSuccess === false) throw new ApiError(res.response.status, data);
  return data?.result;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  /** 백엔드 에러 코드 (예: AUTH401_1). 공통 응답 형식이 아니면 없다 */
  readonly code?: string;
  /** 백엔드가 보낸 메시지 */
  readonly serverMessage?: string;

  constructor(status: number, body: unknown) {
    super(`API 요청 실패 (HTTP ${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    const { code, message } = readFailure(body);
    this.code = code;
    this.serverMessage = message;
  }
}
