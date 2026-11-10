// 06 통합 검색 중 — 입력을 어떻게 해석했고 지금 무엇을 찾고 있는지 단계별로 보여 준다.
import { page, header, footer, btn, ic, steps, st } from '../lib/ui.mjs';
import { requestPanel } from './parts-search.mjs';

const ROWS = [
  ['done', '입력 해석', '칸에 적은 문장을 출발일 범위 · 시간대 · 예산 · 장소 기준 등 6개 조건으로 바꿨습니다.', '완료'],
  ['done', '항공권 검색', '하늘길 14건 · 에어모아 9건에서 조건에 맞는 4건을 골랐습니다.', '완료'],
  ['run', '숙소 검색', '항공권 4건의 일정마다 3곳씩 찾습니다. 호텔나루 완료 · 스테이온 조회 중', '진행 중'],
  ['wait', '장소 · 후기 검색', '숙소가 정해지면 지도와 후기 검색을 시작합니다.', '대기'],
  ['wait', '결과 정리', '요청에 가까운 순서로 정리합니다.', '대기'],
];
const row = ([s, t, d, l]) => `<div class="gr${s === 'wait' ? ' wait' : ''}" data-n="Row">${ic(s === 'done' ? 'checkmark--filled' : s === 'run' ? 'in-progress' : 'circle-dash', 20, s === 'done' ? 'cok' : s === 'run' ? 'cb' : 'c3')}<span class="ti">${t}</span><span class="de grow ${s === 'wait' ? 'c3' : 'c2'}">${d}</span>${st(s === 'done' ? 'ok' : s === 'run' ? 'run' : '', l)}</div>`;

export default {
  id: '06-searching', no: '06', name: '통합 검색 중', kind: 'page',
  note: '항공권 · 숙소 · 여행 장소를 한 번에 찾는 검색의 진행 화면. 대략 적은 입력("전후 3일", "아침 출발")을 어떤 조건으로 해석했는지 먼저 보여 주고, 조회 중인 출처와 단계를 그대로 적는다. 화면을 닫아도 검색은 계속되고 끝나면 알림이 온다.',
  html: () => page({ title: '06 통합 검색 중', body: `${header({ kind: 'in', on: '새 검색' })}
<main class="main" data-n="Main"><div class="cx w760 g20" data-n="Content">
<div class="g8" data-n="Title"><div class="pt"><h1 class="t-h1">검색하고 있습니다</h1>${steps(0)}</div><p class="t-md c2">항공권 · 숙소 · 여행 장소를 한 번에 찾는 중입니다.</p></div>
${requestPanel({ edit: false })}
<div class="pnl" data-n="Progress">
  <div class="pnl-h jb"><span class="t-h3">진행 상황</span><span class="t-sm c2 num">5단계 중 3단계</span></div>
  <div class="pnl-b g0" style="padding-top:16px;padding-bottom:16px"><div class="prog" data-n="Bar"><i style="width:50%"></i></div></div>
  ${ROWS.map(row).join('')}
</div>
<div class="row jb g16" data-n="Footer"><p class="t-sm c3 grow">검색에는 보통 20~40초가 걸립니다. 이 화면을 닫아도 검색은 계속되며, 끝나면 알림으로 알려 드립니다.</p>${btn('검색 취소', { n: 'Cancel' })}</div>
</div></main>
${footer()}` }),
};
