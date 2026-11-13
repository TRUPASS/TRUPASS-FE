import { Link } from 'react-router';
import { cx } from '@/shared/lib/cx';

export interface SearchVersion {
  /** 판 (v1, v2 …) */
  v: string;
  /** 검색한 시각 */
  at: string;
  /** 그때 요청한 내용 */
  text: string;
  /** 그 결과를 다시 보는 주소. 없으면 지금 보고 있는 결과다 */
  to?: string;
}

/** 오른쪽: 검색 기록. 수정 요청으로 다시 검색한 뒤에 보인다. */
export function HistoryPanel({ versions }: { versions: SearchVersion[] }) {
  return (
    <section className="pnl">
      <div className="pnl-h">
        <h2 className="t-h3">검색 기록</h2>
      </div>
      <div className="pnl-b">
        <div>
          {versions.map(({ v, at, text, to }, i) => (
            <div key={v} className={cx('ver', i === 0 && 'first')}>
              <span className={cx('v', to ? 'c3' : 'cb')}>{v}</span>
              <div className="g2 grow">
                <span className={to ? 'c2' : 'w5'}>{text}</span>
                <span className="t-xs c3 num">{at}</span>
              </div>
              {to ? (
                <Link className="t-xs lnk w5 fn" to={to}>
                  보기
                </Link>
              ) : (
                <span className="t-xs c3 fn">현재</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
