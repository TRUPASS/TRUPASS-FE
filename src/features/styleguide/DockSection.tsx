import { REV } from '@/shared/sample/data';
import { Dock } from '@/shared/ui/Dock';
import { Section } from './Section';
import { DOCK_RULES } from './specs';
import { Terms } from './Terms';

const PLACEHOLDER = '예) 숙소를 우에노역에서 더 가까운 곳으로 바꿔 주세요';
const EXAMPLES = ['숙소를 더 저렴한 곳으로', '오후 출발 항공권도 포함', '조식 포함 숙소만'];

/** 수정 요청 독: 내림 · 올림 두 모습과 움직임 규칙 */
export function DockSection() {
  return (
    <Section title="수정 요청 독" desc="결과 화면(07 · 08 · 09) 아래에 늘 붙어 있는 문장 입력 창">
      <div className="fd-row">
        <div className="fd-col">
          <span className="t-sm w6">내림 · 기본</span>
          <div className="dock-demo">
            <Dock placeholder={PLACEHOLDER} />
          </div>
          <span className="t-sm w6">올림 · 마우스를 올렸거나 입력 중</span>
          <div className="dock-demo">
            <Dock
              up
              text={REV.text}
              placeholder={PLACEHOLDER}
              hint="항공권 · 숙소 · 장소를 바뀐 조건으로 다시 검색합니다."
              examples={EXAMPLES}
            />
          </div>
        </div>
        <div className="fd-col">
          <span className="t-sm w6">움직임 규칙</span>
          <Terms items={DOCK_RULES} />
        </div>
      </div>
    </Section>
  );
}
