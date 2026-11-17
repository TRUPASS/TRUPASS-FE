import type { Term } from './specs';

/** 이름과 설명을 한 줄씩 적은 표 */
export function Terms({ items }: { items: Term[] }) {
  return (
    <div>
      {items.map(([name, desc]) => (
        <div key={name} className="fl">
          <span className="t">{name}</span>
          <span className="c2 grow">{desc}</span>
        </div>
      ))}
    </div>
  );
}
