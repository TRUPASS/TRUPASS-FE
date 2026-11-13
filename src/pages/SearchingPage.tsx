import { Fragment, useLayoutEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { routes } from '@/app/routes';
import { Globe } from '@/features/search/Globe';
import type { GlobeStage } from '@/features/search/globe';
import { useBodyClass } from '@/shared/hooks/useBodyClass';
import { reduceMotion, still } from '@/shared/lib/capture';
import { APPLIED, FLIGHTS, PROMPTS, ROUTE } from '@/shared/sample/data';
import { brandName } from '@/shared/ui/brandName';
import { Icon } from '@/shared/ui/Icon';
import { Logo } from '@/shared/ui/Logo';
import { PromptText } from '@/shared/ui/PromptText';

const STEPS = [
  ['문장 해석', 'parse'],
  ['항공편 검색', 'flight'],
  ['숙소 검색', 'stay'],
  ['결과 정리', 'done'],
] as const;

// 지금 단계의 문구 하나만 보이고 읽힌다. 나머지는 숨겨 둔다(스크린리더에도 읽히지 않는다).
const TEXT: Record<GlobeStage, [title: string, desc: string]> = {
  flight: [
    '적절한 항공편을 검색 중입니다',
    `${ROUTE.from.name}에서 ${ROUTE.to.name}으로 가는 ${APPLIED.flight[1]?.[1]} 출발편을 ${brandName('tripdotcom')}과 ${brandName('expedia')}에서 조회하고 있습니다.`,
  ],
  stay: [
    '숙소를 검색 중입니다',
    `찾은 항공권 ${FLIGHTS.length}건의 일정마다 ${ROUTE.to.city} 우에노 일대에서 예약할 수 있는 숙소를 찾고 있습니다.`,
  ],
  done: ['결과를 정리했습니다', '요청에 가까운 순서로 정리해 보여 드립니다.'],
};

/**
 * 검색 중. 화면 가운데 지구본 위에서 검색이 진행되는 모습을 보여 준다.
 * - 항공: 출발 국가(남색)에서 도착 국가(하늘색)로 비행기가 호를 그리며 난다.
 * - 숙소: 도착 국가를 가까이 당기고 그 영토 위에 호텔 건물이 층층이 올라가기를 반복한다.
 * 끝나면 검색 결과로 넘어간다. 주소에 `?stage=stay` 를 붙이면 숙소 장면에 멈춘 모습을 본다.
 */
export function SearchingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // 한 장면에 멈춘 화면: 숙소 장면을 따로 보거나, 정지 화면 캡처일 때
  const freeze = params.get('stage') === 'stay' ? 'stay' : still ? 'flight' : '';
  const [stage, setStage] = useState<GlobeStage>(freeze || 'flight');

  useBodyClass('pg-srch');
  // 장면에 따라 문구와 단계 표시가 바뀐다 (styles 의 body[data-stage] 규칙)
  useLayoutEffect(() => {
    document.body.dataset.stage = stage;
    return () => {
      delete document.body.dataset.stage;
    };
  }, [stage]);

  return (
    <>
      <title>검색 중 | Trupass</title>
      <header className="srch-top">
        <Logo to={routes.search} />
        <Link className="btn txt n sm" to={routes.search}>
          검색 취소
        </Link>
      </header>
      <main className="srch">
        <div className="globe">
          <Globe
            route={ROUTE}
            freeze={freeze}
            calm={reduceMotion() && !freeze}
            onStage={setStage}
            onDone={() => void navigate(routes.results)}
          />
        </div>
        <div className="srch-lg">
          <span className="lg-c">
            <i className="from" />
            {`${ROUTE.from.name} 출발`}
          </span>
          <span className="lg-c">
            <i className="to" />
            {`${ROUTE.to.name} 도착`}
          </span>
        </div>
        {/* 장면이 바뀌면 그 문구를 스크린리더에 알린다 */}
        <p className="vh" role="status">
          {TEXT[stage][0]}
        </p>
        <div className="srch-tx">
          {(Object.keys(TEXT) as GlobeStage[]).map((k) => (
            <div key={k} className="srch-t" data-st={k}>
              <h1 className="srch-h">
                {TEXT[k][0]}
                <span className="dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </h1>
              <p className="t-md c2">{TEXT[k][1]}</p>
            </div>
          ))}
        </div>
        <ol className="srch-sp" aria-label="검색 단계">
          {STEPS.map(([label, k], i) => (
            <Fragment key={k}>
              {i > 0 && <li className="ln" aria-hidden="true" />}
              <li className="sp" data-sp={k}>
                <Icon name="checkmark" size={12} />
                <b>{label}</b>
              </li>
            </Fragment>
          ))}
        </ol>
        <div className="srch-rc">
          {PROMPTS.map((p) => (
            <span key={p.k} className="q">
              <Icon name={p.icon} size={16} />
              <PromptText k={p.k}>{p.v}</PromptText>
            </span>
          ))}
        </div>
        <Link className="t-sm lnk" to={routes.results}>
          결과로 바로 가기
        </Link>
      </main>
    </>
  );
}
