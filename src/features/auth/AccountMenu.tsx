import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { routes } from '@/app/routes';
import { displayName } from '@/shared/auth/member';
import { authMode } from '@/shared/auth/mode';
import { useSession, type SessionUser } from '@/shared/auth/session';
import { Button, IconButton } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { useLogout } from './useLogout';

/** 로그인 없이 화면만 볼 때(off)의 자리: 디자인 그대로의 예시 계정 */
function SampleAccount() {
  return (
    <>
      <button type="button" className="me dt-only" aria-label="OO님 계정 메뉴">
        <span className="av">O</span>
        <span className="w5">OO님</span>
        <Icon name="chevron--down" size={16} className="c3" />
      </button>
      <IconButton icon="menu" kind="txt n" className="m-only" label="메뉴" />
    </>
  );
}

/** 프로필 사진(없거나 불러오지 못하면 이름의 첫 글자) */
function Avatar({ user, name }: { user: SessionUser; name: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className="av">
      {user.pictureUrl && !broken ? (
        <img
          src={user.pictureUrl}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : (
        Array.from(name)[0]?.toUpperCase()
      )}
    </span>
  );
}

/** 로그인한 사람의 계정 단추와 메뉴(이름 · 이메일 · 로그아웃). 데스크톱은 계정 단추, 모바일은 메뉴 단추로 연다 */
function SignedIn({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const panelId = useId();
  const logout = useLogout();
  const name = displayName(user);

  // 메뉴 밖을 누르거나 Esc 를 누르면 닫는다 (Esc 는 연 단추로 초점을 돌려준다)
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!(e.target instanceof Node && wrap.current?.contains(e.target))) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      opener.current?.focus();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (e: MouseEvent<HTMLElement>) => {
    opener.current = e.currentTarget;
    setOpen((v) => !v);
  };

  return (
    <div ref={wrap} className="me-wrap">
      <button
        type="button"
        className="me dt-only"
        aria-label={`${name}님 계정 메뉴`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        <Avatar user={user} name={name} />
        <span className="w5 me-nm">{`${name}님`}</span>
        <Icon name="chevron--down" size={16} className="c3" />
      </button>
      <IconButton
        icon="menu"
        kind="txt n"
        className="m-only"
        label="계정 메뉴"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      />
      <div id={panelId} className="me-menu" hidden={!open}>
        <div className="me-who">
          <span className="t-md w6">{name}</span>
          <span className="t-xs c3">{user.email}</span>
        </div>
        <button
          type="button"
          className="me-it"
          onClick={() => {
            setOpen(false);
            void logout();
          }}
        >
          <Icon name="logout" size={16} className="c2" />
          로그아웃
        </button>
      </div>
    </div>
  );
}

/**
 * 상단 바 오른쪽의 계정 자리.
 * 로그인했으면 계정 메뉴, 로그인하지 않았으면 [로그인], 로그인 없이 화면만 볼 때는 디자인의 예시 계정이다.
 */
export function AccountMenu() {
  const current = useSession();
  if (authMode === 'off') return <SampleAccount />;
  if (!current) {
    return (
      <Button kind="txt n" size="sm" to={routes.login}>
        로그인
      </Button>
    );
  }
  return <SignedIn user={current.user} />;
}

/** 회원 정보 입력 화면 상단의 [로그아웃] */
export function SignOutButton() {
  const logout = useLogout();
  if (authMode === 'off') {
    return (
      <Button kind="txt n" size="sm" to={routes.landing}>
        로그아웃
      </Button>
    );
  }
  return (
    <Button kind="txt n" size="sm" onClick={() => void logout()}>
      로그아웃
    </Button>
  );
}
