import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import { reduceMotion, still } from '@/shared/lib/capture';

// 이 화면들로 갈 때는 구름이 화면을 덮은 뒤 넘어간다. 도착한 화면은 구름이 걷히며 열린다(body.veil-in).
const VEILED: string[] = [routes.login, routes.signup];

/** 구름 장막을 거쳐 가야 하는 주소인가 */
export function needsVeil(to: string): boolean {
  return VEILED.includes(to.split(/[?#]/)[0] ?? to);
}

/**
 * 다른 화면으로 넘어가는 함수를 돌려준다. 로그인 · 회원 정보 입력으로 갈 때는 구름 장막(html.leaving)이 덮인 뒤에 넘어간다.
 * 움직임을 줄이도록 설정했거나 정지 화면 캡처 중이면 바로 넘어간다.
 */
export function useLeave() {
  const navigate = useNavigate();
  return useCallback(
    (to: string) => {
      if (reduceMotion() || still || !needsVeil(to)) {
        void navigate(to);
        return;
      }
      document.documentElement.classList.add('leaving');
      window.setTimeout(() => void navigate(to), 640);
    },
    [navigate],
  );
}
