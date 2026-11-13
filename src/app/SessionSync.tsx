import { useEffect } from 'react';
import { profileRedirect } from '@/features/auth/next';
import { fetchMe } from '@/shared/api/auth';
import { authMode } from '@/shared/auth/mode';
import { session, useSession } from '@/shared/auth/session';
import { router } from './router';

/**
 * 앱을 열 때(그리고 로그인한 사람이 바뀔 때) 저장해 둔 로그인이 아직 유효한지 백엔드에 묻고 이름 · 사진 · 회원 정보를 최신으로 맞춘다.
 * access token 이 만료됐으면 API 클라이언트가 새 토큰 쌍을 받아 다시 묻고, refresh token 까지 만료됐으면 로그인 상태를 지운다.
 * 회원 정보 입력을 마치지 않았는데 회원 화면에 있으면 회원 정보 입력으로, 마쳤는데 회원 정보 입력에 있으면 검색으로 옮긴다.
 */
export function SessionSync() {
  const userId = useSession()?.user.userId;
  useEffect(() => {
    if (authMode === 'off' || userId === undefined) return;
    let gone = false;
    const asked = session.get()?.user;
    fetchMe().then(
      (user) => {
        if (gone || user.userId !== userId) return;
        // 기다리는 사이 더 새로운 값이 들어왔으면(예: 회원 정보 저장) 늦게 온 이 응답은 버린다
        if (session.get()?.user !== asked) return;
        session.setUser(user);
        const to = profileRedirect(user, router.state.location.pathname);
        if (to) void router.navigate(to, { replace: true });
      },
      () => {
        // 인증이 끝난 경우는 API 클라이언트가 이미 로그인 상태를 지웠다. 서버에 닿지 못한 경우는 그대로 둔다
      },
    );
    return () => {
      gone = true;
    };
  }, [userId]);
  return null;
}
