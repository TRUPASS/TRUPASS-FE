import { Section } from './Section';
import { MOTIONS } from './specs';
import { Terms } from './Terms';

/** 움직임: 스크롤 연출과 화면 전환의 길이 · 순서 · 가속 곡선 */
export function MotionSection() {
  return (
    <Section
      title="움직임"
      desc="서비스 사진은 스크롤에 따라 확대되고, 질문과 배경은 답변을 제출할 때 바뀐다."
    >
      <Terms items={MOTIONS} />
    </Section>
  );
}
