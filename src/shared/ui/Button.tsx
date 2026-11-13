import type { ComponentProps, MouseEventHandler, ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from './Icon';
import type { IconName } from './icons';

interface Look {
  /** 모양. pri(주 버튼) · txt(글자만) · n(중립 글자색). 여러 개는 띄어 적는다 */
  kind?: string;
  size?: 'sm' | 'lg';
  className?: string;
  /** 글자 앞 · 뒤에 붙는 아이콘 */
  icon?: IconName;
  after?: IconName;
  iconSize?: number;
  /** 끝에 동그란 화살표를 붙인다. true 면 오른쪽 위를 가리키는 화살표, 아이콘 이름을 주면 그 아이콘 */
  arrow?: boolean | IconName;
  onClick?: MouseEventHandler<HTMLElement>;
  children?: ReactNode;
}
// 모양을 정하는 속성과 클릭 핸들러는 위에서 받고, 나머지는 실제로 그려지는 요소의 속성을 그대로 넘긴다
type Own = 'className' | 'children' | 'onClick';
type AsLink = Look & { to: string } & Omit<ComponentProps<typeof Link>, 'to' | Own>;
type AsAnchor = Look & { href: string } & Omit<ComponentProps<'a'>, 'href' | Own>;
type AsButton = Look & Omit<ComponentProps<'button'>, Own>;

/**
 * 버튼. `to` 를 주면 그 화면으로 가는 링크, `href` 를 주면 일반 링크, 둘 다 없으면 button 이다.
 */
export function Button(props: AsLink | AsAnchor | AsButton) {
  const { kind, size, className, icon, after, iconSize = 16, arrow, children, ...rest } = props;
  const cls = ['btn', kind, size, arrow && 'cta', className].filter(Boolean).join(' ');
  const inner = (
    <>
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {after && <Icon name={after} size={iconSize} />}
      {arrow && (
        <span className="arr" aria-hidden="true">
          <Icon name={arrow === true ? 'arrow--up-right' : arrow} size={size === 'sm' ? 14 : 16} />
        </span>
      )}
    </>
  );
  if ('to' in rest) {
    return (
      <Link className={cls} {...rest}>
        {inner}
      </Link>
    );
  }
  if ('href' in rest) {
    return (
      <a className={cls} {...rest}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {inner}
    </button>
  );
}

interface IconLook {
  icon: IconName;
  /** 스크린리더가 읽는 이름 (필수) */
  label: string;
  kind?: string;
  size?: 'sm' | 'lg';
  className?: string;
  iconSize?: number;
  onClick?: MouseEventHandler<HTMLElement>;
}
type IconAsLink = IconLook & { to: string } & Omit<ComponentProps<typeof Link>, 'to' | Own>;
type IconAsButton = IconLook & Omit<ComponentProps<'button'>, Own>;

/** 아이콘만 있는 버튼 */
export function IconButton(props: IconAsLink | IconAsButton) {
  const { icon, label, kind, size, className, iconSize = 20, ...rest } = props;
  const cls = ['btn ico', kind, size, className].filter(Boolean).join(' ');
  if ('to' in rest) {
    return (
      <Link className={cls} aria-label={label} {...rest}>
        <Icon name={icon} size={iconSize} />
      </Link>
    );
  }
  return (
    <button type="button" className={cls} aria-label={label} {...rest}>
      <Icon name={icon} size={iconSize} />
    </button>
  );
}
