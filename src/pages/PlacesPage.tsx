import { useLocation, useSearchParams } from 'react-router';
import { AppFooter } from '@/app/layout/AppFooter';
import { AppHeader } from '@/app/layout/AppHeader';
import { routes } from '@/app/routes';
import { ActsPanel } from '@/features/places/ActsPanel';
import { MapPanel } from '@/features/places/MapPanel';
import { PlacesPanel } from '@/features/places/PlacesPanel';
import { SourcesPanel } from '@/features/places/SourcesPanel';
import { CtaBar } from '@/features/results/CtaBar';
import { SummaryPanel } from '@/features/results/SummaryPanel';
import { useBodyClass } from '@/shared/hooks/useBodyClass';
import { cx } from '@/shared/lib/cx';
import { AREA, REQ, REV_PLACES, V1 } from '@/shared/sample/data';
import { Bottom, Dock } from '@/shared/ui/Dock';
import { PageHead } from '@/shared/ui/PageHead';

/**
 * 숙소 위치와 추천 장소. 검색 결과에서 조합을 고른 다음 화면이다.
 * 숙소 위치 지도, 요청사항에 맞춘 추천 장소(웹 검색으로 찾은 후기 포함), 추천 활동을 보여 준다.
 * 수정 요청 독은 여기서도 아래에 늘 보이고, 여기서 보낸 요청은 장소와 활동만 다시 검색한다.
 * /places?dock=up 은 독이 올라와 문장이 적힌 모습이다. 화면 높이만큼만 보여 준다.
 */
export function PlacesPage() {
  const [params] = useSearchParams();
  // 주소가 같아도 새로 들어오면 독을 처음 모습으로 되돌린다
  const { key } = useLocation();
  const up = params.get('dock') === 'up';
  useBodyClass(cx('has-dock', up && 'vp'));

  return (
    <>
      <title>숙소 위치와 추천 장소 | Trupass</title>
      <AppHeader on="새 검색" />
      <main className="main">
        <div className="cx g24">
          <PageHead
            head="숙소 주변을 살펴보세요"
            current={2}
            sub={`고르신 숙소 ${AREA.hotel.name}을 기준으로 지도와 후기 검색 결과를 정리했습니다.`}
          />
          <div className="two">
            <div className="two-m">
              <MapPanel />
              <PlacesPanel />
              <ActsPanel />
            </div>
            <aside className="two-r stick">
              <SummaryPanel
                sum={V1}
                ver={`v1 ${REQ.at.slice(11)}`}
                cta="이 조합으로 결제"
                to={routes.mandate}
                back="항공권과 숙소 다시 선택"
                backTo={routes.results}
                foot="결제 단계에서 결제 권한의 한도와 허용 항목을 확인합니다. 요금은 결제 직전에 한 번 더 조회합니다."
              />
              <SourcesPanel />
            </aside>
          </div>
        </div>
      </main>
      <AppFooter />
      <Bottom
        dock={
          <Dock
            key={key}
            up={up}
            text={up ? REV_PLACES.text : undefined}
            placeholder="예) 건축물 탐방 장소를 더 넣어 주세요"
            hint="장소와 활동을 바뀐 조건으로 다시 검색합니다. 항공권과 숙소 선택은 그대로 둡니다."
            examples={['건축물 탐방 장소를 더', '저녁 식당은 조용한 곳으로', '비 오는 날 갈 곳']}
            to={routes.places}
          />
        }
        bar={<CtaBar total={V1.total} label="이 조합으로 결제" to={routes.mandate} />}
      />
    </>
  );
}
