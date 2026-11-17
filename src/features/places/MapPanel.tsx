import { asset } from '@/shared/lib/assets';
import { cx } from '@/shared/lib/cx';
import { AREA } from '@/shared/sample/data';
import { Icon } from '@/shared/ui/Icon';
import { OutLink } from './OutLink';
import { project } from './project';

/** 지도 핀: 추천 장소는 번호로, 숙소는 아이콘과 이름표로 표시한다. map 은 지도 그림의 이름. */
function Pins({ map, className }: { map: string; className: string }) {
  const h = AREA.hotel;
  const at = project(map, h.lat, h.lon);
  return (
    <>
      {AREA.groups
        .flatMap((g) => g.items)
        .map((p) => (
          <span key={p.no} className={cx('pin', className)} style={project(map, p.lat, p.lon)}>
            {p.no}
          </span>
        ))}
      <span className={cx('pin h', className)} style={at}>
        <Icon name="hotel" size={18} />
      </span>
      <span className={cx('pin-l', className)} style={at}>
        {h.name}
      </span>
    </>
  );
}

/**
 * 숙소 위치. 지도에 숙소와 추천 장소를 같은 번호로 표시한다.
 * 실제 화면의 지도는 Google 지도다. 지금의 지도 그림은 OpenStreetMap 자료로 만들었고 그 사실을 화면에도 적는다.
 */
export function MapPanel() {
  return (
    <section className="pnl clip">
      <div className="pnl-h jb">
        <div className="row g10 wrap">
          <Icon name="location" size={20} />
          <h2 className="t-h3">숙소 위치</h2>
          <span className="t-sm c3">
            {AREA.hotel.name}
            <span className="dt-only">{`, ${AREA.hotel.access}`}</span>
          </span>
        </div>
        <OutLink brand="googlemaps">
          Google 지도<span className="dt-only">에서 열기</span>
        </OutLink>
      </div>
      <div className="pnl-b g12">
        <div className="map">
          <img
            className="dk dt-only"
            src={asset(`map/${AREA.key}.jpg`)}
            width={880}
            height={480}
            alt=""
          />
          <img
            className="mb m-only"
            src={asset(`map/${AREA.key}_m.jpg`)}
            width={560}
            height={480}
            alt=""
          />
          <Pins map={AREA.key} className="dt-only" />
          <Pins map={`${AREA.key}_m`} className="m-only" />
          <div className="map-ctl dt-only" aria-hidden="true">
            <div className="b">
              <Icon name="add" size={16} />
            </div>
            <div className="b ln">
              <Icon name="subtract" size={16} />
            </div>
          </div>
          <span className="map-attr">© OpenStreetMap contributors</span>
        </div>
        <div className="lgd">
          <div className="lg">
            <span className="lg-h">
              <Icon name="hotel" size={12} />
            </span>
            <span>숙소</span>
          </div>
          {AREA.groups.map((g) => (
            <div key={g.key} className="lg">
              <span className="lg-n">{`${g.items[0]?.no}~${g.items.at(-1)?.no}`}</span>
              <span>{g.title}</span>
            </div>
          ))}
        </div>
        <span className="t-xs c3">
          실제 화면에서는 이 자리에 Google 지도가 들어가고, 숙소와 추천 장소가 같은 번호로
          표시됩니다. 시안의 지도 그림은 © OpenStreetMap contributors 자료로 만들었습니다.
        </span>
      </div>
    </section>
  );
}
