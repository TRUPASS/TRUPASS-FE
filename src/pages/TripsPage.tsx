import { AppFooter } from '@/app/layout/AppFooter';
import { AppHeader } from '@/app/layout/AppHeader';
import { routes } from '@/app/routes';
import { PaySummary } from '@/features/pay/PaySummary';
import { PastTrips } from '@/features/trips/PastTrips';
import { TripDocs } from '@/features/trips/TripDocs';
import { TripPanel } from '@/features/trips/TripPanel';
import { Button } from '@/shared/ui/Button';

/**
 * 내 여행. 결제를 마친 여행의 일정과 문서를 모아 보는 화면이다.
 * 결제 완료의 [내 여행에서 일정 보기]나 상단 메뉴의 [내 여행]을 누르면 온다.
 * 다가오는 여행의 일정을 날짜별로 보여 주고, 영수증과 확정서는 문서함에 모은다.
 */
export function TripsPage() {
  return (
    <>
      <title>내 여행 | Trupass</title>
      <AppHeader on="내 여행" />
      <main className="main">
        <div className="cx g24">
          <div className="g10">
            <div className="pt">
              <h1 className="t-h1">내 여행</h1>
              <span className="t-sm c3 fn">다가오는 여행 1건</span>
            </div>
            <p className="t-md c2 mw720">예약한 여행의 일정과 문서를 한곳에서 확인합니다.</p>
          </div>
          <div className="two">
            <div className="two-m">
              <TripPanel />
              <TripDocs />
              <PastTrips />
            </div>
            <aside className="two-r">
              <PaySummary />
              <div className="g8">
                <Button kind="pri" size="lg" className="fill" to={routes.search}>
                  새 검색
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
