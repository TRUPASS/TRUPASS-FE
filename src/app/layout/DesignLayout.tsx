import { useEffect, useLayoutEffect } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { useBodyClass } from '@/shared/hooks/useBodyClass';
import { needsVeil, useLeave } from './useLeave';

/**
 * 디자인을 옮긴 화면들의 바깥 틀.
 * - body 에 .tp 를 붙여 디자인 시스템의 바탕 규칙(styles/tokens.css)을 건다.
 * - 화면을 넘길 때의 구름 장막(.veil)을 깔아 둔다. 평소에는 보이지 않는다.
 */
export function DesignLayout() {
  useBodyClass('tp');
  const { pathname } = useLocation();
  const leave = useLeave();

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
      <Outlet />
      <div className="veil" aria-hidden="true">
        <i />
      </div>
      <ScrollRestoration />
    </>
  );
}
