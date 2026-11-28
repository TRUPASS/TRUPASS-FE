import { useEffect, useMemo, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { AppFooter } from '@/app/layout/AppFooter';
import { AppHeader } from '@/app/layout/AppHeader';
import { routes } from '@/app/routes';
import { withNotice } from '@/features/search/notice';
import {
  apiErrorText,
  clockText,
  failureText,
  SEARCH_CANCELED_TEXT,
} from '@/features/search/progressText';
import { RequestPanel } from '@/features/search/RequestPanel';
import { searchPaths } from '@/features/search/searchRef';
import { ApiError } from '@/shared/api/client';
import {
  useCombination,
  useSearchProgress,
  useSearchVersion,
  type SearchKey,
} from '@/shared/api/queries/searches';
import { useBodyClass } from '@/shared/hooks/useBodyClass';
import { Bottom } from '@/shared/ui/Dock';
import { PageHead } from '@/shared/ui/PageHead';
import { Note } from '@/shared/ui/Status';
import { CtaBar } from './CtaBar';
import { requestRows, summaryOf } from './searchResult';
import { SummaryPanel } from './SummaryPanel';

const CTA = '추천 장소 보기';
const FOOT = '다음 화면에서 숙소 위치와 맞춤 추천 장소를 확인한 뒤 결제로 넘어갑니다.';

/** 불러오는 중이거나 불러오지 못한 칸 */
function Pending({ error, what }: { error?: unknown; what: string }) {
  if (error !== undefined) {
    return (
      <div role="alert">
        <Note tone="y" icon="warning--alt">
          <div className="g4">
            <span>{apiErrorText(error, `${what}을 불러오지 못했습니다.`)}</span>
            <Link className="lnk w5" to={routes.search}>
              새 검색으로
            </Link>
          </div>
        </Note>
      </div>
    );
  }
  return (
    <section className="pnl" aria-busy="true">
      <div className="pnl-b">
        <span className="t-sm c3" role="status">{`${what}을 불러오고 있습니다.`}</span>
      </div>
    </section>
  );
}

/**
 * 검색 결과 (API). 위쪽 요청 표는 검색 조건(GET …/versions/{n}), 오른쪽 [선택한 조합]과 아래 고정 바는 조합(GET …/combination)으로 채운다.
 * 금액은 서버 값만 쓴다. 항공권 표 · 수정 요청 독 · 검색 기록은 결과 목록 API(B3)가 생길 때까지 숨긴다
 * (예시 데이터와 실제 결과를 한 화면에 섞지 않기 위해서다).
 * 조합이 아직 없으면(COMBINATION404_1) 진행 상태를 보고, 진행 중이면 검색 중 화면으로, 실패 · 취소면 새 검색으로 보낸다.
 */
export function SearchResultScreen({ searchKey }: { searchKey: SearchKey }) {
  const navigate = useNavigate();
  const { searchId, versionNo } = searchKey;
  useBodyClass('has-bar');
  const version = useSearchVersion(searchId, versionNo);
  const combination = useCombination(searchId, versionNo);
  const notReady =
    combination.error instanceof ApiError && combination.error.code === 'COMBINATION404_1';
  const progress = useSearchProgress(searchId, versionNo, { enabled: notReady });

  useEffect(() => {
    const p = progress.data;
    if (!notReady || !p) return;
    const key = { searchId, versionNo };
    if (p.status === 'IN_PROGRESS') {
      void navigate(searchPaths.progress(key), { replace: true });
    } else if (p.status === 'FAILED') {
      void navigate(routes.search, {
        replace: true,
        state: withNotice({ tone: 'fail', text: failureText(p) }),
      });
    } else if (p.status === 'CANCELED') {
      void navigate(routes.search, {
        replace: true,
        state: withNotice({ tone: 'info', text: SEARCH_CANCELED_TEXT }),
      });
    }
  }, [notReady, progress.data, navigate, searchId, versionNo]);

  const v = version.data;
  const c = combination.data;
  const rows = useMemo(() => (v ? requestRows(v) : undefined), [v]);
  const picked = c ? summaryOf(c, v?.adultCount) : undefined;
  const time = clockText(v?.priceCheckedAt ?? v?.completedAt ?? c?.selectedAt);
  const ver = time ? `v${versionNo} ${time}` : `v${versionNo}`;

  // 오른쪽 칸: 조합이 오기 전 · 조합을 받지 못했을 때
  let aside: ReactNode;
  if (c && picked) {
    aside = (
      <SummaryPanel
        sum={picked.sum}
        budget={c.budgetAmount ?? null}
        pax={picked.pax}
        ver={ver}
        cta={CTA}
        to={routes.places}
        foot={FOOT}
      />
    );
  } else if (notReady && progress.data?.status === 'COMPLETED') {
    aside = (
      <div role="alert">
        <Note tone="y" icon="warning--alt">
          <div className="g4">
            <span>조건에 맞는 조합을 찾지 못했습니다. 문장을 고쳐 다시 검색해 주세요.</span>
            <Link className="lnk w5" to={routes.search}>
              새 검색으로
            </Link>
          </div>
        </Note>
      </div>
    );
  } else if (notReady) {
    aside = <Pending error={progress.isError ? progress.error : undefined} what="선택한 조합" />;
  } else {
    aside = (
      <Pending error={combination.isError ? combination.error : undefined} what="선택한 조합" />
    );
  }

  return (
    <>
      <title>검색 결과 | Trupass</title>
      <AppHeader on="새 검색" />
      <main className="main">
        <div className="cx g24">
          <PageHead head="항공권과 숙소 조합을 찾았습니다" current={1} />
          <div className="two">
            <div className="two-m">
              {rows ? (
                <RequestPanel data={rows} />
              ) : (
                <Pending error={version.isError ? version.error : undefined} what="검색 조건" />
              )}
              <Note>항공권 · 숙소 비교 목록은 준비 중입니다</Note>
            </div>
            <aside className="two-r stick">{aside}</aside>
          </div>
        </div>
      </main>
      <AppFooter />
      {c && picked && (
        <Bottom
          dock={null}
          bar={<CtaBar total={c.totalAmount} pax={picked.pax} label={CTA} to={routes.places} />}
        />
      )}
    </>
  );
}
