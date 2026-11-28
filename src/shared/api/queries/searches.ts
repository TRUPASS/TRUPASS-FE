// 검색 API (팀 Notion "엔드포인트" DB 의 B1 · B2): 시작 → 진행 상태 폴링 → 취소 · 검색 조건 · 선택한 조합.
// 금액은 모두 백엔드가 계산한 값이다. 여기서도, 화면에서도 더하거나 빼지 않는다.
import { useMutation, useQuery } from '@tanstack/react-query';
import { ApiError, apiClient, unwrapResult, type Schemas } from '../client';
import { queryKeys } from './keys';

export type CreateSearchBody = Schemas['CreateSearchBody'];
export type SearchStatus = Schemas['SearchStatus'];
export type SearchProgressStep = Schemas['SearchProgressStep'];
export type SearchStarted = Schemas['SearchStarted'];
export type SearchProgress = Schemas['SearchProgress'];
export type SearchVersion = Schemas['SearchVersion'];
export type SearchCondition = Schemas['SearchCondition'];
export type Combination = Schemas['Combination'];

/** 검색 한 건의 한 버전 (주소의 searchId · versionNo) */
export interface SearchKey {
  searchId: number;
  versionNo: number;
}

/** 진행 상태를 다시 묻는 간격 (계약 권장 1–2초) */
export const SEARCH_POLL_MS = 1500;

/** 진행 중일 때만 다시 묻는다. 끝났거나(COMPLETED · FAILED · CANCELED) 아직 모르면 멈춘다 */
export function searchPollInterval(status: SearchStatus | undefined): number | false {
  return status === 'IN_PROGRESS' ? SEARCH_POLL_MS : false;
}

/** 4xx 는 다시 보내도 결과가 같으므로 바로 실패로 둔다. 연결 문제나 5xx 만 한 번 더 보낸다 */
function retryOnce(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 1;
}

/** 공통 응답에서 result 를 꺼낸다. 성공 응답인데 result 가 없으면 계약과 다르므로 실패로 본다 */
function resultOf<T extends { result?: unknown }>(res: {
  data?: T;
  error?: unknown;
  response: Response;
}): NonNullable<T['result']> {
  const result = unwrapResult(res);
  if (result === undefined || result === null) throw new ApiError(res.response.status, res.data);
  return result as NonNullable<T['result']>;
}

const path = ({ searchId, versionNo }: SearchKey) => ({
  params: { path: { searchId, versionNo } },
});

export function useCreateSearch() {
  return useMutation({
    mutationFn: async (body: CreateSearchBody) =>
      resultOf(await apiClient.POST('/searches', { body })),
  });
}

export async function fetchSearchProgress(key: SearchKey): Promise<SearchProgress> {
  return resultOf(
    await apiClient.GET('/searches/{searchId}/versions/{versionNo}/progress', path(key)),
  );
}

/** 검색 중 화면이 폴링한다. 진행 중이면 1.5초마다 다시 묻고, 끝난 상태가 오면 멈춘다 */
export function useSearchProgress(
  searchId: number,
  versionNo: number,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.searchProgress(searchId, versionNo),
    queryFn: () => fetchSearchProgress({ searchId, versionNo }),
    enabled,
    // 화면을 다시 열면 들고 있던 값 대신 지금 상태를 먼저 묻는다
    staleTime: 0,
    retry: retryOnce,
    refetchInterval: (query) => searchPollInterval(query.state.data?.status),
  });
}

export function useCancelSearch() {
  return useMutation({
    mutationFn: async (key: SearchKey) =>
      resultOf(await apiClient.POST('/searches/{searchId}/versions/{versionNo}/cancel', path(key))),
  });
}

/** 결과 화면의 요청 표: 이 버전의 문장과 검색에 적용한 조건 */
export function useSearchVersion(searchId: number, versionNo: number) {
  return useQuery({
    queryKey: queryKeys.searchVersion(searchId, versionNo),
    queryFn: async () =>
      resultOf(
        await apiClient.GET(
          '/searches/{searchId}/versions/{versionNo}',
          path({ searchId, versionNo }),
        ),
      ),
    retry: retryOnce,
  });
}

/** 결과 화면의 [선택한 조합]과 아래 고정 바. 검색이 끝나기 전이면 404(COMBINATION404_1)다 */
export function useCombination(searchId: number, versionNo: number) {
  return useQuery({
    queryKey: queryKeys.combination(searchId, versionNo),
    queryFn: async () =>
      resultOf(
        await apiClient.GET(
          '/searches/{searchId}/versions/{versionNo}/combination',
          path({ searchId, versionNo }),
        ),
      ),
    retry: retryOnce,
  });
}
