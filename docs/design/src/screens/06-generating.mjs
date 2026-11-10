// 06 조합 생성 중 — 어떤 출처를 조회하고 있는지 단계별로 보여 준다.
import { page, header, footer, btn, ic, steps, st } from '../lib/ui.mjs';
import { REQ } from '../lib/data.mjs';
import { won } from '../lib/ui.mjs';

export const cond = () => `<div class="cond" data-n="Conditions">${[['목적지', REQ.dest], ['일정', `${REQ.range} · ${REQ.nights}`], ['인원', REQ.pax], ['예산', won(REQ.budget)], ['선호', REQ.prefs]].map(([k, v]) => `<div class="c" data-n="Cond"><span class="k">${k}</span><span class="w5">${v}</span></div>`).join('')}</div>`;
const ROWS = [
  ['done', '요청 분석', '목적지 · 일정 · 인원 · 예산 · 선호 조건 5개를 확인했습니다.', '완료'],
  ['done', '항공권 조회', '하늘길 14건 · 에어모아 9건', '완료'],
  ['run', '숙소 조회', '호텔나루 11건 완료 · 스테이온 조회 중', '진행 중'],
  ['wait', '주변 장소 조회', '숙소 후보가 정해지면 시작합니다.', '대기'],
  ['wait', '조합 계산', '예산과 선호 조건에 맞는 조합을 고릅니다.', '대기'],
];
const row = ([s, t, d, l]) => `<div class="gr${s === 'wait' ? ' wait' : ''}" data-n="Row">${ic(s === 'done' ? 'checkmark--filled' : s === 'run' ? 'in-progress' : 'circle-dash', 20, s === 'done' ? 'cok' : s === 'run' ? 'cb' : 'c3')}<span class="ti">${t}</span><span class="de grow ${s === 'wait' ? 'c3' : 'c2'}">${d}</span>${st(s === 'done' ? 'ok' : s === 'run' ? 'run' : '', l)}</div>`;

export default {
  id: '06-generating', no: '06', name: '조합 생성 중', kind: 'page',
  note: '조회 중인 출처와 단계를 그대로 보여 준다. 화면을 닫아도 조회는 계속되고 끝나면 알림이 온다.',
  html: () => page({ title: '06 조합 생성 중', body: `${header({ kind: 'in', on: '새 요청' })}
<main class="main" data-n="Main"><div class="cx w760 g20" data-n="Content">
<div class="pt" data-n="Title"><h1 class="t-h1">조합안을 만들고 있습니다</h1>${steps(1)}</div>
<div class="pnl" data-n="Request"><div class="pnl-b g12"><div class="g4"><span class="t-xs c3">요청</span><p class="t-md">${REQ.text}</p></div><div class="hr"></div>${cond()}</div></div>
<div class="pnl" data-n="Progress">
  <div class="pnl-h jb"><span class="t-h3">진행 상황</span><span class="t-sm c2 num">5단계 중 3단계</span></div>
  <div class="pnl-b g0" style="padding-top:16px;padding-bottom:16px"><div class="prog" data-n="Bar"><i style="width:50%"></i></div></div>
  ${ROWS.map(row).join('')}
</div>
<div class="row jb g16" data-n="Footer"><p class="t-sm c3 grow">조회에는 보통 20~40초가 걸립니다. 이 화면을 닫아도 조회는 계속되며, 끝나면 알림으로 알려 드립니다.</p>${btn('요청 취소', { n: 'Cancel' })}</div>
</div></main>
${footer()}` }),
};
