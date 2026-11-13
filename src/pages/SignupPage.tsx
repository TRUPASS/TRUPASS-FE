import { AppFooter } from '@/app/layout/AppFooter';
import { AppHeader } from '@/app/layout/AppHeader';
import { RequireSession } from '@/features/auth/RequireSession';
import { SignupForm } from '@/features/signup/SignupForm';
import { useSignedInUser } from '@/shared/auth/member';
import { useBodyClass } from '@/shared/hooks/useBodyClass';
import { U } from '@/shared/sample/data';

/** 닉네임 칸의 최대 글자 수 */
const NICK_MAX = 12;

/**
 * 회원 정보 입력. Google 계정으로 처음 가입했을 때 한 번만 거친다. 가운데 한 줄로 내려가는 폼 하나만 둔다.
 * 이메일은 로그인한 Google 계정의 것을 보여 주고, 닉네임은 Google 계정의 이름으로 채워 둔다(로그인 없이 볼 때는 예시 값).
 * [가입하고 검색 시작]을 누르면 검색으로 넘어간다. 로그인하지 않았으면 로그인 화면으로 보낸다.
 */
export function SignupPage() {
  useBodyClass('veil-in'); // 구름 장막이 걷히며 열린다
  const user = useSignedInUser();
  const mail = user?.email ?? U.mail;
  const nick = Array.from(user ? (user.name ?? '') : U.nick)
    .slice(0, NICK_MAX)
    .join('');
  return (
    <RequireSession>
      <title>회원 정보 입력 | Trupass</title>
      <AppHeader kind="bare" mail={mail} />
      <main className="main">
        <div className="cx w680 g24">
          <div className="g8 su-hd">
            <h1 className="t-h1">회원 정보 입력</h1>
            <p className="t-md c2">
              Google 계정으로 처음 오셨습니다. 한 번만 입력하면 되며, 설정에서 언제든 바꿀 수
              있습니다.
            </p>
          </div>
          <SignupForm email={mail} nickname={nick} />
        </div>
      </main>
      <AppFooter />
    </RequireSession>
  );
}
