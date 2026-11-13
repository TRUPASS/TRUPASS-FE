import { useCallback, useState } from 'react';
import { useLeave } from '@/app/layout/useLeave';
import { loginWithGoogle } from '@/shared/api/auth';
import { loginErrorMessage } from './messages';
import { nextAfterLogin } from './next';

/**
 * Google 이 준 ID 토큰으로 로그인하고 다음 화면으로 넘어간다.
 * 회원 정보 입력을 마치지 않은 계정(처음 가입했거나 입력하다 나간 계정)은 회원 정보 입력으로, 마친 계정은 검색으로 간다.
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
        const { user } = await loginWithGoogle(idToken);
        // 넘어가는 동안 버튼을 다시 누르지 못하게 busy 는 그대로 둔다
        leave(nextAfterLogin(user));
      } catch (e) {
        setError(loginErrorMessage(e));
        setBusy(false);
      }
    },
    [leave],
  );

  return { busy, error, login };
}
