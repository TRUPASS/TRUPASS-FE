import { routes } from '@/app/routes';
import { searchStartPath } from '@/features/search/searchRef';
import { prompts } from '@/shared/lib/prompts';

/** 질문 작성을 마치고 들어온 경로에만 검색을 이어 간다. 저장된 문장만으로 판단하지 않는다. */
export function isSearchLogin(search: string): boolean {
  return new URLSearchParams(search).get('from') === 'search' && prompts.any();
}

/** 회원 정보 입력이나 재로그인을 거쳐도 검색 진입 경로를 유지한다. */
export function authEntryQuery(search: string): string {
  return isSearchLogin(search) ? '?from=search' : '';
}

/**
 * 로그인(또는 회원 정보 입력)을 마친 뒤 갈 곳. 질문 작성을 마치고 들어왔으면 적어 둔 문장으로 검색을 시작하러 가고
 * (API 에 붙으면 새 검색 화면이 곧바로 POST /searches 를 보낸다), 아니면 새 검색 화면이다.
 */
export function afterLogin(search: string): string {
  return isSearchLogin(search) ? searchStartPath() : routes.search;
}
