import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { routes } from '@/app/routes';
import { authMode } from '@/shared/auth/mode';
import { useSession } from '@/shared/auth/session';
import { authEntryQuery } from './next';

/**
 * 로그인해야 볼 수 있는 화면. 로그인 상태가 아니면 로그인 화면으로 보낸다.
 * 로그인 없이 화면만 보는 설정(off)에서는 그대로 보여 준다.
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const current = useSession();
  const { search } = useLocation();
  if (authMode !== 'off' && !current)
    return <Navigate to={`${routes.login}${authEntryQuery(search)}`} replace />;
  return children;
}
