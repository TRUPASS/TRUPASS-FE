// 01 랜딩 — 스크롤 없이 첫 화면에서 요청을 입력한다. 05 새 요청(로그인 후)도 같은 틀을 쓴다.
import { header, footer, pbox, btn, ic, page, src } from '../lib/ui.mjs';
import { EXAMPLES, REQ } from '../lib/data.mjs';

const HOW = [
  ['요청 입력', '목적지, 일정, 인원, 예산을 문장으로 적습니다.'],
  ['조합 확인', '항공권과 숙소 조합, 숙소 위치와 주변 장소를 확인하고 필요하면 수정합니다.'],
  ['결제 승인', '미리 서명한 결제 권한의 한도와 항목 안에서 한 번에 결제합니다.'],
  ['확정서 수신', '영수증과 예약 확정서를 등록한 이메일로 받습니다.'],
];
export const how = () => `<div class="g10" data-n="How"><span class="t-sm w6 c1">이용 절차</span><div data-n="List">${HOW.map(([t, d], i) => `<div class="how" data-n="Step"><span class="no">${i + 1}</span><div class="grow g2"><span class="t-md w6">${t}</span><span class="t-sm c2">${d}</span></div></div>`).join('')}</div></div>`;
export const sources = () => `<div class="g12" data-n="Sources"><span class="t-xs c3">요금 조회 출처</span><div class="srcs">${['haneul', 'airmoa', 'stayon', 'naru'].map(k => src(k, { link: false })).join('')}</div></div>`;
export const examples = () => `<div class="g8" data-n="Examples"><span class="t-sm w6 c1">요청 예시</span><div data-n="List">${EXAMPLES.map(t => `<div class="eg" data-n="Example"><span class="t-md c2 grow">${t}</span><a class="t-sm lnk w5 fn">입력</a></div>`).join('')}</div></div>`;

export const landingBody = (o = {}) => `${header()}
<main class="land" data-n="Main"><div class="land-in" data-n="Content">
<section class="land-l" data-n="Request">
  <div class="g12" data-n="Heading"><h1 class="t-display">여행 조건을 입력하면<br>항공권과 숙소를 조합해 드립니다</h1><p class="t-lg c2">여러 예약 사이트의 요금을 한 번에 조회해 조합안을 만들고, 미리 서명해 둔 결제 권한 범위 안에서만 결제합니다.</p></div>
  <div class="g8" data-n="RequestField"><span class="t-sm w6">여행 요청</span>${pbox({ text: o.text, focus: o.focus, count: o.text ? o.count : 0, ph: '예) ' + REQ.text, hint: '목적지 · 일정 · 인원 · 예산을 함께 적으면 조합이 정확해집니다.' })}</div>
  ${examples()}
</section>
<aside class="land-r" data-n="Guide">${how()}${sources()}</aside>
</div></main>
${footer()}`;

export default {
  id: '01-landing', no: '01', name: '랜딩 · 요청 입력', kind: 'page',
  note: '비로그인 첫 화면. 스크롤 없이 요청 입력 상자가 보인다. [조합 요청]을 누르면 02 로그인으로 이어진다.',
  html: () => page({ title: '01 랜딩 · 요청 입력', cls: 'pg-white', body: landingBody() }),
};
