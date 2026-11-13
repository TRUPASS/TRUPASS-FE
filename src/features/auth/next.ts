import { routes } from '@/app/routes';
import { prompts } from '@/shared/lib/prompts';

/** 로그인(또는 회원 정보 입력)을 마친 뒤 갈 곳: 랜딩에서 적어 둔 문장이 있으면 바로 검색, 없으면 새 검색 화면 */
export function afterLogin(): string {
  return prompts.any() ? routes.searching : routes.search;
}
