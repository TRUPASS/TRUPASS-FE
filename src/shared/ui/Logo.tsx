import type { MouseEventHandler } from 'react';
import { Link } from 'react-router';
import { cx } from '@/shared/lib/cx';
import { LOGO } from './logoPaths';

/** 색 조합: 흰 바탕은 남색 + 하늘색, inv 는 사진 · 색 면 위의 흰색, duo 는 남색 면 위의 흰색 + 하늘색 */
export type LogoVariant = 'default' | 'inv' | 'duo';

const width = (size: number, w: number) => Math.round(((size * w) / LOGO.h) * 10) / 10;
const variantClass = (v: LogoVariant) => (v === 'default' ? null : v === 'duo' ? 'inv duo' : 'inv');

/** 마크만. size 는 높이(px)이고 폭은 비율대로 정해진다. */
export function LogoMark({
  size = 28,
  variant = 'default',
}: {
  size?: number;
  variant?: LogoVariant;
}) {
  return (
    <svg
      className={cx('mark', variantClass(variant))}
      width={width(size, LOGO.mw)}
      height={size}
      viewBox={`0 0 ${LOGO.mw} ${LOGO.h}`}
      aria-hidden="true"
    >
      <path className="a" d={LOGO.a} />
      <path className="b" d={LOGO.b} />
    </svg>
  );
}

function Wordmark({ size }: { size: number }) {
  const w = Math.round((LOGO.w - LOGO.mw) * 10) / 10;
  return (
    <svg
      className="wm"
      width={width(size, LOGO.w - LOGO.mw)}
      height={size}
      viewBox={`${LOGO.mw} 0 ${w} ${LOGO.h}`}
      aria-hidden="true"
    >
      <path className="a" d={LOGO.t} />
    </svg>
  );
}

interface LogoProps {
  /** 높이(px) */
  size?: number;
  variant?: LogoVariant;
  /** 누르면 갈 곳. 기본은 처음 화면 */
  to?: string;
  /** 스크린리더가 읽는 이름 */
  label?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

/**
 * Trupass 로고: 마크 + 워드마크. 두 그림은 따로 놓여 있어 좁은 자리에서는 워드마크(.wm)만 숨길 수 있다.
 * 색은 styles/components.css 의 .mark · .logo 규칙이 정한다.
 */
export function Logo({
  size = 24,
  variant = 'default',
  to = '/',
  label = 'Trupass 처음 화면',
  onClick,
}: LogoProps) {
  return (
    <Link
      className={cx('logo', variantClass(variant))}
      to={to}
      aria-label={label}
      onClick={onClick}
    >
      <LogoMark size={size} />
      <Wordmark size={size} />
    </Link>
  );
}
