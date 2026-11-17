import { FLOW } from './flow';
import { Section } from './Section';

/** 화면 흐름: 화면을 번호 순서대로 적고 화면마다 하는 일을 설명한다 */
export function FlowSection() {
  return (
    <Section
      title="화면 흐름"
      desc="번호 순서대로 진행한다 · 데스크톱 1440 / 태블릿 834 / 모바일 390"
    >
      <div>
        {FLOW.map((screen) => (
          <div key={screen.id} className="fl">
            <span className="n num">{screen.no}</span>
            <span className="t">{screen.name}</span>
            <span className="c2 grow">{screen.note}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
