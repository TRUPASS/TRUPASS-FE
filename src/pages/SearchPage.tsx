import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { AppFooter } from '@/app/layout/AppFooter';
import { AppHeader } from '@/app/layout/AppHeader';
import { routes } from '@/app/routes';
import { readNotice } from '@/features/search/notice';
import { searchApiOn, START_PARAM } from '@/features/search/searchRef';
import { SENTENCE_MAX, useStartSearch, type Sentences } from '@/features/search/useStartSearch';
import { useMember } from '@/shared/auth/member';
import { PROMPTS } from '@/shared/sample/data';
import { Ask, Chips, type AskHandle } from '@/shared/ui/Ask';
import { BrandSource } from '@/shared/ui/BrandMark';
import type { BrandKey } from '@/shared/ui/brands';
import { Note, Status } from '@/shared/ui/Status';

const SOURCES: BrandKey[] = ['tripdotcom', 'expedia', 'bookingdotcom', 'hotelsdotcom'];
const pad2 = (n: number) => String(n).padStart(2, '0');

/** 세 칸에 지금 적힌 문장 */
function sentencesIn(asks: (AskHandle | null)[]): Sentences {
  const at = (i: number) => asks[i]?.value() ?? '';
  return { flight: at(0), stay: at(1), exp: at(2) };
}

/**
 * 새 검색. 로그인한 회원이 [새 검색]으로 들어오는 화면이다. 랜딩의 문장 세 개를 한 창에 모았다.
 * 엔터를 누르면 다음 칸으로, 마지막 칸에서는 검색을 시작한다.
 * - API 에 붙으면: POST /searches 를 보내고 받은 searchId · versionNo 로 검색 중 화면에 간다. 주소에 ?start=1 이 붙어 오면
 *   (로그인 직후 등) 적어 둔 문장으로 곧바로 보낸다. 검색이 실패 · 취소돼 돌아오면 그 안내를 보여 주고, 문장은 그대로 남아 있다.
 * - 로그인 없이 화면만 볼 때(off): 예시 검색 중 화면으로 간다.
 */
export function SearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { nick } = useMember();
  const asks = useRef<(AskHandle | null)[]>([]);
  const last = PROMPTS.length - 1;
  const { start, busy, error } = useStartSearch();
  // 검색 중 화면에서 실패 · 취소로 돌아왔을 때의 안내. 다시 검색하면 지운다
  const [notice, setNotice] = useState(() => readNotice(location.state));

  const submit = () => {
    if (!searchApiOn) {
      void navigate(routes.searching);
      return;
    }
    setNotice(null);
    start(sentencesIn(asks.current));
  };

  const auto = searchApiOn && new URLSearchParams(location.search).get(START_PARAM) === '1';
  const autoRan = useRef(false);
  useEffect(() => {
    if (!auto || autoRan.current) return;
    autoRan.current = true;
    // 새로고침하거나 뒤로 가서 다시 열어도 또 보내지 않게 주소에서 지운다
    void navigate(routes.search, { replace: true });
    start(sentencesIn(asks.current));
  }, [auto, navigate, start]);

  const message = error ? { tone: 'fail' as const, text: error } : notice;

  return (
    <>
      <title>새 검색 | Trupass</title>
      <AppHeader on="새 검색" />
      <main className="home">
        <section className="home-win">
          <div className="lyr" />
          <div className="home-in">
            <div className="home-hd">
              <h1 className="home-h">{`어디로 떠나볼까요, ${nick}님`}</h1>
              <p className="home-p">
                문장 세 개를 적고 엔터를 누르면 항공권 · 숙소 · 여행 장소를 한 번에 찾습니다.
              </p>
            </div>
            <div className="home-f">
              {PROMPTS.map((p, i) => (
                <div key={p.k} className="home-r">
                  <span className="home-l">
                    <b className="num">{pad2(i + 1)}</b>
                    {p.l}
                  </span>
                  <Ask
                    ref={(handle) => {
                      asks.current[i] = handle;
                    }}
                    prompt={p}
                    filled
                    last={i === last}
                    required={searchApiOn}
                    maxLength={searchApiOn ? SENTENCE_MAX : undefined}
                    busy={i === last && busy}
                    onSubmit={() => (i < last ? asks.current[i + 1]?.focus() : submit())}
                  />
                </div>
              ))}
            </div>
            <p className="vh" role="status">
              {busy ? '검색을 시작하고 있습니다.' : ''}
            </p>
            {message && (
              <div className="home-m" role={message.tone === 'fail' ? 'alert' : 'status'}>
                <Note
                  tone={message.tone === 'fail' ? 'y' : 'b'}
                  icon={message.tone === 'fail' ? 'warning--alt' : 'information'}
                >
                  {message.text}
                </Note>
              </div>
            )}
            <div className="home-e">
              <span className="t-sm fn">예시</span>
              <Chips
                examples={PROMPTS[last]!.egs}
                onPick={(text) => asks.current[last]?.fill(text)}
              />
            </div>
          </div>
        </section>
        <section className="home-b">
          <div className="hb">
            <div className="row jb g12">
              <h2 className="t-sm w6">결제 권한</h2>
              <Status tone="warn">미등록</Status>
            </div>
            <p className="t-sm c2">
              첫 결제 단계에서 한도와 허용 항목을 정하고 패스키로 서명합니다.
            </p>
            <Link className="t-sm lnk w5" to={routes.mandate}>
              지금 등록
            </Link>
          </div>
          <div className="hb">
            <h2 className="t-sm w6">최근 검색</h2>
            <p className="t-sm c3">
              아직 검색 내역이 없습니다. 검색한 조건은 여기에 남아 다시 불러올 수 있습니다.
            </p>
          </div>
          <div className="hb">
            <h2 className="t-sm w6">검색 출처</h2>
            <div className="srcs">
              {SOURCES.map((k) => (
                <BrandSource key={k} name={k} />
              ))}
            </div>
            <p className="t-xs c3">장소와 후기는 Google 지도와 웹 검색 결과를 함께 조회합니다.</p>
          </div>
        </section>
      </main>
      <AppFooter />
    </>
  );
}
