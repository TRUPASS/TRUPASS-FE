import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import { logout } from '@/shared/api/auth';
import { forgetGoogleSelection } from './gis';

/** 로그아웃하고 랜딩으로 간다. 화면을 먼저 옮긴 뒤 로그인 상태를 지워, 로그인이 필요한 화면이 로그인 화면으로 튀지 않게 한다 */
export function useLogout() {
  const navigate = useNavigate();
  return useCallback(async () => {
    forgetGoogleSelection();
    await navigate(routes.landing);
    await logout();
  }, [navigate]);
}
