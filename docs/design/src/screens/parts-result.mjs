// 07 · 08 검색 결과와 09 장소 화면이 함께 쓰는 조각.
//   항공권 표 — 항공권 한 건이 한 줄이다. 화면에 들어오면 한 줄씩 떠오른다. 줄 아래의 [추천 숙소 3곳]을 펼쳐 숙소를 고른다.
//   선택한 조합(오른쪽) · 검색 기록 · 아래 고정 영역.  고르기와 합계 계산은 src/js/site.js 가 #tp-data 를 읽어 처리한다.
//   고르는 자리는 전부 실제 라디오 · 체크박스이고, 숙소 펼치기는 details/summary 라서 스크립트 없이도 열린다.
import { ic, btn, chk, tag, src, won, sgn, steps, header, footer, page, bottom } from '../lib/ui.mjs';
import { REQ, FLIGHTS, BAG, MEAL, NEW_IN_V2, stays, period } from '../lib/data.mjs';
import { requestPanel } from './parts-search.mjs';

// 한 구간: 날짜와 편명, 그 아래 출발 시각 ─ 소요 시간 ─ 도착 시각
const leg = (h, l) => `<div class="lg2" data-n="${h}"><span class="lg2-k"><span class="tm-only c3">${h}</span><span class="num">${l.d}</span><span class="c3">${l.no}</span></span><div class="lg2-t" data-n="Times"><div class="e"><b class="num">${l.dep}</b><span>${l.fc}</span></div><div class="m"><i></i><span class="t-xs c3 nw">${l.dur}</span><i></i></div><div class="e"><b class="num">${l.arr}</b><span>${l.tc}</span></div></div></div>`;

// 숙소 한 곳 (항공권 줄을 펼친 자리에 3곳). 상자 없이 사진과 글만 놓고, 고른 곳은 사진에 테두리를 두른다.
// 표식(추천 · 새로 찾음)은 사진 위에 올려, 세 곳의 이름과 설명이 같은 높이에서 시작하게 한다.
const stayCard = (h, i, fid, on, isNew) => `<label class="sc rise" style="--i:${i}" data-stay="${h.id}" data-n="Stay/${h.name}">
<input class="vh" type="radio" name="stay-${fid}" value="${h.id}"${on ? ' checked' : ''}>
<span class="sc-ph" data-n="Photo"><img src="../assets/${h.photo}" width="400" height="300" alt="">${h.tag || isNew ? `<span class="sc-tg">${h.tag ? tag(h.tag, 'b') : ''}${isNew ? tag('새로 찾음', 'y') : ''}</span>` : ''}</span>
<span class="sc-b" data-n="Info"><span class="sc-n"><span class="rad" data-n="Dot"></span><span class="t-md w6">${h.name}</span></span><span class="t-sm c2">${h.grade}, ${h.area}</span><span class="t-sm c2">${h.room}, ${h.meal}</span><span class="t-xs c3">${h.cancel}</span>
<span class="sc-f" data-n="Price"><span class="t-h3 num">${won(h.price)}</span>${src(h.src)}</span></span></label>`;
// 추가 선택: 수하물은 항공권에, 조식은 조식이 빠진 숙소를 골랐을 때만 붙는다.
const addon = (k, a, on, show) => `<div class="ax-r"${show ? '' : ' hidden'} data-addon="${k}" data-n="AddOn">${chk(`${a.label} <span class="c3">${a.sub}</span>`, on)}<span class="t-sm num w5 fn">${sgn(a.price)}</span></div>`;
// 항공권 한 줄: 고르기 + 항공사 + 가는 편 · 오는 편 + 요금, 그 아래 요청과 맞는 점과 숙소 펼치기
const flightRow = (f, i, { c, changed, open }) => {
  const list = stays(c.map, f.id), on = f.id === c.f.id, min = Math.min(...list.map(h => h.price));
  const pickedText = `고른 숙소 ${c.h.name}`, offerText = `추천 숙소 3곳, ${won(min)}부터`;
  return `<article class="fo rise${on ? ' on' : ''}" style="--i:${i}" data-flight="${f.id}" data-n="Flight/${f.air} ${f.out.no}">
<div class="fo-r" data-pick data-n="Row">
  <label class="fo-k"><input class="vh" type="radio" name="flight" value="${f.id}"${on ? ' checked' : ''}><span class="rad" data-n="Dot"></span><span class="vh">${f.air} ${f.out.no} 선택</span></label>
  <div class="fo-a" data-n="Airline"><div class="row g8"><span class="t-h3">${f.air}</span>${f.tag ? tag(f.tag, 'b') : ''}</div><span class="t-xs c3">${f.cls}, ${f.bag}</span></div>
  <div class="fo-l" data-n="Legs">${leg('가는 편', f.out)}${leg('오는 편', f.back)}</div>
  <div class="fo-p" data-n="Price"><span class="t-h2 num">${won(f.price)}</span>${src(f.src)}</div>
</div>
<details class="fo-s"${open && on ? ' open' : ''} data-n="Stays">
<summary class="fo-tg" data-tg data-n="StayToggle"><span class="fo-fit">${ic('checkmark', 14, 'cok')}<span class="t-sm c2">${f.fit}</span></span><span class="fo-st">${ic('hotel', 16, 'c3')}<span class="t-sm w5" data-stay-line data-offer="${offerText}">${on ? pickedText : offerText}</span>${changed ? tag('변경', 'y fo-ch') : ''}<span class="fo-tb"><span class="tg-c">보기</span><span class="tg-o">접기</span>${ic('chevron--down', 16)}</span></span></summary>
<div class="fo-w" data-n="Well"><p class="t-xs c3 num">${period(f)}, 3박, 2인 1실 기준</p>
<div class="stays" data-n="List">${list.map((h, k) => stayCard(h, k, f.id, on && h.id === c.h.id, changed && NEW_IN_V2.includes(h.id))).join('\n')}</div>
<div class="ax" role="group" aria-label="추가 선택" data-n="AddOns"><span class="ax-l t-xs c3">추가 선택</span><div class="grow g6" data-n="List">${addon('bag', BAG, on && c.bag, true)}${addon('meal', MEAL, false, on && c.h.meal === '조식 불포함')}</div></div></div>
</details>
</article>`;
};
export const optionTable = ({ c, changed, open }) => `<section class="ocs" data-n="Options">
<div class="ocs-h" data-n="Heading"><div class="row g10 wrap"><h2 class="t-h3">항공권 ${FLIGHTS.length}건</h2><span class="t-sm c3">왕복, 성인 2명</span></div><span class="t-xs c3 fn">요청에 가까운 순<span class="dt-only num">, 요금 조회 ${REQ.at}</span></span></div>
<div class="fo-hd d-only" aria-hidden="true" data-n="Columns"><span class="fo-k"></span><span class="fo-a">항공사</span><span class="fo-l"><span class="lg2">가는 편</span><span class="lg2">오는 편</span></span><span class="fo-p">왕복 요금</span></div>
<div class="fos" role="radiogroup" aria-label="항공권 고르기" data-n="List">
${FLIGHTS.map((f, i) => flightRow(f, i, { c, changed, open })).join('\n')}
</div></section>`;

// 화면이 다시 계산할 수 있도록 싣는 값 (선택에 따라 합계가 바뀐다)
const dataScript = c => `<script type="application/json" id="tp-data">${JSON.stringify({
  budget: REQ.budget, sel: { f: c.f.id, h: c.h.id, bag: c.bag },
  flights: Object.fromEntries(FLIGHTS.map(f => [f.id, { t: `${f.air} ${f.out.no} / ${f.back.no}`, s: `${f.cls}, 성인 2명 왕복`, p: f.price }])),
  stays: Object.fromEntries(FLIGHTS.map(f => [f.id, Object.fromEntries(stays(c.map, f.id).map(h => [h.id, { t: h.name, s: `${h.room}, 3박, ${h.meal}`, p: h.price, nomeal: h.meal === '조식 불포함' }]))])),
  bag: { t: BAG.line, s: BAG.sub, p: BAG.price }, meal: { t: MEAL.label, s: MEAL.sub, p: MEAL.price },
})}</script>`;

// 오른쪽: 선택한 조합
export const summaryPanel = ({ c, ver, prev, cta, href, foot, back, backHref }) => `<section class="pnl sum" aria-label="선택한 조합" data-n="Summary">
<div class="pnl-h jb"><h2 class="t-h3">선택한 조합</h2><span class="t-xs c3 num">${ver}</span></div>
<div class="pnl-b g16">
<p class="vh" role="status" data-sum="say"></p>
<div data-sum="lines" data-n="Lines">${c.lines.map((l, i) => `<div class="sl${i ? '' : ' first'}" data-n="Line"><span class="k">${l.k}</span><div class="grow g2"><span class="t-sm w5">${l.t}</span><span class="t-xs c3">${l.s}</span></div><span class="t-sm num w5 fn">${won(l.p)}</span></div>`).join('')}</div>
<div class="hr"></div>
<div class="g6" data-n="Total"><div class="row jb"><span class="t-md w6">합계 <span class="t-sm c3 w4">성인 2명</span></span><span class="t-h1 num" data-sum="total">${won(c.total)}</span></div>${prev ? `<div class="row jb"><span class="t-sm c2">변경 전</span><span class="t-sm c3 num del">${won(prev)}</span></div>` : ''}<div class="row jb"><span class="t-sm c2">예산 ${won(REQ.budget)} 대비</span><span class="t-sm cok w5 num" data-sum="left">${won(c.left)} 여유</span></div></div>
${btn(cta, { kind: 'pri', size: 'lg', cls: 'fill d-only', href, n: 'Next' })}${back ? btn(back, { cls: 'fill d-only', icon: 'arrow--left', href: backHref, n: 'Back' }) : ''}
<span class="t-xs c3">${foot}</span>
</div></section>`;
// 오른쪽: 검색 기록 (수정 요청으로 다시 검색한 뒤에 보인다)
export const historyPanel = versions => `<section class="pnl" data-n="History">
<div class="pnl-h"><h2 class="t-h3">검색 기록</h2></div>
<div class="pnl-b"><div data-n="List">${versions.map(([v, t, d, on, href], i) => `<div class="ver${i ? '' : ' first'}" data-n="Version"><span class="v ${on ? 'cb' : 'c3'}">${v}</span><div class="grow g2"><span class="${on ? 'w5' : 'c2'}">${d}</span><span class="t-xs c3 num">${t}</span></div>${on ? '<span class="t-xs c3 fn">현재</span>' : `<a class="t-xs lnk w5 fn" href="${href}">보기</a>`}</div>`).join('')}</div></div></section>`;

// 태블릿 · 모바일: 독 아래에 붙는 합계와 다음 단계 버튼
export const ctaBar = (c, label, href) => `<div class="cta-bar tm-only" data-n="BottomBar"><div class="g2"><span class="t-xs c3">합계, 성인 2명</span><span class="t-h3 num" data-sum="total">${won(c.total)}</span></div>${btn(label, { kind: 'pri', href, n: 'Next' })}</div>`;

// 화면 머리: 제목 + 진행 단계 (+ 필요한 경우 한 줄 설명). 앱 화면은 모두 이 머리를 쓴다.
export const pageHead = (head, cur, sub = '') => `<div class="g10" data-n="Title"><div class="pt"><h1 class="t-h1">${head}</h1>${steps(cur)}</div>${sub ? `<p class="t-md c2 mw720">${sub}</p>` : ''}</div>`;

const DOCK = { ph: '예) 숙소를 우에노역에서 더 가까운 곳으로 바꿔 주세요', hint: '항공권 · 숙소 · 장소를 바뀐 조건으로 다시 검색합니다.', egs: ['숙소를 더 저렴한 곳으로', '오후 출발 항공권도 포함', '조식 포함 숙소만'], href: '08-result-v2.html' };
export const resultPage = ({ title, head, c, top = '', change, changed, open, rail, dock = {}, vp }) => page({ title, tab: '검색 결과', cls: 'has-dock' + (vp ? ' vp' : ''), body: `${header({ on: '새 검색' })}
<main class="main" data-n="Main"><div class="cx g24" data-n="Content">
${pageHead(head, 1)}
<div class="two"><div class="two-m" data-n="MainColumn">${top}${requestPanel({ change })}${optionTable({ c, changed, open })}</div><aside class="two-r stick" data-n="Rail">${rail}</aside></div>
</div></main>
${footer()}
${bottom({ dock: { ...DOCK, ...dock }, bar: ctaBar(c, '추천 장소 보기', '09-places.html') })}
${dataScript(c)}` });
