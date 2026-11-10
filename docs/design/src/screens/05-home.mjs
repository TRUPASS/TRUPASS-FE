// 05 새 검색 — 로그인한 회원이 [새 검색]으로 들어오는 화면. 랜딩의 문장 세 개를 한 창에 모았다.
import { page, header, footer, st, ask, chips, src, btn } from '../lib/ui.mjs';
import { PROMPTS, U } from '../lib/data.mjs';

const pad2 = n => String(n).padStart(2, '0');
const NEXT = ['focus:stay', 'focus:exp', '06-searching.html'];

export default {
  id: '05-home', no: '05', name: '새 검색 · 로그인 후', kind: 'page',
  note: '로그인한 회원이 다시 검색할 때 쓰는 화면. 하늘 창 가운데에 항공 · 숙소 · 체험 문장 칸 세 개를 모았고, 엔터를 누르면 다음 칸으로, 마지막 칸에서는 06 검색으로 넘어간다. 계정 상태(결제 권한 · 최근 검색 · 검색 출처)는 창 아래에 한 줄로 내렸다.',
  html: () => page({ title: '05 새 검색', body: `${header({ on: '새 검색' })}
<main class="home" data-n="Main">
<section class="home-win" data-n="Window"><div class="lyr" data-n="Sky"></div>
  <div class="home-in" data-n="Search">
    <div class="home-hd" data-n="Heading"><h1 class="home-h">어디로 떠나볼까요, ${U.nick}님</h1><p class="home-p">문장 세 개를 적고 엔터를 누르면 항공권 · 숙소 · 여행 장소를 한 번에 찾습니다.</p></div>
    <div class="home-f" data-n="Prompts">${PROMPTS.map((p, i) => `<div class="home-r" data-n="Field/${p.l}"><span class="home-l"><b class="num">${pad2(i + 1)}</b>${p.l}</span>${ask(p, { filled: 1, next: NEXT[i], last: i === 2 })}</div>`).join('')}</div>
    <div class="home-e" data-n="Examples"><span class="t-sm fn">예시</span>${chips(PROMPTS[2])}</div>
  </div>
</section>
<section class="home-b" data-n="Account">
  <div class="hb" data-n="Mandate"><div class="row jb g12"><span class="t-sm w6">결제 권한</span>${st('warn', '미등록')}</div><p class="t-sm c2">첫 결제 단계에서 한도와 허용 항목을 정하고 패스키로 서명합니다.</p><a class="t-sm lnk w5" href="10-mandate.html">지금 등록</a></div>
  <div class="hb" data-n="Recent"><span class="t-sm w6">최근 검색</span><p class="t-sm c3">아직 검색 내역이 없습니다. 검색한 조건은 여기에 남아 다시 불러올 수 있습니다.</p></div>
  <div class="hb" data-n="Sources"><span class="t-sm w6">검색 출처</span><div class="srcs">${['haneul', 'airmoa', 'stayon', 'naru'].map(k => src(k, { link: false })).join('')}</div><p class="t-xs c3">장소와 후기는 Google 지도와 웹 검색 결과를 함께 조회합니다.</p></div>
</section>
</main>
${footer()}` }),
};
