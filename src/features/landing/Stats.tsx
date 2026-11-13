import type { CSSProperties } from 'react';
import { STATS } from '@/shared/sample/data';

/** 숫자 구간: 파란 하늘 위 계단식 줄. 숫자는 구간에 들어오면 0 에서 제 값까지 올라간다(scroll.ts). */
export function Stats() {
  return (
    <section className="lp-stats" data-sec="stats">
      <div className="hold">
        <div className="win">
          <div className="lyr bg" />
          <h2 className="st-cap">한 번의 검색이 대신 하는 일</h2>
          <div className="st-rows">
            {STATS.map((s, i) => {
              const pre = s.pre.trim();
              return (
                <div key={s.l} className="st-row" style={{ '--i': i } as CSSProperties}>
                  <div className="st-cell">
                    <span className="st-num num">
                      <span className={pre.length > 1 || /[가-힣]/.test(pre) ? 'u pre' : undefined}>
                        {pre}
                      </span>
                      <span data-count={s.n} data-i={i}>
                        {s.n}
                      </span>
                      <span className="u">{s.u}</span>
                    </span>
                    <div className="st-lb">
                      <span className="l">{s.l}</span>
                      <span className="s">{s.s}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="st-note">도쿄 3박 예시 검색 한 건을 기준으로 한 시안용 값입니다.</p>
        </div>
      </div>
    </section>
  );
}
