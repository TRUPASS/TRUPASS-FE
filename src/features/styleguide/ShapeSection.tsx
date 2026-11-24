import { Section } from './Section';

// 모서리 반지름과 쓰는 곳. 999 는 알약형을 뜻한다.
const RADII: [radius: number, use: string][] = [
  [4, '체크 · 표식'],
  [8, '입력'],
  [12, '카드'],
  [16, '창'],
  [999, '버튼 · 검색창 · 칩'],
];
const SPACES = [4, 8, 12, 16, 24, 32, 48, 72];

/** 모서리 · 간격 · 그림자: 반지름 다섯 가지, 4의 배수 간격, 그림자 두 단계 */
export function ShapeSection() {
  return (
    <Section
      title="모서리 · 간격 · 그림자"
      desc="간격은 4의 배수. 사진을 담는 창은 좌우 · 위로 화면에 꽉 붙이고, 아래만 16(태블릿 12 · 모바일 8) 띄운다."
    >
      <div className="fd-row">
        <div className="fd-col">
          <span className="t-sm w6">모서리</span>
          <div className="spec">
            {RADII.map(([radius, use]) => (
              <div key={radius} className="g4">
                {/* 보기 상자의 모서리는 24 까지만 둥글린다 (알약형도 24 로 그린다) */}
                <div className="rd" style={{ borderRadius: Math.min(radius, 24) }}>
                  {radius === 999 ? '알약' : radius}
                </div>
                <span className="t-xs c3">{use}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="fd-col">
          <span className="t-sm w6">간격</span>
          <div className="g6">
            {SPACES.map((n) => (
              <div key={n} className="spc">
                <span className="t-xs c3 num">{n}</span>
                <i style={{ width: n * 3 }} />
              </div>
            ))}
          </div>
        </div>
        <div className="fd-col">
          <span className="t-sm w6">그림자</span>
          <div className="spec">
            <div className="g4">
              <div className="rd sh-1">e1</div>
              <span className="t-xs c2">카드 · 지도 핀</span>
            </div>
            <div className="g4">
              <div className="rd sh-2">e2</div>
              <span className="t-xs c2">떠 있는 입력 상자</span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
