import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { routes } from '@/app/routes';
import { authMode } from '@/shared/auth/mode';
import { env } from '@/shared/lib/env';
import { GoogleMark } from '@/shared/ui/BrandMark';
import { initGoogleId, loadGoogleId, onCredential } from './gis';
import { MOCK_ID_TOKEN } from './mock';
import { useGoogleLogin } from './useGoogleLogin';

/** 디자인의 Google 버튼 모양 (Mock 로그인과 로그인 없이 보는 화면에서 쓴다) */
function GoogleLook() {
  return (
    <>
      <span className="g-tile">
        <GoogleMark size={18} />
      </span>
      Google 계정으로 계속하기
    </>
  );
}

/** Google 이 그리는 로그인 버튼 (iframe). 누르면 Google 창이 뜨고, 고른 계정의 ID 토큰이 onToken 으로 온다 */
function GsiButton({ onToken, busy }: { onToken: (credential: string) => void; busy: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => onCredential(onToken), [onToken]);

  useEffect(() => {
    let gone = false;
    let observer: ResizeObserver | undefined;
    loadGoogleId().then(
      (id) => {
        const el = box.current;
        if (gone || !el) return;
        initGoogleId(id, env.googleClientId);
        let drawn = 0;
        // 버튼 폭은 그릴 때 정해진다(200~400px). 칸의 폭이 달라지면 다시 그린다
        const draw = () => {
          const width = Math.max(200, Math.min(400, Math.round(el.clientWidth || 400)));
          if (Math.abs(width - drawn) < 8) return;
          drawn = width;
          id.renderButton(el, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'center',
            width,
            locale: 'ko',
          });
        };
        draw();
        if (typeof ResizeObserver !== 'undefined') {
          observer = new ResizeObserver(draw);
          observer.observe(el);
        }
      },
      () => {
        if (!gone) setFailed(true);
      },
    );
    return () => {
      gone = true;
      observer?.disconnect();
    };
  }, [attempt]);

  return (
    <>
      <div ref={box} className="auth-gsi" inert={busy} aria-label="Google 계정으로 계속하기" />
      {failed && (
        <p className="t-sm cbad" role="alert">
          Google 로그인 버튼을 불러오지 못했습니다.{' '}
          <button
            type="button"
            className="tbtn t-sm"
            onClick={() => {
              setFailed(false);
              setAttempt((n) => n + 1);
            }}
          >
            다시 시도
          </button>
        </p>
      )}
    </>
  );
}

/** 백엔드에 로그인하는 버튼과 진행 · 실패 문구 */
function ConnectedLogin() {
  const { busy, error, login } = useGoogleLogin();
  return (
    <div className="g10 auth-go">
      {authMode === 'google' ? (
        <GsiButton onToken={login} busy={busy} />
      ) : (
        <button
          type="button"
          className="btn pri lg fill gbtn"
          disabled={busy}
          onClick={() => void login(MOCK_ID_TOKEN)}
        >
          <GoogleLook />
        </button>
      )}
      {busy && (
        <p className="t-sm c2" role="status">
          로그인하는 중입니다.
        </p>
      )}
      {error && (
        <p className="t-sm cbad" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * 로그인 화면의 Google 버튼.
 * - google: Google 의 공식 버튼. 받은 ID 토큰을 백엔드로 보내 로그인한다
 * - mock: 디자인의 버튼. 누르면 Mock API 로 로그인한다 (Google 창 없음)
 * - off: 디자인의 버튼. 로그인 없이 회원 정보 입력 화면으로 넘어간다 (화면 확인용)
 */
export function GoogleLogin() {
  if (authMode === 'off') {
    return (
      <Link className="btn pri lg fill gbtn" to={routes.signup}>
        <GoogleLook />
      </Link>
    );
  }
  return <ConnectedLogin />;
}
