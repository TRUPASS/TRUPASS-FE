import type { CSSProperties } from 'react';
import { asset } from '@/shared/lib/assets';
import { formatKrw } from '@/shared/lib/format';
import type { FlightId, Stay } from '@/shared/sample/data';
import { BrandSource } from '@/shared/ui/BrandMark';
import { Tag } from '@/shared/ui/Status';

interface StayCardProps {
  stay: Stay;
  /** 떠오르는 순서 */
  index: number;
  /** 이 숙소가 딸린 항공권. 숙소는 항공권마다 한 묶음으로 고른다 */
  flightId: FlightId;
  checked: boolean;
  /** 다시 검색해서 새로 들어온 숙소 */
  isNew?: boolean;
  onPick: () => void;
}

/**
 * 숙소 한 곳 (항공권 줄을 펼친 자리에 3곳). 상자 없이 사진과 글만 놓고, 고른 곳은 사진에 테두리를 두른다.
 * 표식(추천 · 새로 찾음)은 사진 위에 올려, 세 곳의 이름과 설명이 같은 높이에서 시작하게 한다.
 */
export function StayCard({ stay, index, flightId, checked, isNew, onPick }: StayCardProps) {
  return (
    <label className="sc rise" style={{ '--i': index } as CSSProperties}>
      <input
        className="vh"
        type="radio"
        name={`stay-${flightId}`}
        value={stay.id}
        checked={checked}
        onChange={onPick}
      />
      <span className="sc-ph">
        <img src={asset(stay.photo)} width={400} height={300} alt="" />
        {(stay.tag || isNew) && (
          <span className="sc-tg">
            {stay.tag && <Tag tone="b">{stay.tag}</Tag>}
            {isNew && <Tag tone="y">새로 찾음</Tag>}
          </span>
        )}
      </span>
      <span className="sc-b">
        <span className="sc-n">
          <span className="rad" />
          <span className="t-md w6">{stay.name}</span>
        </span>
        <span className="t-sm c2">{`${stay.grade}, ${stay.area}`}</span>
        <span className="t-sm c2">{`${stay.room}, ${stay.meal}`}</span>
        <span className="t-xs c3">{stay.cancel}</span>
        <span className="sc-f">
          <span className="t-h3 num">{formatKrw(stay.price)}</span>
          <BrandSource name={stay.src} />
        </span>
      </span>
    </label>
  );
}
