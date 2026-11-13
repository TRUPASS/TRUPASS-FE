import { useState } from 'react';
import { Navigate } from 'react-router';
import { GoogleLogin } from '@/features/auth/GoogleLogin';
import { afterLogin } from '@/features/auth/next';
import { Recap } from '@/features/search/Recap';
import { authMode } from '@/shared/auth/mode';
import { session } from '@/shared/auth/session';
import { useBodyClass } from '@/shared/hooks/useBodyClass';
import { Logo } from '@/shared/ui/Logo';

/**
 * 로그인. 랜딩에서 세 번째 문장까지 적고 엔터를 누르면 여기로 온다.
 * 왼쪽 창에는 적어 둔 조건을 그대로 보여 주고, 오른쪽에는 버튼 하나만 둔다.
 * 로그인 수단이 Google 계정 하나뿐이라 로그인과 회원가입을 나누지 않는다. 처음 온 계정이면 회원 정보 입력을 한 번 거친다.
 * 이미 로그인한 채로 오면(예: 로그인한 뒤 랜딩에서 문장을 다시 적음) 곧바로 다음 화면으로 보낸다.
 */
export function LoginPage() {
  useBodyClass('veil-in'); // 구름 장막이 걷히며 열린다
  // 처음 열 때의 상태만 본다. 이 화면에서 로그인한 직후에는 로그인 처리가 갈 곳(회원 정보 입력 등)을 정한다
  const [signedIn] = useState(() => authMode !== 'off' && session.get() !== null);
  if (signedIn) return <Navigate to={afterLogin()} replace />;
  return (
    <main className="auth">
      <title>로그인 | Trupass</title>
      <section className="auth-win">
        <div className="lyr" />
        <div className="auth-top">
          <Logo size={28} variant="inv" />
        </div>
        <div className="auth-btm">
          <p className="auth-h">
            적어 둔 조건으로
            <br />
            바로 검색을 시작합니다.
          </p>
          <Recap />
        </div>
      </section>
      <section className="auth-side">
        <div className="auth-card">
          <div className="g10">
            <h1 className="t-h1">Google 계정으로 시작합니다</h1>
            <p className="t-md c2">
              처음이면 닉네임과 관심사를 한 번만 입력합니다. 비밀번호는 Trupass에 저장되지 않습니다.
            </p>
          </div>
          <GoogleLogin />
          <p className="t-xs c3">
            계속 진행하면 이용약관과 개인정보 처리방침에 동의하는 것으로 봅니다.
          </p>
        </div>
      </section>
    </main>
  );
}
