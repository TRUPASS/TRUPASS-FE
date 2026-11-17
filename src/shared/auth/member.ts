import { U } from '@/shared/sample/data';
import { authMode } from './mode';
import { useSession, type SessionUser } from './session';

/** 화면에 부를 이름: Google 계정의 이름, 없으면 이메일의 @ 앞 */
export function displayName(user: SessionUser): string {
  return user.name?.trim() || user.email.split('@')[0] || user.email;
}

/**
 * 로그인한 사람. 로그인 없이 화면만 보는 설정(off)에서는 늘 없다
 * (같은 주소에서 예전에 다른 설정으로 로그인해 둔 값이 남아 있어도 쓰지 않는다).
 */
export function useSignedInUser(): SessionUser | null {
  const user = useSession()?.user ?? null;
  return authMode === 'off' ? null : user;
}

/** 화면에 보일 회원: 로그인했으면 그 사람, 아니면(로그인 없이 화면만 볼 때 등) 예시 회원 */
export function useMember(): {
  /** "OO님"처럼 부르는 이름 */
  nick: string;
  /** 권한 증명서처럼 이름을 적는 곳 */
  name: string;
  email: string;
} {
  const user = useSignedInUser();
  if (!user) return { nick: U.nick, name: U.name, email: U.mail };
  const shown = displayName(user);
  return { nick: shown, name: user.name?.trim() || shown, email: user.email };
}
