// 10 결제 권한 등록 · 11 결제 확인 · 12 결제 진행 · 13 결제 완료 (결제를 마치면 14 내 여행으로 이어진다)
// 결제는 회원이 미리 서명한 결제 권한(권한 증명서)의 한도·항목 안에서만 실행된다.
import { page, header, footer, btn, ic, inp, fld, chk, rad, opt, st, kv, note, src, won } from '../lib/ui.mjs';
import { U, REQ, V1, MANDATE as M, PAY } from '../lib/data.mjs';
import { pageHead } from './parts-result.mjs';

const C = V1;
const f = C.f, h = C.h;
const shell = (title, tab, head, sub, body, cur, attrs = '') => page({ title, tab, attrs, body: `${header({ on: '새 검색' })}
<main class="main" data-n="Main"><div class="cx g24" data-n="Content">
${pageHead(head, cur, sub)}
${body}
</div></main>
${footer()}` });

/* ── 10 결제 권한 등록 (첫 결제 때 한 번) ── */
const mandateForm = () => `<form class="pnl two-m su-form" action="11-checkout.html" method="get" data-n="Form">
<div class="pnl-b g24" data-n="Fields">
  ${fld('결제수단', `<div class="cardrow jb" data-n="Card"><div class="row g12">${ic('purchase', 20, 'c2')}<div class="g2"><span class="t-md w5">${U.card}</span><span class="t-xs c3">본인 명의 신용카드, 유효기간 08/29</span></div></div>${btn('변경', { kind: 'txt', size: 'sm', n: 'ChangeCard' })}</div>`, { hint: '권한에 묶인 결제수단으로만 결제됩니다.' })}
  <div class="f2">
    ${fld('1회 결제 한도', inp('2,000,000', { id: 'md-per', cls: 'num', mode: 'numeric', hint: 1, after: '<span class="c3 fn">원</span>' }), { for: 'md-per', hint: `이번 결제 예정 금액은 ${won(C.total)}입니다.` })}
    ${fld('월 누적 한도', inp('5,000,000', { id: 'md-month', cls: 'num', mode: 'numeric', hint: 1, after: '<span class="c3 fn">원</span>' }), { for: 'md-month', hint: '매월 1일에 누적 금액이 초기화됩니다.' })}
  </div>
  ${fld('허용 항목', `<div class="tiles t3" data-n="Options">${opt('항공권', 1)}${opt('숙소', 1)}${opt('체험 · 입장권', 0)}</div>`, { hint: '선택하지 않은 항목은 조합에 들어 있어도 결제되지 않습니다.' })}
  ${fld('유효기간', `<div class="radios" data-n="Radios">${rad('6개월', 0, { name: 'term' })}${rad('1년', 1, { name: 'term' })}${rad('직접 입력', 0, { name: 'term' })}</div>`, { hint: `${M.from} ~ ${M.until}` })}
  ${fld('결제 승인 방식', `<div class="rlist" data-n="Radios">${rad('매 결제마다 패스키로 본인 확인', 1, { name: 'approve' })}${rad('한도 안의 결제는 본인 확인 없이 진행', 0, { name: 'approve' })}</div>`, { hint: '본인 확인 없이 진행하도록 바꾸면 [이 조합으로 결제]를 누르는 즉시 결제됩니다.' })}
</div>
<div class="pnl-f" data-n="Actions"><span class="t-sm c3 dt-only">서명에는 이 기기의 패스키(지문 · 얼굴 인식)를 사용합니다.</span>${btn('패스키로 서명하고 등록', { kind: 'pri', size: 'lg', type: 'submit', icon: 'fingerprint-recognition', isz: 20, n: 'Sign' })}</div>
</form>`;
const mandateSide = () => `<aside class="two-r" data-n="Side">
<div class="pnl" data-n="Document"><div class="pnl-h jb"><h2 class="t-h3">서명할 내용</h2><span class="t-xs c3">권한 증명서</span></div><div class="pnl-b pnl-kv">
${kv('발급 대상', `${U.name}<br><span class="t-xs c3">${U.mail}</span>`, false)}${kv('결제수단', U.card)}${kv('1회 한도', won(M.per))}${kv('월 누적 한도', won(M.month))}${kv('허용 항목', M.scope)}${kv('유효기간', `${M.until}까지`)}${kv('승인 방식', M.method)}
</div></div>
${note('권한 증명서는 회원님의 기기에서 서명됩니다. Trupass와 판매자는 서명을 검증만 할 수 있으며, 범위를 벗어난 결제는 실행되지 않습니다. 설정에서 언제든 바꾸거나 폐기할 수 있습니다.', '', 'security')}
</aside>`;
export const mandate = {
  id: '10-mandate', no: '10', name: '결제 권한 등록 · 최초 1회', kind: 'page', bps: ['d', 't', 'm'],
  note: '가정한 보조 화면. 결제 권한이 없는 회원이 첫 결제에 들어가면 한도·허용 항목·유효기간·승인 방식을 정하고 패스키로 서명한다. 이후 결제는 이 화면을 건너뛴다.',
  html: () => shell('10 결제 권한 등록', '결제 권한 등록', '결제 범위를 먼저 정합니다', '첫 결제 때 한 번 등록합니다. 이후 결제는 여기서 정한 한도와 항목 안에서만 실행됩니다.', `<div class="two">${mandateForm()}${mandateSide()}</div>`, 3),
};

/* ── 11 결제 확인 ── */
const items = () => `<section class="pnl" data-n="Items">
<div class="pnl-h jb"><h2 class="t-h3">결제 내용</h2><span class="t-sm c3">예약 2건, 판매자 2곳</span></div>
<div class="li first" data-n="Item/Flight">${ic('plane', 20, 'c2')}<div class="grow g2"><span class="t-md w6">${f.air} ${f.out.no} / ${f.back.no}</span><span class="t-sm c2">${f.out.d} ${f.out.dep} ${f.out.from} → ${f.out.arr} ${f.out.to}</span><span class="t-sm c2">${f.back.d} ${f.back.dep} ${f.back.from} → ${f.back.arr} ${f.back.to}</span><span class="t-xs c3">${f.cls}, 성인 2명, ${f.bag}</span><span class="t-xs c3">판매자 ${f.air}</span></div><div class="pr"><span class="t-h3 num">${won(C.air)}</span>${src(f.src)}</div></div>
<div class="li" data-n="Item/Hotel">${ic('hotel', 20, 'c2')}<div class="grow g2"><span class="t-md w6">${h.name}</span><span class="t-sm c2">${REQ.range}, 3박, ${h.room} 1실</span><span class="t-sm c2">${h.grade}, ${h.area}, ${h.meal}</span><span class="t-xs c3">${h.cancel}</span><span class="t-xs c3">판매자 ${h.name}</span></div><div class="pr"><span class="t-h3 num">${won(h.price)}</span>${src(h.src)}</div></div>
</section>`;
// 여권 영문 이름 자리. 회원은 OO, 동반자도 특정 인물로 보이지 않게 기호로 둔다.
const PAX = [['OOO / OO', '본인', '1994.03.22, 여'], ['△△△ / △△', '동반 1', '1993.07.09, 남']];
const pax = () => `<section class="pnl" data-n="Travelers">
<div class="pnl-h jb"><div class="row g10"><h2 class="t-h3">탑승객 · 투숙객</h2><span class="t-sm c3">성인 2명</span></div>${btn('수정', { kind: 'txt', size: 'sm', n: 'EditTravelers' })}</div>
${PAX.map(([n, r, d], i) => `<div class="pax${i ? '' : ' first'}" data-n="Traveler"><span class="nm t-md w5">${n}</span><span class="t-sm c2 grow">${r}, ${d}</span>${st('ok', '여권 정보 입력됨')}</div>`).join('')}
</section>`;
const CHECKS = [
  ['1회 결제 한도', won(M.per), won(C.total), '충족'],
  ['월 누적 한도', won(M.month), `누적 ${won(C.total)}`, '충족'],
  ['허용 항목', M.scope, '항공권, 숙소', '충족'],
  ['유효기간', `${M.until}까지`, '2026.11.10 결제', '유효'],
  ['서명', `${U.name}, 기기 패스키`, '서명 검증 완료', '유효'],
];
const verify = () => `<section class="pnl" data-n="MandateCheck">
<div class="pnl-h jb"><div class="row g10">${ic('security', 20)}<h2 class="t-h3">결제 권한 검증</h2></div>${st('ok', '5개 항목 모두 통과')}</div>
<table class="vt" data-n="Checks">
<thead><tr><th scope="col">항목</th><th scope="col">권한 설정</th><th scope="col">이번 결제</th><th scope="col" class="tr">결과</th></tr></thead>
<tbody>${CHECKS.map(([a, b, c, d]) => `<tr data-n="Check/${a}"><th scope="row">${a}</th><td class="num" data-l="권한 설정">${b}</td><td class="num w5" data-l="이번 결제">${c}</td><td class="tr">${st('ok', d)}</td></tr>`).join('')}</tbody>
</table>
<div class="addon" data-n="Document"><span class="t-xs c3 grow">권한 증명서 ${M.id}, ${M.signed} 서명. ${M.method}</span><button type="button" class="tbtn t-xs w5 fn">권한 보기</button></div>
</section>`;
const terms = () => `<section class="pnl" data-n="Terms"><div class="pnl-b g10">
${chk('항공 운임 규정과 취소 · 환불 규정을 확인했습니다.', 1)}${chk('숙소 취소 규정을 확인했습니다.', 1)}${chk(`예약에 필요한 개인정보를 ${f.air}, ${h.name}에 제공하는 데 동의합니다.`, 1, { cls: 'top' })}
</div></section>`;
const payRail = () => `<aside class="two-r" data-n="Rail"><section class="pnl" data-n="Amount">
<div class="pnl-h"><h2 class="t-h3">결제 금액</h2></div>
<div class="pnl-b g12">
<div data-n="Lines">${C.lines.map((l, i) => `<div class="sl${i ? '' : ' first'}" data-n="Line"><span class="k">${l.k}</span><span class="t-sm grow">${l.t}</span><span class="t-sm num w5 fn">${won(l.p)}</span></div>`).join('')}</div>
<div class="hr"></div>
<div class="row jb"><span class="t-md w6">합계</span><span class="t-h2 num">${won(C.total)}</span></div>
<div class="g2" data-n="Method"><div class="row jb"><span class="t-sm c2">결제수단</span><span class="t-sm w5">${U.card}</span></div><div class="row jb"><span class="t-sm c2">할부</span><span class="t-sm">일시불</span></div></div>
${btn('패스키로 승인하고 결제', { kind: 'pri', size: 'lg', cls: 'fill', icon: 'fingerprint-recognition', isz: 20, href: '12-processing.html', n: 'Approve' })}
<span class="t-xs c3">승인 한 번으로 판매자 2곳에 차례로 결제합니다. 한 곳이라도 실패하면 전부 취소하고 결제 전 상태로 되돌립니다.</span>
</div></section></aside>`;
export const checkout = {
  id: '11-checkout', no: '11', name: '결제 확인 · 권한 검증', kind: 'page',
  note: '숙소 위치와 추천 장소까지 확인한 뒤 결제로 넘어온 화면. 서명해 둔 결제 권한(한도·항목·유효기간·서명)과 이번 결제를 항목별로 대조해 보여 주고, 패스키 승인 한 번으로 결제한다.',
  html: () => shell('11 결제 확인', '결제 확인', '결제 내용을 확인해 주세요', '서명해 둔 결제 권한과 이번 결제를 항목별로 대조했습니다. 패스키 승인 한 번으로 두 곳에 차례로 결제합니다.', `<div class="two"><div class="two-m" data-n="MainColumn">${items()}${pax()}${verify()}${terms()}</div>${payRail()}</div>`, 3),
};

/* ── 12 결제 진행 ── */
const cell = (label, tone, text, time) => `<td data-l="${label}" data-n="Stage/${label}"><span class="g2">${st(tone, text)}${time ? `<span class="t-xs c3 num">${time}</span>` : ''}</span></td>`;
const processing = () => `<section class="pnl" data-n="Progress">
<div class="pnl-h jb"><h2 class="t-h3">판매자별 진행 상황</h2><span class="t-sm c2" role="status">2곳 중 1곳 결제 완료</span></div>
<div class="pnl-b pnl-bar"><div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="58" aria-label="결제 진행" data-n="Bar"><i class="prog-58"></i></div></div>
<table class="vt pt-t" data-n="Merchants">
<thead><tr><th scope="col">판매자와 상품</th><th scope="col">확보</th><th scope="col">결제</th><th scope="col">확정</th><th scope="col" class="tr">금액</th></tr></thead>
<tbody>
<tr data-n="Merchant/Flight"><th scope="row"><span class="g2"><span class="t-md w6">${f.air}</span><span class="t-sm c2">항공권 ${f.out.no} / ${f.back.no}, 성인 2명</span></span></th>${cell('확보', 'ok', '좌석 확보', PAY.air.hold)}${cell('결제', 'ok', '결제 완료', PAY.air.pay)}${cell('확정', 'run', '발권 중', '')}<td class="tr t-md num w5">${won(C.air)}</td></tr>
<tr data-n="Merchant/Hotel"><th scope="row"><span class="g2"><span class="t-md w6">${h.name}</span><span class="t-sm c2">숙소 3박, ${h.room} 1실</span></span></th>${cell('확보', 'ok', '객실 확보', PAY.stay.hold)}${cell('결제', 'run', '결제 중', '')}${cell('확정', '', '대기', '')}<td class="tr t-md num w5">${won(h.price)}</td></tr>
</tbody></table>
</section>`;
export const paying = {
  id: '12-processing', no: '12', name: '결제 진행', kind: 'page',
  note: '판매자마다 확보 → 결제 → 확정 순서로 진행 상황을 보여 준다. 한 곳이라도 실패하면 전체를 취소하는 규칙을 화면에 적어 둔다.',
  html: () => shell('12 결제 진행', '결제 진행', '결제를 진행하고 있습니다', '', `<div class="two"><div class="two-m" data-n="MainColumn">${processing()}${note('두 판매자의 재고를 먼저 확보한 뒤 차례로 결제합니다. 한 곳이라도 실패하면 이미 결제된 건을 자동으로 취소하고 결제 전 상태로 되돌립니다. 이 화면을 닫아도 결제는 계속 진행됩니다.')}</div>
<aside class="two-r" data-n="Rail"><section class="pnl" data-n="Approval"><div class="pnl-h"><h2 class="t-h3">승인 기록</h2></div><div class="pnl-b pnl-kv">${kv('승인 금액', `<span class="num w5">${won(C.total)}</span>`, false)}${kv('승인 방식', '패스키 본인 확인')}${kv('승인 시각', `<span class="num">${PAY.approved}</span>`)}${kv('권한 증명서', M.id)}</div></section></aside></div>`, 3, 'data-auto="13-complete.html" data-auto-ms="5200"'),
};

/* ── 13 결제 완료 ── */
// 결제 요약 (13 결제 완료와 14 내 여행의 오른쪽 칸이 함께 쓴다)
export const paySummary = () => `<section class="pnl" data-n="Payment"><div class="pnl-h"><h2 class="t-h3">결제 요약</h2></div><div class="pnl-b pnl-kv">${kv('결제 금액', `<span class="t-h3 num">${won(C.total)}</span>`, false)}${kv('결제수단', `${U.card}<br><span class="t-sm c2">일시불</span>`)}${kv('결제 일시', `<span class="num">${PAY.at}</span>`)}${kv('주문번호', REQ.order)}</div></section>`;
export const DOCS = [['document--pdf', '결제 영수증', `주문번호 ${REQ.order}`], ['document', '항공권 e-티켓 확정서', `${f.air} 예약번호 ${PAY.air.no}`], ['document', '숙소 예약 확정서', `${h.name} 예약번호 ${PAY.stay.no}`]];
const complete = () => `<div class="two"><div class="two-m" data-n="MainColumn">
<section class="pnl" data-n="Result"><div class="done-h">${ic('checkmark--filled', 28, 'cok')}<div class="grow g4"><h2 class="t-h2">결제가 완료되었습니다</h2><p class="t-md c2">예약 2건이 모두 확정되었습니다. 주문번호 ${REQ.order}</p></div></div></section>
<section class="pnl" data-n="Email">
<div class="pnl-h jb"><div class="row g10">${ic('email', 20)}<h2 class="t-h3">이메일 발송</h2></div>${st('ok', '3건 발송 완료')}</div>
<div class="pnl-b g4"><p class="t-md">영수증과 예약 확정서를 <b>${U.mail}</b> 주소로 보냈습니다.</p><p class="t-sm c3">가입할 때 등록한 이메일입니다. 메일이 보이지 않으면 스팸함을 확인해 주세요.</p></div>
${DOCS.map(([i, t, s]) => `<div class="doc" data-n="Document/${t}">${ic(i, 20, 'c2')}<div class="grow g2"><span class="t-md w5">${t}</span><span class="t-xs c3">${s}</span></div><span class="t-xs c3 num fn">${PAY.mailed} 발송</span></div>`).join('')}
<div class="pnl-f" data-n="Actions"><span class="t-sm c3 dt-only">PDF는 내 여행 &gt; 문서함에서도 받을 수 있습니다.</span><div class="acts">${btn('메일 다시 보내기', { icon: 'email', n: 'Resend' })}${btn('PDF로 받기', { icon: 'download', n: 'Download' })}</div></div>
</section>
<section class="pnl" data-n="Bookings">
<div class="pnl-h jb"><h2 class="t-h3">예약 내역</h2><span class="t-sm c3">${REQ.range}, ${REQ.pax}</span></div>
<div class="li first" data-n="Booking/Flight">${ic('plane', 20, 'c2')}<div class="grow g2"><span class="t-md w6">${f.air} ${f.out.no} / ${f.back.no}</span><span class="t-sm c2">${f.out.d} ${f.out.dep} ${f.out.from} → ${f.out.to}</span><span class="t-sm c2">${f.back.d} ${f.back.dep} ${f.back.from} → ${f.back.to}</span><span class="t-xs c3">예약번호 ${PAY.air.no}, 발권 완료 ${PAY.air.done}</span></div><div class="pr"><span class="t-h3 num">${won(C.air)}</span>${st('ok', '확정')}</div></div>
<div class="li" data-n="Booking/Hotel">${ic('hotel', 20, 'c2')}<div class="grow g2"><span class="t-md w6">${h.name}</span><span class="t-sm c2">${REQ.range}, 3박, ${h.room} 1실</span><span class="t-sm c2">${h.area}</span><span class="t-xs c3">예약번호 ${PAY.stay.no}, 예약 확정 ${PAY.stay.done}</span></div><div class="pr"><span class="t-h3 num">${won(h.price)}</span>${st('ok', '확정')}</div></div>
</section>
</div>
<aside class="two-r" data-n="Rail">
${paySummary()}
<section class="pnl" data-n="Approval"><div class="pnl-h jb"><h2 class="t-h3">승인 기록</h2>${st('ok', '검증 유효')}</div><div class="pnl-b pnl-kv">${kv('권한 증명서', M.id, false)}${kv('승인', `패스키 본인 확인<br><span class="t-xs c3 num">${PAY.approved}</span>`)}${kv('승인 범위', `1회 ${won(M.per)} 이하<br>${M.scope}`)}<div class="kv line"><span class="t-xs c3 grow">이 기록은 변경할 수 없으며, 결제에 이의가 생기면 승인 범위의 근거로 쓰입니다.</span></div></div></section>
<div class="g8" data-n="Next">${btn('내 여행에서 일정 보기', { kind: 'pri', size: 'lg', cls: 'fill', href: '14-trips.html', n: 'Trips' })}${btn('새 검색', { size: 'lg', cls: 'fill', href: '05-home.html', n: 'NewSearch' })}</div>
</aside></div>`;
export const done = {
  id: '13-complete', no: '13', name: '결제 완료 · 이메일 발송 안내', kind: 'page',
  note: '결제 결과와 예약번호를 확인하는 화면. 영수증·e-티켓 확정서·숙소 예약 확정서가 가입 때 등록한 이메일로 발송됐음을 문서별로 표시한다.',
  html: () => shell('13 결제 완료', '결제 완료', '여행 준비가 끝났습니다', '', complete(), 5),
};
