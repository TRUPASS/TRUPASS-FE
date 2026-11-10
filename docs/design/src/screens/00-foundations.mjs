// 00 디자인 기준 — 색·글꼴·모서리·아이콘·컴포넌트와 화면 흐름을 한 장에 모은다. 색 값은 tokens.css 에서 읽는다.
import { readFileSync } from 'node:fs';
import { page, ic, mark, logo, btn, ibtn, inp, fld, chk, rad, opt, st, tag, note, steps, src, pbox, kv } from '../lib/ui.mjs';
import { ICONS } from '../lib/icons.mjs';

const css = readFileSync(new URL('../tokens.css', import.meta.url), 'utf8');
const TOK = Object.fromEntries([...css.matchAll(/--([a-z]+-\d+):\s*(#[0-9a-f]{6})/g)].map(m => [m[1], m[2]]));
const sw = k => `<div class="sw" data-n="Swatch/${k}"><div class="c" style="background:${TOK[k]}"></div><div class="g0"><span class="t-xs w5">${k}</span><span class="t-xs c3">${TOK[k].toUpperCase()}</span></div></div>`;
const ramp = (title, keys, desc) => `<div class="g8" data-n="Ramp/${title}"><div class="row g10"><span class="t-sm w6">${title}</span><span class="t-xs c3">${desc}</span></div><div class="sw-row">${keys.map(sw).join('')}</div></div>`;
const R = p => Object.keys(TOK).filter(k => k.startsWith(p + '-'));
const SEM = [['canvas', 'n-50', '페이지 바탕'], ['surface', 'n-0', '패널 · 입력'], ['line', 'n-200', '기본 선'], ['line-strong', 'n-300', '입력 테두리'], ['tx', 'n-900', '본문'], ['tx-2', 'n-600', '보조 글'], ['tx-3', 'n-500', '설명 · 캡션'], ['brand', 'b-600', '주 버튼 · 링크 · 선택'], ['brand-tint', 'b-50', '선택된 행'], ['ok', 'g-700', '완료 · 충족'], ['warn', 'y-700', '주의 · 변경'], ['bad', 'r-700', '실패 · 오류']];
const TYPE = [['t-display', 'Display', '36 / 50 · 600', '여행 조건을 입력하면'], ['t-h1', 'Heading 1', '24 / 34 · 600', '조합 결과'], ['t-h2', 'Heading 2', '18 / 28 · 600', '결제가 완료되었습니다'], ['t-h3', 'Heading 3', '16 / 24 · 600', '선택한 조합 · 1,064,400원'], ['t-lg', 'Body L', '16 / 26 · 400', '목적지, 일정, 인원, 예산을 문장으로 입력해 주세요.'], ['t-md', 'Body M', '14 / 22 · 400', '항공권과 숙소 조합, 숙소 위치와 주변 장소를 확인합니다.'], ['t-sm', 'Body S', '13 / 20 · 400', '4성급 · 시부야역 도보 6분'], ['t-xs', 'Caption', '12 / 18 · 400', '요금 조회 2026.11.10 14:02']];
const RULES = [
  ['프레임워크 기본 팔레트(파랑 #1D4ED8 등)', 'OKLCH에서 직접 뽑은 중립·브랜드 램프. 강조색은 한 가지'],
  ['둥근 알약 배지, 아이콘을 넣은 색 타일', '상태는 점+글자, 구분은 2px 모서리 표식'],
  ['카드 반경 12~16px, 넓은 그림자', '컨트롤 4 · 패널 6 · 모달 8, 그림자는 떠 있는 요소만'],
  ['장식용 고정폭 글꼴, 대문자 자간 라벨', 'IBM Plex Sans KR 한 벌, 숫자는 tabular'],
  ['보딩패스 모양 카드, 가짜 창 프레임', '선택표(행+라디오)와 실제 화면 캡처'],
  ['구호처럼 쓴 문구', '~합니다 체의 기능 문구, 숫자·날짜·출처를 그대로 표기'],
];

export const foundations = screens => ({
  id: '00-foundations', no: '00', name: '디자인 기준', kind: 'page', bps: ['d'],
  note: '색·글꼴·모서리·아이콘·컴포넌트 기준과 화면 흐름.',
  html: () => page({ title: '00 디자인 기준', cls: 'pg-white', body: `<main class="fd" data-n="Foundations">
<div class="g8" data-n="Title"><h1 class="t-display">Trupass 디자인 기준</h1><p class="t-lg c2">여행 요청 → 조합 → 결제 권한 내 결제. 2026.11 정리본. 화면 소스는 docs/design 에 있습니다.</p></div>

<section class="fd-sec" data-n="Logo"><div class="fd-h"><h2 class="t-h2">로고</h2><span class="t-sm c3">승인 체크의 긴 획이 이륙 방향으로 이어진다. 워드마크는 한 가지 색으로 쓴다.</span></div>
<div class="row g16 wrap"><div class="logo-t row g24">${mark(64)}${mark(40)}${mark(24)}${mark(16)}</div><div class="logo-t">${logo(32)}</div><div class="logo-t" style="background:${TOK['b-900']};border-color:${TOK['b-900']}"><a class="logo">${mark(32, '#ffffff', TOK['b-700'])}<span class="wm" style="color:#fff">Trupass</span></a></div><div class="logo-t" style="background:${TOK['n-900']};border-color:${TOK['n-900']}"><a class="logo">${mark(32, '#ffffff', TOK['n-900'])}<span class="wm" style="color:#fff">Trupass</span></a></div></div></section>

<section class="fd-sec" data-n="Color"><div class="fd-h"><h2 class="t-h2">색</h2><span class="t-sm c3">중립 한 벌 + 브랜드 한 벌. 상태색은 글자와 점에만 쓴다.</span></div>
${ramp('Neutral', R('n'), 'hue 258 · 화면의 대부분')}${ramp('Brand', R('b'), 'hue 262 · 주 버튼, 링크, 선택 상태')}
<div class="fd-row">${ramp('Success', R('g'), '완료 · 충족')}${ramp('Warning', R('y'), '주의 · 변경')}${ramp('Danger', R('r'), '실패 · 오류')}</div>
<div class="g8" data-n="Semantic"><span class="t-sm w6">쓰임새</span><div class="sw-row">${SEM.map(([n, k, d]) => `<div class="sw" style="width:140px" data-n="Semantic/${n}"><div class="c" style="background:${TOK[k]}"></div><div class="g0"><span class="t-xs w5">${n}</span><span class="t-xs c3">${k} · ${d}</span></div></div>`).join('')}</div></div></section>

<section class="fd-sec" data-n="Type"><div class="fd-h"><h2 class="t-h2">글꼴</h2><span class="t-sm c3">IBM Plex Sans KR · 400 / 500 / 600 · 크기 / 줄 높이 · 굵기</span></div>
<div data-n="Scale">${TYPE.map(([c, n, m, t]) => `<div class="ty" data-n="Type/${n}"><div class="m g0"><span class="t-sm w5">${n}</span><span class="t-xs c3 num">${m}</span></div><span class="${c} grow">${t}</span></div>`).join('')}</div></section>

<section class="fd-sec" data-n="Shape"><div class="fd-h"><h2 class="t-h2">모서리 · 간격 · 그림자</h2><span class="t-sm c3">간격은 4의 배수</span></div>
<div class="fd-row"><div class="fd-col"><span class="t-sm w6">모서리</span><div class="spec">${[[2, '표식 · 체크'], [4, '버튼 · 입력'], [6, '패널'], [8, '모달']].map(([r, l]) => `<div class="g4"><div class="rd" style="border-radius:${r}px">${r}</div><span class="t-xs c3">${l}</span></div>`).join('')}</div></div>
<div class="fd-col"><span class="t-sm w6">간격</span><div class="g6">${[4, 8, 12, 16, 20, 24, 32, 48].map(n => `<div class="sp"><span class="t-xs c3 num" style="width:20px">${n}</span><i style="width:${n * 3}px"></i></div>`).join('')}</div></div>
<div class="fd-col"><span class="t-sm w6">그림자</span><div class="spec"><div class="g4"><div class="rd" style="width:120px;border-radius:6px;background:#fff;box-shadow:0 2px 8px rgba(18,22,29,.10)">e1</div><span class="t-xs c3">팝오버 · 지도 핀</span></div><div class="g4"><div class="rd" style="width:120px;border-radius:8px;background:#fff;box-shadow:0 16px 40px rgba(18,22,29,.18)">e2</div><span class="t-xs c3">모달</span></div></div></div></div></section>

<section class="fd-sec" data-n="Icons"><div class="fd-h"><h2 class="t-h2">아이콘</h2><span class="t-sm c3">IBM Carbon Icons (Apache-2.0) · 32 그리드를 16 / 20 / 24로 축소해 쓴다</span></div>
<div class="ics">${Object.keys(ICONS).slice(0, 60).map(n => `<div class="ici" data-n="Icon/${n}">${ic(n, 20)}<span class="t-xs c3">${n.length > 13 ? n.slice(0, 12) + '…' : n}</span></div>`).join('')}</div></section>

<section class="fd-sec" data-n="Components"><div class="fd-h"><h2 class="t-h2">컴포넌트</h2><span class="t-sm c3">상태는 면적이 아니라 테두리 · 굵기 · 작은 표식으로 구분한다</span></div>
<div class="fd-row">
<div class="fd-col" data-n="Buttons"><span class="t-sm w6">버튼</span><div class="spec">${btn('조합 요청', { kind: 'pri', size: 'lg', after: 'arrow--right' })}${btn('가입 완료', { kind: 'pri' })}${btn('다시 조합', { after: 'renew' })}${btn('수정', { kind: 'txt' })}${btn('조합 요청', { cls: 'dis' })}${btn('닫기', { size: 'sm' })}${ibtn('chevron--left')}${ibtn('chevron--right')}${ibtn('close', { kind: 'txt n' })}</div>
<span class="t-sm w6">선택</span><div class="spec">${chk('다시 보지 않기', 0)}${chk('약관 전체 동의', 1)}${rad('1년', 1)}${rad('6개월', 0)}</div><div class="spec">${opt('문화 · 예술', 1)}${opt('쇼핑', 0)}</div>
<span class="t-sm w6">상태 · 표식</span><div class="spec">${st('ok', '결제 완료')}${st('run', '결제 중')}${st('warn', '미등록')}${st('bad', '결제 실패')}${st('', '대기')}${tag('추천', 'b')}${tag('변경', 'y')}${tag('확정', 'g')}${tag('환불 불가')}</div>
<span class="t-sm w6">단계 · 출처</span><div class="spec">${steps(1)}</div><div class="spec">${src('haneul')}${src('airmoa')}${src('stayon')}${src('naru')}</div></div>
<div class="fd-col" data-n="Inputs"><span class="t-sm w6">입력</span>${fld('닉네임', inp('지안', { focus: 1 }), { hint: '2~12자. 화면과 알림에 표시됩니다.' })}${fld('이메일', inp('jian.seo@example.com', { ro: 1 }), { hint: '읽기 전용' })}${fld('출생 연도', inp('선택해 주세요', { ph: 1, after: ic('chevron--down', 16) }))}
<span class="t-sm w6">요청 입력 상자</span>${pbox({ sm: 1, ph: '예) 숙소를 우에노 미술관 근처로 바꿔 주세요', cta: '다시 조합', ckind: '', cicon: 'renew', max: 300 })}
<span class="t-sm w6">안내 상자</span>${note('요금은 결제 직전에 한 번 더 조회합니다.')}${note('수정 요청을 반영해 조합을 다시 만들었습니다.', 'b', 'renew')}</div>
</div></section>

<section class="fd-sec" data-n="Flow"><div class="fd-h"><h2 class="t-h2">화면 흐름</h2><span class="t-sm c3">번호 순서대로 진행한다 · 데스크톱 1440 / 태블릿 834 / 모바일 390</span></div>
<div data-n="List">${screens.map(s => `<div class="fl" data-n="Flow/${s.no}"><span class="n num">${s.no}</span><span class="t">${s.name}</span><span class="grow c2">${s.note}</span></div>`).join('')}</div></section>

<section class="fd-sec" data-n="Rules"><div class="fd-h"><h2 class="t-h2">이번에 걷어낸 것과 대신 쓴 것</h2></div>
<div data-n="List"><div class="rule"><span class="a t-xs">이전 시안</span><span class="b t-xs c3">이번 기준</span></div>${RULES.map(([a, b]) => `<div class="rule" data-n="Rule"><span class="a del">${a}</span><span class="b">${b}</span></div>`).join('')}</div></section>
</main>` }),
});
