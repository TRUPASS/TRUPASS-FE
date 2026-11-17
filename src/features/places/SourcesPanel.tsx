import { AREA, PLACE_SRC } from '@/shared/sample/data';
import { BrandMark } from '@/shared/ui/BrandMark';
import { brandName } from '@/shared/ui/brandName';
import { Kv } from '@/shared/ui/Status';

/** 오른쪽: 검색 출처. 지도 · 후기 · 활동을 어디서 몇 건 찾았는지 적는다. */
export function SourcesPanel() {
  return (
    <section className="pnl">
      <div className="pnl-h jb">
        <h2 className="t-h3">검색 출처</h2>
        <span className="t-xs c3 num">{AREA.at}</span>
      </div>
      <div className="pnl-b pnl-kv">
        <div>
          {PLACE_SRC.map(([use, brands, count], i) => (
            <Kv key={use} k={use} line={i > 0}>
              <div className="g4">
                {brands.map((b) => (
                  <span key={b} className="src">
                    <BrandMark name={b} size={14} />
                    <span className="nm">{brandName(b)}</span>
                  </span>
                ))}
                <span className="t-sm c2">{count}</span>
              </div>
            </Kv>
          ))}
        </div>
      </div>
    </section>
  );
}
