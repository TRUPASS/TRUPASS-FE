import { Link } from 'react-router';
import { routes } from '@/app/routes';
import { Button, IconButton } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
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
  mail?: string;
}

/** 상단 바 (앱 화면) */
export function AppHeader({ on, wide, kind, mail }: AppHeaderProps) {
  const cls = wide ? 'hdr jb wide' : 'hdr jb';
  if (kind === 'bare') {
    return (
      <header className={cls}>
        <Logo />
        <div className="row g12">
          <span className="t-sm c3 dt-only">{mail}</span>
          <Button kind="txt n" size="sm" to={routes.landing}>
            로그아웃
          </Button>
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
        <button type="button" className="me dt-only" aria-label="OO님 계정 메뉴">
          <span className="av">O</span>
          <span className="w5">OO님</span>
          <Icon name="chevron--down" size={16} className="c3" />
        </button>
        <IconButton icon="menu" kind="txt n" className="m-only" label="메뉴" />
      </div>
    </header>
  );
}
