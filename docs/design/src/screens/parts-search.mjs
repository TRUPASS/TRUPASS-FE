// 적어 둔 문장과, 그 문장에서 뽑아 검색에 적용한 조건을 한 줄씩 짝지어 보여 주는 표. 07–08 결과 화면이 쓴다.
// 대략 적은 말이 어떤 범위로 바뀌었는지(넓혀 잡은 날짜, 함께 찾은 공항)를 문장 바로 옆에서 확인할 수 있게 한다.
import { ic, tag } from '../lib/ui.mjs';
import { PROMPTS, APPLIED } from '../lib/data.mjs';

// 조건 묶음: [이름, 값, 표식]. 이름 칸의 폭을 맞춰 값이 같은 자리에서 시작한다.
const conds = pairs => `<dl class="rq-d">${pairs.map(([k, v, t]) => `<div class="rq-p" data-n="Cond"><dt>${k}</dt><dd><span>${v}</span>${t ? tag(t, t === '변경' ? 'y' : 'b') : ''}</dd></div>`).join('')}</dl>`;
// o.change: 수정 요청으로 바뀐 조건 { stay: [['위치', '우에노역 도보 5분 이내', '변경']] } — 같은 이름의 조건을 바꿔 끼운다.
export const requestPanel = (o = {}) => {
  const rows = PROMPTS.map(p => {
    const ch = (o.change || {})[p.k] || [];
    const pairs = APPLIED[p.k].map(c => ch.find(x => x[0] === c[0]) || c);
    return `<tr data-n="Row/${p.l}"><th scope="row"><span class="rq-l">${ic(p.icon, 16)}<span>${p.l.split(' · ')[0]}</span></span></th><td class="rq-s" data-prompt="${p.k}">${p.v}</td><td>${conds(pairs)}</td></tr>`;
  }).join('\n');
  return `<section class="pnl rq" data-n="Request"><table class="rq-t">
<thead><tr><th scope="col"><span class="vh">구분</span></th><th scope="col">적은 문장</th><th scope="col"><div class="row jb g12"><span>이렇게 찾았습니다</span>${o.edit === false ? '' : '<a class="lnk w5" href="05-home.html">문장 다시 적기</a>'}</div></th></tr></thead>
<tbody>
${rows}
</tbody></table>${o.edit === false ? '' : '<a class="lnk w5 t-sm rq-e m-only" href="05-home.html">문장 다시 적기</a>'}</section>`;
};
