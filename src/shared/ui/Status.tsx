import type { ReactNode } from 'react';
import { cx } from '@/shared/lib/cx';
import { Icon } from './Icon';
import type { IconName } from './icons';

/** 상태: 글자 색으로 구분한다. tone 이 없으면 기본 글자색(대기)이다. 점은 진행 중(run)에만 붙는다. */
export function Status({
  tone,
  children,
}: {
  tone?: 'ok' | 'warn' | 'bad' | 'run';
  children: ReactNode;
}) {
  return (
    <span className={cx('st', tone)}>
      {tone === 'run' && <span className="d" />}
      <span>{children}</span>
    </span>
  );
}

/** 표식. tone: b(하늘색) · y(바뀜) · g · r */
export function Tag({ tone = '', children }: { tone?: string; children: ReactNode }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}

/** 이름과 값 한 줄 */
export function Kv({
  k,
  line = true,
  children,
}: {
  k: ReactNode;
  line?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={line ? 'kv line' : 'kv'}>
      <span className="k">{k}</span>
      <div className="grow">{children}</div>
    </div>
  );
}

/** 안내 문구 상자 */
export function Note({
  tone = '',
  icon = 'information',
  children,
}: {
  tone?: string;
  icon?: IconName;
  children: ReactNode;
}) {
  return (
    <div className={`note ${tone}`}>
      <Icon name={icon} size={16} />
      <div className="grow">{children}</div>
    </div>
  );
}
