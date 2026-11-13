import { Fragment } from 'react';
import { Icon } from './Icon';

const STEPS = ['검색', '항공 · 숙소', '장소', '결제', '완료'];

/** 진행 단계: 검색 → 항공 · 숙소 → 장소 → 결제 → 완료. current 는 지금 단계의 번호(0부터). */
export function Steps({ current }: { current: number }) {
  return (
    <ol className="steps" aria-label="진행 단계">
      {STEPS.map((label, i) => (
        <Fragment key={label}>
          {i > 0 && <li className={i <= current ? 'bar done' : 'bar'} aria-hidden="true" />}
          <li
            className={i < current ? 'step done' : i === current ? 'step on' : 'step'}
            aria-current={i === current ? 'step' : undefined}
          >
            <span className="no">{i < current ? <Icon name="checkmark" size={12} /> : i + 1}</span>
            <span className={i === current ? '' : 'dt-only'}>{label}</span>
          </li>
        </Fragment>
      ))}
    </ol>
  );
}
