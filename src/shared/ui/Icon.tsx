import { ICONS, type IconName } from './icons';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

/** 아이콘: IBM Carbon (32 그리드). 색은 currentColor. 뜻은 옆의 글자나 버튼의 이름이 전하므로 스크린리더에는 숨긴다. */
export function Icon({ name, size = 16, className }: IconProps) {
  return (
    <svg
      className={className ? `ic ${className}` : 'ic'}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
