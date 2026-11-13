import { Section } from './Section';
import { SEMANTICS } from './specs';
import { tokenColor, tokenRamp } from './tokens';

/** 색 한 칸: 색 면 아래에 토큰 이름과 색 값을 적는다 */
function Swatch({ name }: { name: string }) {
  const color = tokenColor(name);
  return (
    <div className="sw">
      <div className="c" style={{ background: color }} />
      <div className="g0">
        <span className="t-xs w5">{name}</span>
        <span className="t-xs c3">{color.toUpperCase()}</span>
      </div>
    </div>
  );
}

/** 색 한 벌: 이름과 쓰는 곳 아래에 옅은 색부터 짙은 색까지 늘어놓는다 */
function Ramp({ title, names, desc }: { title: string; names: string[]; desc: string }) {
  return (
    <div className="g8">
      <div className="row g10">
        <span className="t-sm w6">{title}</span>
        <span className="t-xs c3">{desc}</span>
      </div>
      <div className="sw-row">
        {names.map((name) => (
          <Swatch key={name} name={name} />
        ))}
      </div>
    </div>
  );
}

/** 색: 중립 한 벌 · 하늘색 한 벌 · 상태색 세 벌과, 쓰임새 이름이 가리키는 색 */
export function ColorSection() {
  return (
    <Section
      title="색"
      desc="흰색에서 인디고로 이어지는 중립 한 벌(누런 기 없이 인디고 쪽 톤) + 하늘색 한 벌. 상태색은 글자에만 쓴다. 색 값은 전부 tokens.css 의 토큰 블록에 둔다."
    >
      <Ramp title="Neutral" names={tokenRamp('n')} desc="흰색 → 인디고 · 화면의 대부분" />
      <Ramp title="Sky" names={tokenRamp('b')} desc="강조 · 링크 · 선택 상태" />
      <div className="fd-row">
        <Ramp title="Success" names={tokenRamp('g')} desc="완료 · 충족" />
        <Ramp title="Warning" names={tokenRamp('y')} desc="주의 · 변경" />
        <Ramp title="Danger" names={tokenRamp('r')} desc="실패 · 오류" />
      </div>
      <div className="g8">
        <span className="t-sm w6">쓰임새</span>
        <div className="sw-row">
          {SEMANTICS.map(([name, token, use]) => (
            <div key={name} className="sw" style={{ width: 150 }}>
              <div className="c" style={{ background: tokenColor(token) }} />
              <div className="g0">
                <span className="t-xs w5">{name}</span>
                <span className="t-xs c3">{`${token} · ${use}`}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
