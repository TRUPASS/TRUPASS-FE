import { Link } from 'react-router';
import { routes } from '@/app/routes';
import { AccountMenu, SignOutButton } from '@/features/auth/AccountMenu';
import { IconButton } from '@/shared/ui/Button';
import { Logo } from '@/shared/ui/Logo';

// 아직 화면이 없는 메뉴는 주소 없이 이름만 둔다.
const NAV = [
  ['새 검색', routes.search],
  ['내 여행', routes.trips],
  ['결제 내역', ''],
] as const;

interface AppHeaderProps {
  /** 지금 화면의 메뉴 이름 */
  on?: (typeof NAV)[number][0];
  /** 본문 폭에 맞추지 않고 화면 폭을 다 쓴다 */
  wide?: boolean;
  /** bare: 메뉴 없이 로고와 로그아웃만 (회원 정보 입력) */
  kind?: 'bare';
  /** bare 일 때 로그아웃 앞에 보이는 이메일 */
  mail?: string;
}

/** 상단 바 (앱 화면). 오른쪽 계정 자리는 로그인 상태를 따른다 (AccountMenu) */
export function AppHeader({ on, wide, kind, mail }: AppHeaderProps) {
  const cls = wide ? 'hdr jb wide' : 'hdr jb';
  if (kind === 'bare') {
    return (
      <header className={cls}>
        <Logo />
        <div className="row g12">
          <span className="t-sm c3 dt-only">{mail}</span>
          <SignOutButton />
        </div>
      </header>
    );
  }
  return (
    <header className={cls}>
      <div className="row g32">
        <Logo to={routes.search} />
        <nav className="nav dt-only" aria-label="주 메뉴">
          {NAV.map(([label, to]) =>
            to ? (
              <Link
                key={label}
                className={label === on ? 'on' : ''}
                to={to}
                aria-current={label === on ? 'page' : undefined}
              >
                {label}
              </Link>
            ) : (
              <a key={label} className={label === on ? 'on' : ''} aria-disabled="true">
                {label}
              </a>
            ),
          )}
        </nav>
      </div>
      <div className="row g8">
        <IconButton icon="notification" kind="txt n" label="알림" />
        <AccountMenu />
      </div>
    </header>
  );
}
