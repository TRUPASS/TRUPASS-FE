import { ChangeSection } from '@/features/styleguide/ChangeSection';
import { ColorSection } from '@/features/styleguide/ColorSection';
import { ComponentSection } from '@/features/styleguide/ComponentSection';
import { DockSection } from '@/features/styleguide/DockSection';
import { FlowSection } from '@/features/styleguide/FlowSection';
import { IconSection } from '@/features/styleguide/IconSection';
import { LogoSection } from '@/features/styleguide/LogoSection';
import { MotionSection } from '@/features/styleguide/MotionSection';
import { ShapeSection } from '@/features/styleguide/ShapeSection';
import { TypeSection } from '@/features/styleguide/TypeSection';

/**
 * 디자인 기준. 색 · 글꼴 · 모서리 · 아이콘 · 컴포넌트 · 수정 요청 독 · 움직임과 화면 흐름을 한 장에 모은다.
 * 색 값은 styles/tokens.css 에서 읽는다.
 */
export function StyleGuidePage() {
  return (
    <main className="fd">
      <title>디자인 기준 | Trupass</title>
      <div className="g10">
        <h1 className="t-display">하늘 · 흰색 · 인디고</h1>
        <p className="t-lg c2 mw720">
          Trupass 디자인 기준 3차, 2026.11 정리본. 흰 바탕에 깊은 인디고 글자, 강조는 하늘색 한
          가지. 색은 사진과 하늘이 맡고, 화면은 넉넉한 모서리와 가는 큰 글자로 부드럽게 정리한다.
          화면은 src/pages 와 src/features, 스타일은 src/styles 에 있다.
        </p>
      </div>
      <LogoSection />
      <ColorSection />
      <TypeSection />
      <ShapeSection />
      <IconSection />
      <ComponentSection />
      <DockSection />
      <MotionSection />
      <FlowSection />
      <ChangeSection />
    </main>
  );
}
