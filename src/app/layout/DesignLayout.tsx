import { useEffect, useLayoutEffect, useRef } from 'react';
import { Navigate, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { routes } from '@/app/routes';
import { profileRedirect } from '@/features/auth/next';
import { useSignedInUser } from '@/shared/auth/member';
import { session } from '@/shared/auth/session';
import { useBodyClass } from '@/shared/hooks/useBodyClass';
import { SCROLL_KEY } from './scrollMemory';
import { needsVeil, useLeave } from './useLeave';

/**
 * 디자인된 화면들의 바깥 틀.
 * - body 에 .tp 를 붙여 디자인 시스템의 바탕 규칙(styles/tokens.css)을 건다.
 * - 화면을 넘길 때의 구름 장막(.veil)을 깔아 둔다. 평소에는 보이지 않는다.
 * - 화면이 바뀌면 새 화면의 이름을 스크린리더에 알린다. 주소만 바뀌는 앱에서는 브라우저가 새 화면을 읽어 주지 않는다.
 * - 회원 정보 입력을 마치지 않은 사람이 회원 화면(검색 · 결제 · 내 여행 등)으로 오면 회원 정보 입력으로 보낸다.
 *   로그인 화면을 거치지 않는 앱 안의 이동(랜딩의 [새 검색], 세 번째 문장 엔터 등)도 여기서 막는다.
 */
export function DesignLayout() {
  useBodyClass('tp');
  const { pathname, search } = useLocation();
  const user = useSignedInUser();
  // 기기에 남아 있던 값은 낡았을 수 있어(다른 기기에서 입력을 마친 경우 등) 이 탭에서 서버로 확인한 정보일 때만 막는다.
  // 앱을 막 열었을 때는 SessionSync 가 서버에 물어본 뒤 옮긴다
  const needsProfile =
    user !== null &&
    !user.profileCompleted &&
    session.confirmed() &&
    profileRedirect(user, pathname) === routes.signup;
  const leave = useLeave();
  const say = useRef<HTMLParagraphElement>(null);
  const shown = useRef(pathname + search);

  // 처음 연 화면은 브라우저가 읽어 주므로, 그 뒤에 바뀐 화면부터 탭 제목을 알린다
  useEffect(() => {
    if (shown.current === pathname + search) return;
    shown.current = pathname + search;
    if (say.current) say.current.textContent = document.title;
  }, [pathname, search]);

  // 새 화면이 그려지는 순간 장막을 거둔다. 도착한 화면이 body.veil-in 을 붙이는 것과 같은 때라 장막이 깜빡이지 않는다.
  useLayoutEffect(() => {
    document.documentElement.classList.remove('leaving');
  }, [pathname]);

  // 로그인 · 회원 정보 입력으로 가는 링크는 장막을 덮은 뒤에 넘긴다 (Link 가 처리하기 전에 가로챈다)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href]') : null;
      const to = a?.getAttribute('href');
      if (!a || !to || a.target === '_blank' || !needsVeil(to)) return;
      e.preventDefault();
      leave(to);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [leave]);

  return (
    <>
      <p ref={say} className="vh" role="status" />
      {needsProfile ? <Navigate to={routes.signup} replace /> : <Outlet />}
      <div className="veil" aria-hidden="true">
        <i />
      </div>
      <ScrollRestoration storageKey={SCROLL_KEY} />
    </>
  );
}
