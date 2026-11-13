import type { ComponentProps, ReactNode } from 'react';
import { AppFooter } from '@/app/layout/AppFooter';
import { AppHeader } from '@/app/layout/AppHeader';
import { routes } from '@/app/routes';
import { RequestPanel, type CondChange } from '@/features/search/RequestPanel';
import { useBodyClass } from '@/shared/hooks/useBodyClass';
import { cx } from '@/shared/lib/cx';
import type { Combo } from '@/shared/sample/data';
import { Bottom, Dock } from '@/shared/ui/Dock';
import { PageHead } from '@/shared/ui/PageHead';
import { useChoice } from './choice';
import { CtaBar } from './CtaBar';
import { HistoryPanel, type SearchVersion } from './HistoryPanel';
import { OptionTable } from './OptionTable';
import { SummaryPanel } from './SummaryPanel';

type DockProps = ComponentProps<typeof Dock>;

const DOCK: DockProps = {
  placeholder: '예) 숙소를 우에노역에서 더 가까운 곳으로 바꿔 주세요',
  hint: '항공권 · 숙소 · 장소를 바뀐 조건으로 다시 검색합니다.',
  examples: ['숙소를 더 저렴한 곳으로', '오후 출발 항공권도 포함', '조식 포함 숙소만'],
  to: `${routes.results}?rev=2`,
};

interface ResultScreenProps {
  head: string;
  /** 처음에 골라 둔 조합. 항공권마다의 숙소 목록도 여기서 온다 */
  start: Combo;
  /** 검색 결과의 판과 시각 (v1 14:02) */
  ver: string;
  /** 요청 표 위에 놓는 안내 */
  top?: ReactNode;
  /** 수정 요청으로 바뀐 조건 */
  change?: CondChange;
  /** 다시 검색한 결과: 바뀐 숙소에 표식을 단다 */
  changed?: boolean;
  /** 고른 항공권의 숙소를 처음부터 펼쳐 둔다 */
  open?: boolean;
  /** 검색 기록 (다시 검색한 뒤에 보인다) */
  history?: SearchVersion[];
  /** 수정 요청 독에서 바꿀 것 */
  dock?: Partial<DockProps>;
  /** 화면 높이만큼만 보여 준다 */
  vp?: boolean;
}

/**
 * 검색 결과 화면. 맨 위에 적은 문장과 적용한 조건을 짝지어 보여 주고, 그 아래 항공권 표에서 항공권과 숙소를 고른다.
 * 고르면 오른쪽 [선택한 조합]과 아래 고정 바의 합계가 바로 바뀐다. 수정 요청 독은 화면 아래에 늘 붙어 있다.
 */
export function ResultScreen({
  head,
  start,
  ver,
  top,
  change,
  changed,
  open = false,
  history,
  dock,
  vp,
}: ResultScreenProps) {
  useBodyClass(cx('has-dock', vp && 'vp'));
  const ctl = useChoice(start, open);

  return (
    <>
      <title>검색 결과 | Trupass</title>
      <AppHeader on="새 검색" />
      <main className="main">
        <div className="cx g24">
          <PageHead head={head} current={1} />
          <div className="two">
            <div className="two-m">
              {top}
              <RequestPanel change={change} />
              <OptionTable map={start.map} changed={changed} ctl={ctl} />
            </div>
            <aside className="two-r stick">
              <SummaryPanel
                sum={ctl.sum}
                say={ctl.say}
                ver={ver}
                cta="추천 장소 보기"
                to={routes.places}
                foot="다음 화면에서 숙소 위치와 맞춤 추천 장소를 확인한 뒤 결제로 넘어갑니다."
              />
              {history && <HistoryPanel versions={history} />}
            </aside>
          </div>
        </div>
      </main>
      <AppFooter />
      <Bottom
        dock={<Dock {...DOCK} {...dock} />}
        bar={<CtaBar total={ctl.sum.total} label="추천 장소 보기" to={routes.places} />}
      />
    </>
  );
}
