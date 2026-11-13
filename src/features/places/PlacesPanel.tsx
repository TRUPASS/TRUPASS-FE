import { Fragment } from 'react';
import { asset } from '@/shared/lib/assets';
import { cx } from '@/shared/lib/cx';
import { AREA, type Place, type Review } from '@/shared/sample/data';
import { BrandMark } from '@/shared/ui/BrandMark';
import { brandName } from '@/shared/ui/brandName';
import { Icon } from '@/shared/ui/Icon';
import { Tag } from '@/shared/ui/Status';
import { OutLink } from './OutLink';

/** 웹 검색으로 찾은 후기 한 건: 썸네일 + 제목 + 사이트(마크와 이름) */
function ReviewRow({ review: r }: { review: Review }) {
  return (
    <div className="rv">
      <img className="rv-ph" src={asset(r.photo)} width={48} height={36} alt="" />
      <div className="g2 grow">
        <span className="t-sm">{r.t}</span>
        <span className="src">
          <BrandMark name={r.s} size={14} />
          <span>{brandName(r.s)}</span>
        </span>
      </div>
    </div>
  );
}

/** 장소 한 곳의 후기 묶음. 후기가 없으면 없다고 적는다. */
function Reviews({ list }: { list: Review[] }) {
  return (
    <div className="pc-rv">
      {list.length ? (
        <>
          <span className="t-xs c3">{`웹 검색으로 찾은 후기 ${list.length}건`}</span>
          {list.map((r) => (
            <ReviewRow key={r.photo} review={r} />
          ))}
        </>
      ) : (
        <>
          <span className="t-xs c3">웹 검색으로 찾은 후기</span>
          <span className="t-sm c3">아직 검색된 후기가 없습니다.</span>
        </>
      )}
    </div>
  );
}

/** 장소 한 줄: 사진 | 번호 · 이름 · 요청과 맞는 점 · 거리 · 평점 | 후기 */
function PlaceRow({ place: p }: { place: Place }) {
  return (
    <div className="pc">
      <img className="pc-ph" src={asset(p.photo)} width={112} height={84} alt="" />
      <div className="pc-i">
        <div className="row g8 wrap">
          <span className="pno">{p.no}</span>
          <span className="t-md w6">{p.name}</span>
          {p.fit && <Tag tone="b">{`요청: ${p.fit}`}</Tag>}
        </div>
        <span className="t-sm c2">{p.kind}</span>
        <span className="t-sm c2">{p.why}</span>
        <div className="pc-m">
          <span className="i c2">
            <Icon name="pedestrian" size={14} />
            <span>{`${p.walk} (${p.dist})`}</span>
          </span>
          {p.rate && (
            <span className="i">
              <Icon name="star--filled" size={14} className="star" />
              <span className="num">
                <b>{p.rate}</b> <span className="c3">{`(${p.cnt})`}</span>
              </span>
            </span>
          )}
          <OutLink brand={p.site}>{brandName(p.site)}</OutLink>
        </div>
      </div>
      <Reviews list={p.rv} />
    </div>
  );
}

/**
 * 맞춤 추천 장소. 요청사항에 맞춘 장소 · 많이 찾는 명소 · 주변 음식점을 지도와 같은 번호로 보여 준다.
 * 장소마다 웹 검색으로 찾은 후기를 썸네일과 함께 싣고 후기 사이트의 이름과 마크를 붙인다.
 */
export function PlacesPanel() {
  return (
    <section className="pnl clip">
      <div className="pnl-h jb">
        <div className="row g10 wrap">
          <Icon name="map" size={20} />
          <h2 className="t-h3">맞춤 추천 장소 9곳</h2>
          <span className="t-sm c3">요청사항과 숙소 위치 기준</span>
        </div>
        <span className="t-xs c3 dt-only fn num">{`검색 ${AREA.at}`}</span>
      </div>
      {AREA.groups.map((g, gi) => (
        <Fragment key={g.key}>
          <div className={cx('grp-h', gi === 0 && 'first')}>
            <h3 className="t-sm w6">{g.title}</h3>
            <span className="t-xs c3">{g.sub}</span>
          </div>
          {g.items.map((p) => (
            <PlaceRow key={p.no} place={p} />
          ))}
        </Fragment>
      ))}
      <div className="pn-n">
        <span className="t-xs c3">
          평점과 후기 수, 후기 제목은 시안용 예시 값입니다. 장소 사진과 후기 썸네일은 Wikimedia
          Commons 자료입니다(라이선스는 각 사진 원문 참고).
        </span>
      </div>
    </section>
  );
}
