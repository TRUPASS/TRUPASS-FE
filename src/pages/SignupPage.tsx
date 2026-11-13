import { AppFooter } from '@/app/layout/AppFooter';
import { AppHeader } from '@/app/layout/AppHeader';
import { SignupForm } from '@/features/signup/SignupForm';
import { useBodyClass } from '@/shared/hooks/useBodyClass';
import { U } from '@/shared/sample/data';

/**
 * 회원 정보 입력. Google 계정으로 처음 가입했을 때 한 번만 거친다. 가운데 한 줄로 내려가는 폼 하나만 둔다.
 * [가입하고 검색 시작]을 누르면 검색 중 화면으로 넘어간다.
 */
export function SignupPage() {
  useBodyClass('veil-in'); // 구름 장막이 걷히며 열린다
  return (
    <>
      <title>회원 정보 입력 | Trupass</title>
      <AppHeader kind="bare" mail={U.mail} />
      <main className="main">
        <div className="cx w680 g24">
          <div className="g8 su-hd">
            <h1 className="t-h1">회원 정보 입력</h1>
            <p className="t-md c2">
              Google 계정으로 처음 오셨습니다. 한 번만 입력하면 되며, 설정에서 언제든 바꿀 수
              있습니다.
            </p>
          </div>
          <SignupForm />
        </div>
      </main>
      <AppFooter />
    </>
  );
}
