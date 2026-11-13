// 14 내 여행 — 결제를 마친 여행의 일정과 문서를 모아 보는 화면.
// 13 결제 완료의 [내 여행에서 일정 보기]와 상단 메뉴의 [내 여행]에서 온다.
// 일정은 날짜별 목록이다: 가는 편 → 체크인 → 자유 일정(추천 장소로 이어진다) → 체크아웃 → 오는 편.
import { page, header, footer, btn, ic, st } from '../lib/ui.mjs';
import { U, REQ, V1, PAY, TRIP, AREA, ACTS } from '../lib/data.mjs';
import { DOCS, paySummary } from './10-pay.mjs';

const C = V1, f = C.f, h = C.h;
// 출발까지 남은 날: 시안의 오늘(REQ.at)부터 가는 편 날짜까지
const days = (() => {
  const [y, m, d] = REQ.at.slice(0, 10).split('.').map(Number), [fm, fd] = f.out.d.split(' ')[0].split('.').map(Number);
  return Math.round((Date.UTC(y, fm - 1, fd) - Date.UTC(y, m - 1, d)) / 864e5);
})();
const placeCount = AREA.groups.reduce((n, g) => n + g.items.length, 0);
const route = l => `${l.from} (${l.fc}) → ${l.to} (${l.tc})`;

// 일정 한 줄: 시각 | 무엇을 하는지와 설명 | 예약번호
const item = (time, title, sub, code) => `<li class="tl-i" data-n="Event"><span class="tl-t num">${time}</span><div class="tl-x"><span class="t-md w6">${title}</span>${sub ? `<span class="t-sm c2">${sub}</span>` : ''}</div>${code ? `<span class="tl-c t-xs c3 num">${code}</span>` : ''}</li>`;
const day = (date, items, first) => `<li class="tl-d${first ? ' first' : ''}" data-n="Day/${date}"><h3 class="tl-k t-md">${date}</h3><ol class="tl-l">${items.join('')}</ol></li>`;

const trip = () => `<section class="pnl clip" data-n="Trip">
<div class="pnl-h jb"><div class="row g10 wrap"><h2 class="t-h3">${TRIP.title}</h2>${st('ok', '예약 확정')}</div><span class="t-sm c2 fn num">출발까지 ${days}일</span></div>
<dl class="trip-m" data-n="Summary">${[['기간', REQ.range], ['인원', REQ.pax], ['주문번호', REQ.order]].map(([k, v]) => `<div class="g2"><dt class="t-xs c3">${k}</dt><dd class="t-md w5 num">${v}</dd></div>`).join('')}</dl>
<ol class="tl" aria-label="날짜별 일정" data-n="Itinerary">
${day(f.out.d, [
    item(`${f.out.dep} → ${f.out.arr}`, route(f.out), `${f.air} ${f.out.no}, ${f.cls}, ${f.out.dur}`, `예약번호 ${PAY.air.no}`),
    item(`${TRIP.checkin}부터`, `체크인, ${h.name}`, `${h.area}, ${h.room} 1실`, `예약번호 ${PAY.stay.no}`),
  ], true)}
${day(TRIP.free, [
    item('종일', '자유 일정', `숙소 주변 추천 장소 ${placeCount}곳과 활동 ${ACTS.length}건을 골라 두었습니다. <a class="lnk w5" href="09-places.html" data-n="Places">추천 장소 보기</a>`),
  ])}
${day(f.back.d, [
    item(`${TRIP.checkout}까지`, `체크아웃, ${h.name}`, ''),
    item(`${f.back.dep} → ${f.back.arr}`, route(f.back), `${f.air} ${f.back.no}, ${f.cls}, ${f.back.dur}`, `예약번호 ${PAY.air.no}`),
  ])}
</ol>
</section>`;

const docs = () => `<section class="pnl" id="docs" data-n="Documents">
<div class="pnl-h jb"><div class="row g10">${ic('document', 20)}<h2 class="t-h3">문서함</h2></div><span class="t-sm c3">${DOCS.length}건</span></div>
${DOCS.map(([i, t, s], k) => `<div class="doc${k ? '' : ' first'}" data-n="Document/${t}">${ic(i, 20, 'c2')}<div class="grow g2"><span class="t-md w5">${t}</span><span class="t-xs c3">${s}</span></div><span class="t-xs c3 num fn">${PAY.mailed} 발송</span></div>`).join('')}
<div class="pnl-f" data-n="Actions"><span class="t-sm c3 dt-only">${U.mail} 주소로도 보냈습니다.</span>${btn('모두 PDF로 받기', { icon: 'download', n: 'Download' })}</div>
</section>`;

const past = () => `<section class="pnl" data-n="Past"><div class="pnl-h"><h2 class="t-h3">지난 여행</h2></div><div class="pnl-b"><p class="t-sm c3">아직 다녀온 여행이 없습니다. 다녀온 여행은 일정과 문서와 함께 여기에 남습니다.</p></div></section>`;

export const trips = {
  id: '14-trips', no: '14', name: '내 여행 · 일정과 문서함', kind: 'page',
  note: '결제를 마친 여행을 모아 보는 화면. 13 결제 완료의 [내 여행에서 일정 보기]나 상단 메뉴의 [내 여행]을 누르면 온다. 다가오는 여행의 일정을 날짜별로 보여 주고(가는 편 → 체크인 → 자유 일정 → 체크아웃 → 오는 편), 자유 일정에서는 09 추천 장소로 다시 갈 수 있다. 영수증과 확정서는 문서함에 모은다.',
  html: () => page({ title: '14 내 여행', tab: '내 여행', body: `${header({ on: '내 여행' })}
<main class="main" data-n="Main"><div class="cx g24" data-n="Content">
<div class="g10" data-n="Title"><div class="pt"><h1 class="t-h1">내 여행</h1><span class="t-sm c3 fn">다가오는 여행 1건</span></div><p class="t-md c2 mw720">예약한 여행의 일정과 문서를 한곳에서 확인합니다.</p></div>
<div class="two"><div class="two-m" data-n="MainColumn">${trip()}${docs()}${past()}</div>
<aside class="two-r" data-n="Rail">${paySummary()}<div class="g8" data-n="Next">${btn('새 검색', { kind: 'pri', size: 'lg', cls: 'fill', href: '05-home.html', n: 'NewSearch' })}</div></aside></div>
</div></main>
${footer()}` }),
};
