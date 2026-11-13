import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import { logout } from '@/shared/api/auth';
import { forgetGoogleSelection } from './gis';

/**
 * 로그아웃하고 랜딩으로 간다. 화면을 먼저 옮긴 뒤 로그인 상태를 지워, 로그인이 필요한 화면(회원 정보 입력)이 로그인 화면으로 튀지 않게 한다.
 * 화면 전환은 보통 transition 으로 늦게 그려지므로 flushSync 로 랜딩을 먼저 확정한다. 그러지 않으면 로그인 상태를 지운 것이 먼저 반영돼
 * 아직 떠 있던 회원 정보 입력이 로그인 화면으로 보낸다.
 */
export function useLogout() {
  const navigate = useNavigate();
  return useCallback(async () => {
    forgetGoogleSelection();
    await navigate(routes.landing, { flushSync: true });
    await logout();
  }, [navigate]);
}
