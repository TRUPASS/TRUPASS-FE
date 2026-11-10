// 검색 입력과 그 요약. 01 랜딩 · 02 로그인 · 03 가입 · 05 새 검색 · 06 검색 중 · 07–08 결과가 함께 쓴다.
import { btn, sfield, src, tag } from '../lib/ui.mjs';
import { FIELDS, APPLIED, PRESETS, REQ } from '../lib/data.mjs';

// 칸으로 나눈 검색 입력. filled 면 고객이 적은 값이, 아니면 연한 예시가 보인다. focus 는 입력 중인 칸의 키.
export const sform = (o = {}) => {
  const f = k => sfield(FIELDS.find(x => x.k === k), { filled: o.filled, focus: o.focus === k });
  return `<div class="sform" data-n="SearchForm"><div class="f2" data-n="Row">${f('dest')}${f('when')}</div><div class="f2" data-n="Row">${f('stay')}${f('budget')}</div>${f('wish')}<div class="sform-f" data-n="Submit"><span class="hint grow">칸마다 문장으로 자유롭게 적어 주세요. 비워 둔 조건은 결과 화면의 수정 요청으로 덧붙일 수 있습니다.</span>${btn('통합 검색', { kind: 'pri', size: 'lg', icon: 'search', isz: 20, n: 'Search' })}</div></div>`;
};
export const presets = () => `<div class="egs" data-n="Presets"><span class="t-sm w6 fn">예시로 채우기</span>${PRESETS.map(t => `<a class="t-sm lnk">${t}</a>`).join('')}</div>`;

const HOW = [
  ['검색', '여행 장소, 출발 시기, 요청사항을 칸마다 자유롭게 적습니다.'],
  ['항공권 · 숙소 선택', '조건에 맞는 항공권을 여러 건 제안합니다. 항공권마다 예약할 수 있는 숙소 3곳을 펼쳐 함께 고릅니다.'],
  ['숙소 위치 · 추천 장소 확인', '지도에서 숙소 위치를 보고, 요청사항에 맞춘 장소와 활동을 후기 링크와 함께 확인합니다.'],
  ['결제', '미리 서명한 결제 권한의 한도와 항목 안에서 한 번에 결제하고, 확정서를 이메일로 받습니다.'],
];
export const how = () => `<div class="g10" data-n="How"><span class="t-sm w6 c1">이용 절차</span><div data-n="List">${HOW.map(([t, d], i) => `<div class="how" data-n="Step"><span class="no">${i + 1}</span><div class="grow g2"><span class="t-md w6">${t}</span><span class="t-sm c2">${d}</span></div></div>`).join('')}</div></div>`;
export const sources = () => `<div class="g10" data-n="Sources"><span class="t-xs c3">검색 출처</span><div class="srcs">${['haneul', 'airmoa', 'stayon', 'naru'].map(k => src(k, { link: false })).join('')}</div><span class="t-xs c3">장소와 후기는 Google 지도와 웹 검색 결과를 함께 조회합니다.</span></div>`;

// 입력한 검색 조건을 그대로 다시 보여 주는 목록 (로그인 모달 · 가입 화면)
export const reqList = () => `<div data-n="Conditions">${FIELDS.map(f => `<div class="rq-r" data-n="Row"><span class="k">${f.l}</span><span class="grow">${f.v}</span></div>`).join('')}</div>`;

// 조건 묶음: [이름, 값, 표식]
export const cond = (pairs, n = 'Conditions') => `<div class="cond" data-n="${n}">${pairs.map(([k, v, t]) => `<div class="c" data-n="Cond"><span class="k fn">${k}</span><span class="w5">${v}</span>${t ? tag(t, 'y') : ''}</div>`).join('')}</div>`;
// 입력한 조건과, 그 입력을 해석해 실제 검색에 적용한 조건을 나란히 보여 준다.
export const requestPanel = (o = {}) => `<section class="pnl" data-n="Request"><div class="pnl-b g12">
<div class="g6" data-n="Input"><div class="row jb g12"><span class="t-xs c3">입력한 조건 · ${REQ.at}</span>${o.edit === false ? '' : '<a class="t-sm lnk w5 fn">조건 수정</a>'}</div>${cond(FIELDS.map(f => [f.l, f.v]), 'InputList')}</div>
<div class="hr"></div>
<div class="g6" data-n="Applied"><span class="t-xs c3">AI가 해석해 검색에 적용한 조건</span>${cond([...APPLIED, ...(o.extra || [])], 'AppliedList')}</div>
</div></section>`;
