import { asset } from '@/shared/lib/assets';
import { cx } from '@/shared/lib/cx';
import { ACTS } from '@/shared/sample/data';
import { Icon } from '@/shared/ui/Icon';
import { Tag } from '@/shared/ui/Status';
import { OutLink } from './OutLink';

/** 활동 한 줄: 사진 | 이름 · 요청과 맞는 점 · 설명 · 걸리는 시간 */
function ActRow({ act: a, first }: { act: (typeof ACTS)[number]; first: boolean }) {
  return (
    <div className={cx('pc', first && 'first')}>
      <img className="pc-ph" src={asset(a.photo)} width={112} height={84} alt="" />
      <div className="pc-i">
        <div className="row g8 wrap">
          <span className="t-md w6">{a.t}</span>
          <Tag tone="b">{`요청: ${a.fit}`}</Tag>
        </div>
        <span className="t-sm c2">{a.d}</span>
        <div className="pc-m">
          <span className="i c2">
            <Icon name="time" size={14} />
            <span>{a.time}</span>
          </span>
          <OutLink brand="googlemaps">Google 지도에서 경로 보기</OutLink>
          <OutLink>후기 검색</OutLink>
        </div>
      </div>
    </div>
  );
}

/** 추천 활동. 요청사항의 어느 말과 맞는지를 함께 보여 준다. */
export function ActsPanel() {
  return (
    <section className="pnl clip">
      <div className="pnl-h jb">
        <div className="row g10 wrap">
          <Icon name="pedestrian" size={20} />
          <h2 className="t-h3">{`추천 활동 ${ACTS.length}건`}</h2>
          <span className="t-sm c3">요청사항 기준</span>
        </div>
      </div>
      {ACTS.map((a, i) => (
        <ActRow key={a.t} act={a} first={i === 0} />
      ))}
    </section>
  );
}
