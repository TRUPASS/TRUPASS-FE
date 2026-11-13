import { Link } from 'react-router';
import { routes } from '@/app/routes';
import { Recap } from '@/features/search/Recap';
import { useBodyClass } from '@/shared/hooks/useBodyClass';
import { GoogleMark } from '@/shared/ui/BrandMark';
import { Logo } from '@/shared/ui/Logo';

/**
 * 로그인. 랜딩에서 세 번째 문장까지 적고 엔터를 누르면 여기로 온다.
 * 왼쪽 창에는 적어 둔 조건을 그대로 보여 주고, 오른쪽에는 버튼 하나만 둔다.
 * 로그인 수단이 Google 계정 하나뿐이라 로그인과 회원가입을 나누지 않는다. 처음 온 계정이면 회원 정보 입력을 한 번 거친다.
 */
export function LoginPage() {
  useBodyClass('veil-in'); // 구름 장막이 걷히며 열린다
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
          <Link className="btn pri lg fill gbtn" to={routes.signup}>
            <span className="g-tile">
              <GoogleMark size={18} />
            </span>
            Google 계정으로 계속하기
          </Link>
          <p className="t-xs c3">
            계속 진행하면 이용약관과 개인정보 처리방침에 동의하는 것으로 봅니다.
          </p>
        </div>
      </section>
    </main>
  );
}
