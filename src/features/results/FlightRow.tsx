import type { CSSProperties } from 'react';
import { cx } from '@/shared/lib/cx';
import { formatKrw } from '@/shared/lib/format';
import {
  BAG,
  MEAL,
  NEW_IN_V2,
  period,
  type Flight,
  type Leg,
  type Stay,
} from '@/shared/sample/data';
import { AirlineLogo, BrandSource } from '@/shared/ui/BrandMark';
import { Icon } from '@/shared/ui/Icon';
import { Tag } from '@/shared/ui/Status';
import { AddOn } from './AddOn';
import { noMeal, type ChoiceControl } from './choice';
import { StayCard } from './StayCard';

/** 한 구간: 날짜와 편명, 그 아래 출발 시각 ─ 소요 시간 ─ 도착 시각 */
function LegTimes({ title, leg }: { title: string; leg: Leg }) {
  return (
    <div className="lg2">
      <span className="lg2-k">
        <span className="tm-only c3">{title}</span>
        <span className="num">{leg.d}</span>
        <span className="c3">{leg.no}</span>
      </span>
      <div className="lg2-t">
        <div className="e">
          <b className="num">{leg.dep}</b>
          <span>{leg.fc}</span>
        </div>
        <div className="m">
          <i />
          <span className="t-xs c3 nw">{leg.dur}</span>
          <i />
        </div>
        <div className="e">
          <b className="num">{leg.arr}</b>
          <span>{leg.tc}</span>
        </div>
      </div>
    </div>
  );
}

interface FlightRowProps {
  flight: Flight;
  /** 떠오르는 순서 */
  index: number;
  /** 이 항공권의 일정에 예약할 수 있는 숙소 */
  stays: Stay[];
  /** 다시 검색한 결과: 숙소가 바뀌었다는 표식을 단다 */
  changed?: boolean;
  ctl: ChoiceControl;
}

/**
 * 항공권 한 줄: 고르기 + 항공사(로고 · 이름) + 가는 편 · 오는 편 + 요금, 그 아래 요청과 맞는 점과 숙소 펼치기.
 * 펼친 자리에서 숙소와 추가 선택(수하물 · 조식)을 고른다.
 */
export function FlightRow({ flight: f, index, stays, changed, ctl }: FlightRowProps) {
  const { choice } = ctl;
  const on = f.id === choice.f;
  const picked = on ? stays.find((h) => h.id === choice.h) : undefined;
  const min = Math.min(...stays.map((h) => h.price));
  const pick = () => ctl.pickFlight(f.id);

  return (
    <article className={cx('fo rise', on && 'on')} style={{ '--i': index } as CSSProperties}>
      <div
        className="fo-r"
        // 줄의 빈 자리를 눌러도 그 항공권을 고른다 (라디오 이름표를 누른 경우는 라디오가 처리한다)
        onClick={(e) => {
          if (!(e.target instanceof Element && e.target.closest('label'))) pick();
        }}
      >
        <label className="fo-k">
          <input
            className="vh"
            type="radio"
            name="flight"
            value={f.id}
            checked={on}
            onChange={pick}
            // 이미 고른 항공권을 다시 눌러도 숙소를 펼친다
            onClick={pick}
          />
          <span className="rad" />
          <span className="vh">{`${f.air} ${f.out.no} 선택`}</span>
        </label>
        <div className="fo-a">
          <AirlineLogo name={f.logo} />
          <div className="row g8">
            <span className="t-h3">{f.air}</span>
            {f.tag && <Tag tone="b">{f.tag}</Tag>}
          </div>
          <span className="t-xs c3">{`${f.cls}, ${f.bag}`}</span>
        </div>
        <div className="fo-l">
          <LegTimes title="가는 편" leg={f.out} />
          <LegTimes title="오는 편" leg={f.back} />
        </div>
        <div className="fo-p">
          <span className="t-h2 num">{formatKrw(f.price)}</span>
          <BrandSource name={f.src} />
        </div>
      </div>
      <details
        className="fo-s"
        open={ctl.open.includes(f.id)}
        onToggle={(e) => ctl.setOpen(f.id, e.currentTarget.open)}
      >
        <summary className="fo-tg">
          <span className="fo-fit">
            <Icon name="checkmark" size={14} className="cok" />
            <span className="t-sm c2">{f.fit}</span>
          </span>
          <span className="fo-st">
            <Icon name="hotel" size={16} className="c3" />
            <span className="t-sm w5">
              {picked ? `고른 숙소 ${picked.name}` : `추천 숙소 3곳, ${formatKrw(min)}부터`}
            </span>
            {changed && <Tag tone="y fo-ch">변경</Tag>}
            <span className="fo-tb">
              <span className="tg-c">보기</span>
              <span className="tg-o">접기</span>
              <Icon name="chevron--down" size={16} />
            </span>
          </span>
        </summary>
        <div className="fo-w">
          <p className="t-xs c3 num">{`${period(f)}, 3박, 2인 1실 기준`}</p>
          <div className="stays">
            {stays.map((h, k) => (
              <StayCard
                key={h.id}
                stay={h}
                index={k}
                flightId={f.id}
                checked={on && h.id === choice.h}
                isNew={changed && NEW_IN_V2.includes(h.id)}
                onPick={() => ctl.pickStay(f.id, h.id)}
              />
            ))}
          </div>
          <div className="ax" role="group" aria-label="추가 선택">
            <span className="ax-l t-xs c3">추가 선택</span>
            <div className="g6 grow">
              <AddOn
                item={BAG}
                checked={on && choice.bag}
                disabled={!on}
                onChange={(v) => ctl.setAddOn(f.id, 'bag', v)}
              />
              <AddOn
                item={MEAL}
                checked={on && choice.meal}
                disabled={!on}
                hidden={!(picked && noMeal(picked))}
                onChange={(v) => ctl.setAddOn(f.id, 'meal', v)}
              />
            </div>
          </div>
        </div>
      </details>
    </article>
  );
}
