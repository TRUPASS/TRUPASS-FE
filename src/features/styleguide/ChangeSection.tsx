import { Section } from './Section';
import { CHANGES } from './specs';

/** 이번에 바꾼 것: 2차 시안의 모습(지운 글)과 3차 기준을 나란히 적는다 */
export function ChangeSection() {
  return (
    <Section title="이번에 바꾼 것">
      <div>
        <div className="rule">
          <span className="a t-xs">2차 시안</span>
          <span className="b t-xs c3">3차 기준</span>
        </div>
        {CHANGES.map(([before, after]) => (
          <div key={before} className="rule">
            <span className="a del">{before}</span>
            <span className="b">{after}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
