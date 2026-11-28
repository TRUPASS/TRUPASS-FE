import { Fragment, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import { ApiError } from '@/shared/api/client';
import {
  useCancelSearch,
  useSearchProgress,
  type SearchKey,
  type SearchProgress,
  type SearchProgressStep,
} from '@/shared/api/queries/searches';
import { useBodyClass } from '@/shared/hooks/useBodyClass';
import { reduceMotion, still } from '@/shared/lib/capture';
import type { PromptKey } from '@/shared/lib/prompts';
import { PROMPTS } from '@/shared/sample/data';
import { Icon } from '@/shared/ui/Icon';
import { Logo } from '@/shared/ui/Logo';
import { Note } from '@/shared/ui/Status';
import { globePlace } from './countries';
import type { LiveScene, LiveTarget } from './globe';
import { withNotice } from './notice';
import {
  apiErrorText,
  failureText,
  providerText,
  SEARCH_CANCELED_TEXT,
  tripFacts,
  withRo,
} from './progressText';
import { LiveSearchGlobe } from './SearchGlobe';
import { searchPaths } from './searchRef';

/** 화면의 단계 (body[data-stage] 와 단계 표시의 data-sp) */
type Stage = 'parse' | 'flight' | 'stay' | 'done';

const STEPS: [label: string, stage: Stage][] = [
  ['문장 해석', 'parse'],
  ['항공편 검색', 'flight'],
  ['숙소 검색', 'stay'],
  ['결과 정리', 'done'],
];
const STAGE: Record<SearchProgressStep, Stage> = {
  PARSING: 'parse',
  FLIGHT: 'flight',
  STAY: 'stay',
  SUMMARY: 'done',
};
// 지구본 장면: 문장 해석 중에는 나라를 모르니 기본 상태, 결과 정리 중에는 숙소 장면을 이어 간다
const SCENE: Record<Stage, LiveScene> = {
  parse: 'idle',
  flight: 'flight',
  stay: 'stay',
  done: 'stay',
};

/** 이만큼 지나도 진행 중이면 오래 걸린다고 알리고 취소 버튼을 보인다 */
export const SLOW_MS = 3 * 60 * 1000;

/** 서버가 검색을 시작한 시각(startedAt)부터 세어 SLOW_MS 가 지났는가. 시각을 읽지 못하면 화면을 연 때부터 센다 */
function useSlow(startedAt: string | undefined, running: boolean): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!running || !startedAt) return;
    const begun = Date.parse(startedAt);
    const wait = Number.isFinite(begun) ? begun + SLOW_MS - Date.now() : SLOW_MS;
    const id = window.setTimeout(() => setSlow(true), Math.max(0, wait));
    return () => window.clearTimeout(id);
  }, [startedAt, running]);
  return running && slow;
}

/** 끝난 상태면 갈 곳: 완료는 결과, 실패 · 취소는 새 검색(안내와 함께). 진행 중이면 null */
function exitFor(p: SearchProgress, key: SearchKey): { to: string; state?: unknown } | null {
  switch (p.status) {
    case 'COMPLETED':
      return { to: searchPaths.results(key) };
    case 'FAILED':
      return { to: routes.search, state: withNotice({ tone: 'fail', text: failureText(p) }) };
    case 'CANCELED':
      return { to: routes.search, state: withNotice({ tone: 'info', text: SEARCH_CANCELED_TEXT }) };
    default:
      return null;
  }
}

const SENTENCE: Record<PromptKey, (p: SearchProgress) => string> = {
  flight: (p) => p.flightSentence,
  stay: (p) => p.staySentence,
  exp: (p) => p.experienceSentence,
};

/** 단계마다의 제목과 설명. 진행 상태에서 아는 값만 넣는다 */
function stageTexts(p: SearchProgress | undefined): Record<Stage, [title: string, desc: string]> {
  const city = p?.destinationCity || p?.destinationCountry || '';
  const origin = p?.originCountry || '';
  const providers = providerText(p?.providerNames);
  const at = providers ? `${providers}에서 ` : '';
  const count = p?.flightOfferCount;
  const route = city ? `${origin ? `${origin}에서 ` : ''}${withRo(city)} 가는 ` : '';
  return {
    parse: [
      '문장을 해석하고 있습니다',
      '적어 주신 문장에서 도시 · 날짜 · 인원 · 예산을 찾고 있습니다.',
    ],
    flight: ['적절한 항공편을 검색 중입니다', `${route}항공편을 ${at}조회하고 있습니다.`],
    stay: [
      '숙소를 검색 중입니다',
      `${count != null ? `항공권 ${count}건을 찾았고, ` : ''}${city ? `${city}에서 ` : ''}머물 숙소를 ${at}찾고 있습니다.`,
    ],
    done: [
      '결과를 정리하고 있습니다',
      `${count != null ? `찾은 항공권 ${count}건과 숙소로` : '찾은 항공권과 숙소로'} 요청에 가까운 조합을 고르고 있습니다.`,
    ],
  };
}

/**
 * 검색 중 (API). 진행 상태(GET …/progress)를 1.5초마다 받아 그린다.
 * - 단계: 지금 단계보다 앞선 단계는 모두 끝난 것으로 그린다. 폴링 사이에 단계를 건너뛰어도(FLIGHT → SUMMARY) 그대로 맞는다.
 * - 지구본: 나라 코드(alpha-2)를 숫자 코드로 바꿔 칠한다. 문장 해석 전(나라를 모름)에는 기본 상태로 둔다.
 * - COMPLETED 면 결과로, FAILED · CANCELED 면 새 검색으로 간다. 3분이 넘도록 진행 중이면 안내와 취소 버튼을 보인다.
 */
export function SearchProgressScreen({ searchKey }: { searchKey: SearchKey }) {
  const navigate = useNavigate();
  const { searchId, versionNo } = searchKey;
  const progress = useSearchProgress(searchId, versionNo);
  const cancel = useCancelSearch();
  const [cancelError, setCancelError] = useState('');
  const data = progress.data;
  const running = data?.status === 'IN_PROGRESS';
  const slow = useSlow(data?.startedAt, running);
  const stage = STAGE[data?.progressStep ?? 'PARSING'];
  const calm = reduceMotion() || still;

  useBodyClass('pg-srch');
  // 단계에 따라 문구와 단계 표시가 바뀐다 (styles 의 body[data-stage] 규칙)
  useLayoutEffect(() => {
    document.body.dataset.stage = stage;
    return () => {
      delete document.body.dataset.stage;
    };
  }, [stage]);

  // 끝난 상태가 오면 그 상태대로 넘어간다. 뒤로 가기로 이 화면에 다시 오지 않게 주소를 바꿔 넣는다
  useEffect(() => {
    const exit = data && exitFor(data, { searchId, versionNo });
    if (exit) void navigate(exit.to, { replace: true, state: exit.state });
  }, [data, navigate, searchId, versionNo]);

  const origin = data?.originCountry ?? null;
  const destination = data?.destinationCountry ?? null;
  const city = data?.destinationCity ?? null;
  const target = useMemo<LiveTarget>(
    () => ({
      from: globePlace(data?.originCountryCode, origin ?? ''),
      to: globePlace(data?.destinationCountryCode, city || destination || ''),
      scene: SCENE[stage],
    }),
    [data?.originCountryCode, data?.destinationCountryCode, origin, destination, city, stage],
  );

  const onCancel = () => {
    if (cancel.isPending) return;
    setCancelError('');
    cancel.mutate(searchKey, {
      onSuccess: () =>
        void navigate(routes.search, {
          replace: true,
          state: withNotice({ tone: 'info', text: SEARCH_CANCELED_TEXT }),
        }),
      onError: (e) => {
        // 이미 끝난 검색(409)이면 진행 상태를 한 번 다시 읽는다. 끝난 상태가 오면 위에서 그 상태대로 넘어간다
        if (e instanceof ApiError && e.status === 409) {
          void progress.refetch();
          return;
        }
        setCancelError(apiErrorText(e, '검색을 취소하지 못했습니다. 잠시 후 다시 시도해 주세요.'));
      },
    });
  };

  const text = stageTexts(data);
  const facts = tripFacts(data);
  const label =
    origin && destination
      ? `${origin}에서 ${withRo(destination)} 가는 경로를 표시한 지구본`
      : '검색 경로를 표시할 지구본';
  const ended = data !== undefined && !running;

  return (
    <>
      <title>검색 중 | Trupass</title>
      <header className="srch-top">
        <Logo to={routes.search} />
        <button
          type="button"
          className="btn txt n sm"
          onClick={onCancel}
          disabled={cancel.isPending || ended}
        >
          검색 취소
        </button>
      </header>
      <main className="srch">
        <div className="globe">
          <LiveSearchGlobe target={target} calm={calm} label={label} />
        </div>
        {(origin || destination) && (
          <div className="srch-lg">
            {origin && (
              <span className="lg-c">
                <i className="from" />
                {`${origin} 출발`}
              </span>
            )}
            {destination && (
              <span className="lg-c">
                <i className="to" />
                {`${destination} 도착`}
              </span>
            )}
          </div>
        )}
        {/* 단계가 바뀌면 그 문구를 스크린리더에 알린다 */}
        <p className="vh" role="status">
          {text[stage][0]}
        </p>
        <div className="srch-tx">
          {STEPS.map(([, k]) => (
            <div key={k} className="srch-t" data-st={k}>
              <h1 className="srch-h">
                {text[k][0]}
                <span className="dots live" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </h1>
              <p className="t-md c2">{text[k][1]}</p>
            </div>
          ))}
        </div>
        {facts.length > 0 && <p className="srch-fx t-sm c2">{facts.join(' · ')}</p>}
        <ol className="srch-sp" aria-label="검색 단계">
          {STEPS.map(([name, k], i) => (
            <Fragment key={k}>
              {i > 0 && <li className="ln" aria-hidden="true" />}
              <li className="sp" data-sp={k}>
                <Icon name="checkmark" size={12} />
                <b>{name}</b>
              </li>
            </Fragment>
          ))}
        </ol>
        {slow && (
          <div className="srch-n">
            <Note tone="y" icon="time">
              <div className="row jb g12 wrap">
                <span role="status">
                  오래 걸리고 있습니다. 조금 더 기다리거나 검색을 취소할 수 있습니다.
                </span>
                <button
                  type="button"
                  className="btn sm"
                  onClick={onCancel}
                  disabled={cancel.isPending}
                >
                  검색 취소
                </button>
              </div>
            </Note>
          </div>
        )}
        {cancelError && (
          <p className="t-sm cbad" role="alert">
            {cancelError}
          </p>
        )}
        {progress.isError && !data && (
          <div className="srch-n" role="alert">
            <Note tone="y" icon="warning--alt">
              <div className="g4">
                <span>{apiErrorText(progress.error, '진행 상태를 불러오지 못했습니다.')}</span>
                <Link className="lnk w5" to={routes.search}>
                  새 검색으로
                </Link>
              </div>
            </Note>
          </div>
        )}
        {data && (
          <div className="srch-rc">
            {PROMPTS.map((p) => (
              <span key={p.k} className="q">
                <Icon name={p.icon} size={16} />
                <span>{SENTENCE[p.k](data)}</span>
              </span>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
