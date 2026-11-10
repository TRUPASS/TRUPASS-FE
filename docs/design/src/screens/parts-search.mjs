// 적어 둔 문장과, 그 문장을 해석해 검색에 적용한 조건을 나란히 보여 주는 패널. 07–08 결과 화면이 쓴다.
import { ic, tag } from '../lib/ui.mjs';
import { PROMPTS, APPLIED, REQ } from '../lib/data.mjs';

// 조건 묶음: [이름, 값, 표식]
export const cond = (pairs, n = 'Conditions') => `<div class="cond" data-n="${n}">${pairs.map(([k, v, t]) => `<div class="c" data-n="Cond"><span class="k fn">${k}</span><span class="w5">${v}</span>${t ? tag(t, 'y') : ''}</div>`).join('')}</div>`;
export const requestPanel = (o = {}) => `<section class="pnl rq" data-n="Request"><div class="pnl-b rq-2">
<div class="rq-c" data-n="Input"><div class="row jb g12"><span class="t-xs c3">적어 둔 문장 · ${REQ.at}</span>${o.edit === false ? '' : '<a class="t-sm lnk w5 fn" href="05-home.html">조건 수정</a>'}</div><div data-n="Prompts">${PROMPTS.map(p => `<div class="rq-r" data-n="Row/${p.l}">${ic(p.icon, 16, 'c3')}<span class="grow" data-prompt="${p.k}">${p.v}</span></div>`).join('')}</div></div>
<div class="vr dt-only"></div>
<div class="rq-c" data-n="Applied"><span class="t-xs c3">AI가 해석해 검색에 적용한 조건</span>${cond([...APPLIED, ...(o.extra || [])], 'AppliedList')}</div>
</div></section>`;
