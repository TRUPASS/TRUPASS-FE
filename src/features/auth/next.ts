import { routes } from '@/app/routes';
import type { SessionUser } from '@/shared/auth/session';
import { prompts } from '@/shared/lib/prompts';

/** 로그인(또는 회원 정보 입력)을 마친 뒤 갈 곳: 랜딩에서 적어 둔 문장이 있으면 바로 검색, 없으면 새 검색 화면 */
export function afterLogin(): string {
  return prompts.any() ? routes.searching : routes.search;
}

/**
 * 로그인한 사람이 갈 곳. 회원 정보 입력을 마치지 않았으면(처음 가입했거나, 입력하다 나갔다가 다시 온 경우) 회원 정보 입력,
 * 마쳤으면 검색이다. 백엔드의 newUser 는 처음 한 번만 true 라서 쓰지 않는다.
 */
export function nextAfterLogin(user: Pick<SessionUser, 'profileCompleted'>): string {
  return user.profileCompleted ? afterLogin() : routes.signup;
}

/** 회원 정보 입력 전에도 머물 수 있는 화면 */
const BEFORE_PROFILE: readonly string[] = [
  routes.landing,
  routes.login,
  routes.signup,
  routes.styleguide,
];

/**
 * 앱을 열 때 백엔드에서 받은 회원 정보에 맞춰 옮길 곳. 옮기지 않아도 되면 null.
 * - 회원 정보 입력을 마치지 않았는데 회원 화면(검색 · 결제 · 내 여행 등)에 있으면 회원 정보 입력으로
 * - 이미 마쳤는데 회원 정보 입력에 있으면 검색으로
 */
export function profileRedirect(
  user: Pick<SessionUser, 'profileCompleted'>,
  pathname: string,
): string | null {
  if (!user.profileCompleted) return BEFORE_PROFILE.includes(pathname) ? null : routes.signup;
  return pathname === routes.signup ? afterLogin() : null;
}
