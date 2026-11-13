import { useCallback, useState } from 'react';
import { useLeave } from '@/app/layout/useLeave';
import { routes } from '@/app/routes';
import { loginWithGoogle } from '@/shared/api/auth';
import { loginErrorMessage } from './messages';
import { afterLogin } from './next';

/**
 * Google 이 준 ID 토큰으로 로그인하고 다음 화면으로 넘어간다.
 * 처음 온 계정(백엔드가 이번에 가입시킨 계정)은 회원 정보 입력으로, 이미 가입한 계정은 검색으로 간다.
 */
export function useGoogleLogin() {
  const leave = useLeave();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const login = useCallback(
    async (idToken: string) => {
      setBusy(true);
      setError('');
      try {
        const { newUser } = await loginWithGoogle(idToken);
        // 넘어가는 동안 버튼을 다시 누르지 못하게 busy 는 그대로 둔다
        leave(newUser ? routes.signup : afterLogin());
      } catch (e) {
        setError(loginErrorMessage(e));
        setBusy(false);
      }
    },
    [leave],
  );

  return { busy, error, login };
}
