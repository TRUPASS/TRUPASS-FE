import { routes } from '@/app/routes';
import type { SearchKey } from '@/shared/api/queries/searches';
import { authMode } from '@/shared/auth/mode';

/**
 * 검색 화면이 API 에 붙는가. 로그인 없이 화면만 보는 설정(off)에는 백엔드가 없으므로 예시 화면을 그대로 보여 준다.
 * 검색 중 · 결과 화면은 여기에 더해 주소에 searchId · versionNo 가 있어야 API 화면이 된다.
 */
export const searchApiOn = authMode !== 'off';

/** 새 검색 화면에 붙이면 적어 둔 문장으로 곧바로 검색을 시작한다 (로그인 직후 · 로그인한 채로 랜딩에서 문장을 다 적었을 때) */
export const START_PARAM = 'start';

const positive = (value: string | null) => {
  const n = Number(value);
  return value && Number.isSafeInteger(n) && n > 0 ? n : null;
};

/** 주소의 searchId · versionNo. 둘 중 하나라도 없거나 양의 정수가 아니면 null */
export function readSearchKey(params: URLSearchParams): SearchKey | null {
  const searchId = positive(params.get('searchId'));
  const versionNo = positive(params.get('versionNo'));
  return searchId && versionNo ? { searchId, versionNo } : null;
}

const query = ({ searchId, versionNo }: SearchKey) =>
  new URLSearchParams({ searchId: String(searchId), versionNo: String(versionNo) }).toString();

export const searchPaths = {
  /** 검색 중: /search/progress?searchId=12&versionNo=1 */
  progress: (key: SearchKey) => `${routes.searching}?${query(key)}`,
  /** 검색 결과: /results?searchId=12&versionNo=1 */
  results: (key: SearchKey) => `${routes.results}?${query(key)}`,
};

/** 문장 세 개를 다 적은 뒤 갈 곳. API 에 붙으면 새 검색 화면이 검색을 시작하고, 아니면 예시 검색 중 화면으로 간다 */
export function searchStartPath(): string {
  return searchApiOn ? `${routes.search}?${START_PARAM}=1` : routes.searching;
}
