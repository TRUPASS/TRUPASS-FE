import { Section } from './Section';
import { MOTIONS } from './specs';
import { Terms } from './Terms';

/** 움직임: 스크롤 연출과 화면 전환의 길이 · 순서 · 가속 곡선 */
export function MotionSection() {
  return (
    <Section
      title="움직임"
      desc="스크롤 위치를 0→1 진행도로 바꿔 화면을 움직인다 (src/js/site.js · globe.js)"
    >
      <Terms items={MOTIONS} />
    </Section>
  );
}
