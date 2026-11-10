// 07 · 08 검색 결과와 09 장소 화면이 함께 쓰는 조각: 항공권 제안(항공권마다 펼치는 숙소 3곳), 선택한 조합, 아래 고정 영역.
import { ic, btn, chk, tag, src, won, sgn, steps, header, footer, page, bottom, DOCK_JS } from '../lib/ui.mjs';
import { REQ, FLIGHTS, BAG, MEAL, stays, period } from '../lib/data.mjs';
import { requestPanel } from './parts-search.mjs';

const radio = on => `<span class="rad${on ? ' on' : ''}" data-n="Radio">${on ? '<span class="dot"></span>' : ''}</span>`;
const leg = (h, l) => `<span class="t-xs c3"><span class="m-only">${h} · </span>${l.d} · ${l.no}</span><div class="row g6" data-n="Times"><span class="t-h3 num">${l.dep}</span><span class="t-sm c2">${l.from}</span>${ic('arrow--right', 14, 'c3')}<span class="t-h3 num">${l.arr}</span><span class="t-sm c2">${l.to}</span></div><span class="t-xs c3">직항 · ${l.dur}</span>`;

// 숙소 한 줄 (항공권을 펼친 자리)
const stayRow = (h, on) => `<label class="so${on ? ' on' : ''}" data-n="Stay/${h.name}"><div class="c-sel">${radio(on)}</div><img class="th" src="../assets/${h.photo}" width="96" height="72" alt="" data-n="Photo"><div class="c-info"><div class="row g6 wrap"><span class="t-md w6">${h.name}</span>${h.tag ? tag(h.tag, 'b') : ''}</div><span class="t-sm c2">${h.grade} · ${h.area}</span><span class="t-sm c2">${h.room} · ${h.meal}</span><span class="t-xs c3">${h.cancel}</span></div><div class="c-price"><span class="t-h3 num">${won(h.price)}</span>${src(h.src)}</div></label>`;
// 추가 선택: 수하물은 항공권에, 조식은 조식이 빠진 숙소를 골랐을 때만 붙는다.
const extras = (c, on) => {
  const rows = [[BAG, on && c.bag], ...(on && c.h.meal === '조식 불포함' ? [[MEAL, false]] : [])];
  return `<div class="ax" data-n="AddOns"><span class="ax-l t-xs c3">추가 선택</span><div class="grow g4" data-n="List">${rows.map(([a, v]) => `<div class="ax-r" data-n="AddOn">${chk(`${a.label} <span class="c3">· ${a.sub}</span>`, v)}<span class="t-sm num w5 fn">${sgn(a.price)}</span></div>`).join('')}</div></div>`;
};
// 항공권 한 건: 항공권 줄 + 요청과 맞는 점 + 숙소 토글 + (펼치면) 숙소 3곳과 추가 선택
const flightBlock = (f, i, { c, changed }) => {
  const list = stays(c.map, f.id), on = f.id === c.f.id, min = Math.min(...list.map(h => h.price));
  return `<div class="fo${i ? '' : ' first'}${on ? ' on open' : ''}" data-n="Flight/${f.air} ${f.out.no}">
<label class="or" data-n="Row"><div class="c-sel">${radio(on)}</div><div class="c-air"><div class="row g6"><span class="t-md w6">${f.air}</span>${f.tag ? tag(f.tag, 'b') : ''}</div><span class="t-xs c3">${f.cls} · ${f.bag}</span></div><div class="c-leg" data-n="Outbound">${leg('가는 편', f.out)}</div><div class="c-leg" data-n="Inbound">${leg('오는 편', f.back)}</div><div class="c-price"><span class="t-h3 num">${won(f.price)}</span>${src(f.src)}</div></label>
<div class="fo-fit" data-n="Fit">${ic('checkmark', 14, 'cok')}<span class="t-sm c2 grow">${f.fit}</span></div>
<a class="fo-t" data-n="StayToggle" data-tg>${ic('hotel', 16, 'c2')}<span class="t-sm w6 fn">숙소 3곳</span>${changed ? tag('변경', 'y') : ''}<span class="t-sm c3 grow num">${period(f)}<span class="dt-only"> · 2인 1실</span> · ${won(min)}부터</span><span class="t-sm cb w5 fn tg-c">보기</span><span class="t-sm cb w5 fn tg-o">접기</span>${ic('chevron--down', 16, 'cb tg-c')}${ic('chevron--up', 16, 'cb tg-o')}</a>
<div class="fo-s" data-n="Stays">${list.map(h => stayRow(h, on && h.id === c.h.id)).join('')}${extras(c, on)}</div>
</div>`;
};
export const flightsPanel = ({ c, changed }) => `<section class="pnl clip" data-n="Flights">
<div class="pnl-h jb"><div class="row g10">${ic('plane', 20)}<h2 class="t-h3">항공권 제안</h2><span class="t-sm c3">왕복 · 성인 2명 · ${FLIGHTS.length}건<span class="dt-only"> · 요청에 가까운 순</span></span></div><span class="t-xs c3 dt-only fn">요금 조회 ${REQ.at}</span></div>
<div class="ot-h dt-only" data-n="Columns"><span class="c-sel"></span><span class="c-air">항공사</span><span class="c-leg">가는 편</span><span class="c-leg">오는 편</span><span class="c-price tr">요금 · 출처</span></div>
${FLIGHTS.map((f, i) => flightBlock(f, i, { c, changed })).join('\n')}
</section>`;

// 오른쪽: 선택한 조합
export const summaryPanel = ({ c, ver, prev, changed = [], cta, foot, back }) => `<section class="pnl" data-n="Summary">
<div class="pnl-h jb"><h2 class="t-h3">선택한 조합</h2><span class="t-xs c3 num">${ver}</span></div>
<div class="pnl-b g12">
<div data-n="Lines">${c.lines.map((l, i) => `<div class="sl${i ? '' : ' first'}" data-n="Line"><span class="k">${l.k}</span><div class="grow g2"><div class="row g6 wrap"><span class="t-sm w5">${l.t}</span>${changed.includes(l.k) ? tag('변경', 'y') : ''}</div><span class="t-xs c3">${l.s}</span></div><span class="t-sm num w5 fn">${won(l.p)}</span></div>`).join('')}</div>
<div class="hr"></div>
<div class="g4" data-n="Total"><div class="row jb"><span class="t-md w6">합계 <span class="t-sm c3 w4">성인 2명</span></span><span class="t-h2 num">${won(c.total)}</span></div>${prev ? `<div class="row jb"><span class="t-sm c2">변경 전</span><span class="t-sm c3 num del">${won(prev)}</span></div>` : ''}<div class="row jb"><span class="t-sm c2">예산 ${won(REQ.budget)} 대비</span><span class="t-sm cok w5 num">${won(c.left)} 여유</span></div></div>
${btn(cta, { kind: 'pri', size: 'lg', cls: 'fill d-only', after: 'arrow--right', n: 'Next' })}${back ? btn(back, { cls: 'fill d-only', icon: 'arrow--left', n: 'Back' }) : ''}
<span class="t-xs c3">${foot}</span>
</div></section>`;
// 오른쪽: 검색 기록 (수정 요청으로 다시 검색한 뒤에 보인다)
export const historyPanel = versions => `<section class="pnl" data-n="History">
<div class="pnl-h"><h2 class="t-h3">검색 기록</h2></div>
<div class="pnl-b"><div data-n="List">${versions.map(([v, t, d, on], i) => `<div class="ver${i ? '' : ' first'}" data-n="Version"><span class="v ${on ? 'cb' : 'c3'}">${v}</span><div class="grow g2"><span class="${on ? 'w5' : 'c2'}">${d}</span><span class="t-xs c3 num">${t}</span></div>${on ? '<span class="t-xs c3 fn">현재</span>' : '<a class="t-xs lnk w5 fn">보기</a>'}</div>`).join('')}</div></div></section>`;

// 태블릿 · 모바일: 독 아래에 붙는 합계와 다음 단계 버튼
export const ctaBar = (c, label) => `<div class="cta-bar tm-only" data-n="BottomBar"><div class="g2"><span class="t-xs c3">합계 · 성인 2명</span><span class="t-h3 num">${won(c.total)}</span></div>${btn(label, { kind: 'pri', size: 'lg', after: 'arrow--right', n: 'Next' })}</div>`;

const DOCK = { ph: '예) 숙소를 우에노 미술관 근처로 바꿔 주세요', hint: '항공권 · 숙소 · 장소를 바뀐 조건으로 다시 검색합니다.', egs: ['숙소를 더 저렴한 곳으로', '오후 출발 항공권도 포함', '조식 포함 숙소만'] };
export const resultPage = ({ title, c, top = '', extra, changed, rail, dock = {}, vp }) => page({ title, cls: 'has-dock' + (vp ? ' vp' : ''), js: DOCK_JS, body: `${header({ kind: 'in', on: '새 검색' })}
<main class="main" data-n="Main"><div class="cx g20" data-n="Content">
<div class="g8" data-n="Title"><div class="pt"><h1 class="t-h1">검색 결과</h1>${steps(1)}</div><p class="t-md c2">조건에 맞는 항공권 ${FLIGHTS.length}건을 찾았습니다. 항공권마다 [숙소 3곳]을 펼치면 그 일정에 예약할 수 있는 숙소를 함께 고를 수 있습니다.</p></div>
<div class="two"><div class="two-m" data-n="MainColumn">${top}${requestPanel({ extra })}${flightsPanel({ c, changed })}</div><aside class="two-r stick" data-n="Rail">${rail}</aside></div>
</div></main>
${footer()}
${bottom({ dock: { ...DOCK, ...dock }, bar: ctaBar(c, '추천 장소 보기') })}` });
