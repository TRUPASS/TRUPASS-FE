import { cx } from '@/shared/lib/cx';
import { PAY } from '@/shared/sample/data';
import { Icon } from '@/shared/ui/Icon';
import type { PayDoc } from './docs';

interface DocRowProps {
  doc: PayDoc;
  /** 목록의 첫 줄: 위쪽 선을 긋지 않는다 */
  first?: boolean;
}

/** 문서 한 줄: 문서 이름과 찾는 번호, 이메일로 보낸 시각 */
export function DocRow({ doc, first }: DocRowProps) {
  return (
    <div className={cx('doc', first && 'first')}>
      <Icon name={doc.icon} size={20} className="c2" />
      <div className="g2 grow">
        <span className="t-md w5">{doc.title}</span>
        <span className="t-xs c3">{doc.sub}</span>
      </div>
      <span className="t-xs c3 num fn">{`${PAY.mailed} 발송`}</span>
    </div>
  );
}
