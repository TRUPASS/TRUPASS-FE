import { Section } from './Section';
import { TYPE_SCALE } from './specs';

/** 글꼴: 글자 크기 여덟 단을 이름 · 크기와 함께 보기 문장으로 보여 준다 */
export function TypeSection() {
  return (
    <Section
      title="글꼴"
      desc="라틴 · 숫자 Outfit, 한글 Gothic A1 (둘 다 SIL OFL). 큰 글자는 300, 본문은 400 · 크기 / 줄 높이 · 굵기"
    >
      <div>
        {TYPE_SCALE.map(([className, name, metrics, sample]) => (
          <div key={name} className="ty">
            <div className="m g0">
              <span className="t-sm w5">{name}</span>
              <span className="t-xs c3 num">{metrics}</span>
            </div>
            <span className={`${className} grow`}>{sample}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
