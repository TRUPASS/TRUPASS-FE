import type { ReactNode } from 'react';
import { cx } from '@/shared/lib/cx';
import { BrandMark } from '@/shared/ui/BrandMark';
import type { BrandKey } from '@/shared/ui/brands';
import { Icon } from '@/shared/ui/Icon';

interface OutLinkProps {
  /** 앞에 붙는 회사 마크 */
  brand?: BrandKey;
  className?: string;
  children: ReactNode;
}

/** 바깥 사이트로 이어지는 자리. 아직 주소가 없어 누를 수 없는 글자로 둔다. */
export function OutLink({ brand, className, children }: OutLinkProps) {
  return (
    <span className={cx('lk', className)}>
      {brand && <BrandMark name={brand} size={14} />}
      <span>{children}</span>
      <Icon name="launch" size={14} />
    </span>
  );
}
