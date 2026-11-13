// 00 디자인 기준 — 색 · 글꼴 · 모서리 · 아이콘 · 컴포넌트 · 움직임과 화면 흐름을 한 장에 모은다. 색 값은 tokens.css 에서 읽는다.
import { readFileSync } from 'node:fs';
import { page, ic, mark, logo, btn, ibtn, inp, fld, chk, rad, opt, st, tag, note, steps, src, dock, ask, chips } from '../lib/ui.mjs';
import { PROMPTS, REV } from '../lib/data.mjs';
import { ICONS } from '../lib/icons.mjs';

const css = readFileSync(new URL('../tokens.css', import.meta.url), 'utf8');
const TOK = Object.fromEntries([...css.matchAll(/--([a-z]+-\d+):\s*(#[0-9a-f]{6})/g)].map(m => [m[1], m[2]]));
const sw = k => `<div class="sw" data-n="Swatch/${k}"><div class="c" style="background:${TOK[k]}"></div><div class="g0"><span class="t-xs w5">${k}</span><span class="t-xs c3">${TOK[k].toUpperCase()}</span></div></div>`;
const ramp = (title, keys, desc) => `<div class="g8" data-n="Ramp/${title}"><div class="row g10"><span class="t-sm w6">${title}</span><span class="t-xs c3">${desc}</span></div><div class="sw-row">${keys.map(sw).join('')}</div></div>`;
const R = p => Object.keys(TOK).filter(k => k.startsWith(p + '-'));
const SEM = [['canvas', 'n-0', '페이지 바탕(흰색)'], ['surface-sub', 'n-50', '옅은 면'],['tx', 'n-900', '본문 · 제목(인디고)'], ['tx-2', 'n-600', '보조 글'], ['tx-3', 'n-500', '설명 · 캡션'], ['edge', 'n-450', '입력 칸 테두리'], ['brand', 'n-900', '주 버튼 · 선택'], ['sky', 'b-500', '강조(하늘색)'], ['sky-ink', 'b-600', '하늘색 글자 · 링크'], ['brand-tint', 'b-50', '선택된 줄'], ['ok', 'g-700', '완료 · 충족'], ['warn', 'y-700', '주의 · 변경'], ['bad', 'r-700', '실패 · 오류']];
const TYPE = [['t-display', 'Display', '56 / 66 · 300', '다섯 걸음이면 여행이 정해집니다'], ['t-h1', 'Heading 1', '34 / 44 · 300', '항공권 3건을 찾았습니다'], ['t-h2', 'Heading 2', '22 / 32 · 500', '결제가 완료되었습니다'], ['t-h3', 'Heading 3', '17 / 26 · 600', '선택한 조합 · 909,000원'], ['t-lg', 'Body L', '17 / 28 · 400', '항공 · 숙소 · 하고 싶은 것을 평소 말하듯 적습니다.'], ['t-md', 'Body M', '15 / 24 · 400', '항공권 줄을 펼쳐 추천 숙소 3곳을 함께 고를 수 있습니다.'], ['t-sm', 'Body S', '13 / 20 · 400', '3성급, 우에노역 도보 3분'], ['t-xs', 'Caption', '12 / 18 · 400', '요금 조회 2026.11.10 14:02']];
const MOTION = [
  ['하늘 → 소개', '화면 높이의 3.4배(340svh) 동안 고정. 하늘 1→1.26배, 구름 바다 1→1.72배, 아래에서 흰 구름층이 올라온다. 진행 30%부터 워드마크와 소개 문장이 14% 구간에 걸쳐 떠오른다.'],
  ['숫자', '화면 높이의 2.5배(250svh) 동안 고정. 하늘의 흐림 14px→0, 숫자는 스크롤에 맞춰 0에서 목표값까지 센다(줄마다 7%씩 늦게 시작).'],
  ['이용 방법', '가운데 상자를 좌우 버튼 · 방향키 · 밀기로 넘긴다. 글과 그림이 56px 옆에서 0.65초 동안 들어온다. 마지막 장에 닿으면 아래로 스크롤 권유가 나타난다.'],
  ['항공 · 숙소 · 체험', '화면 높이의 6.4배(640svh) 동안 고정. 앞 16%에서 작은 창(300×360, 모서리 84)이 화면 가득 커지고, 이어서 구간마다 다음 사진이 아래에서 올라오며 질문이 바뀐다. 엔터를 누르면 다음 질문으로 부드럽게 스크롤한다.'],
  ['로그인 진입', '넘어가기 직전 0.6초 동안 구름이 위아래에서 모여 화면을 덮고, 도착한 화면에서는 1.3초 동안 위아래로 갈라지며 걷힌다. 그동안 하늘 창이 1.1→1배로 당겨지고 내용이 0.09초 간격으로 떠오른다.'],
  ['검색 중', '지구본이 1.9초 동안 두 나라 쪽으로 돌아 들어온다 → 비행기가 2.3초 주기로 호를 그리며 난다 → 1.3초 동안 도착 국가로 당겨 들어가 호텔이 3.4초 주기로 지어진다.'],
  ['검색 결과', '항공권 줄과 펼친 숙소는 아래 26px에서 0.7초 동안 떠오르며 0.32초 간격으로 하나씩 나타난다.'],
  ['공통', '가속 곡선 cubic-bezier(.2, .8, .2, 1). 움직임 줄이기를 켠 기기에서는 전환과 반복 움직임을 모두 끄고 최종 상태만 보여 준다. 스크립트가 꺼져 있으면 스크롤 연출 없이 같은 내용이 위에서 아래로 그대로 보인다. 키보드 초점 표시는 전환 없이 바로 나타난다.'],
];
const DOCK_RULES = [
  ['놓이는 자리', '화면 아래 가장자리에 고정. 데스크톱은 본문 칸 폭(오른쪽 요약 칸 제외), 태블릿 · 모바일은 화면 폭 전체이며 합계 바 바로 위에 붙는다.'],
  ['내림 (기본)', '머리줄 한 줄만 보인다. 연한 예시 문장으로 입력 창임을 알린다.'],
  ['올라오는 때', '머리줄(버튼)을 누르거나(키보드는 Enter · Space) 독에 마우스를 올렸을 때. 누르면 입력 칸에 커서가 간다. 220ms'],
  ['내려가는 때', '입력이 비어 있고 포인터와 포커스가 모두 벗어난 채 4초가 지났을 때. 빈 채로 머리줄을 다시 누르거나 Esc 를 눌러도 내려간다. 200ms'],
  ['보낸 뒤', '엔터 또는 [다시 검색]을 누르면 새 결과(v2)로 넘어가고, 독은 비워진 채 내려간다.'],
];
const RULES = [
  ['회색 바탕 위 각진 패널과 2~6px 모서리', '흰 바탕, 모서리 14 · 24 · 28과 알약형 버튼'],
  ['굵은 제목(600)과 촘촘한 표', '큰 글자는 가늘게(300). 견주어 보는 자료는 가는 선으로 나눈 표로, 나머지는 넉넉한 여백으로'],
  ['첫 화면 오른쪽의 이용 절차 · 검색 출처 상자', '이용 절차는 좌우로 넘기는 상자로, 검색 출처는 푸터로'],
  ['칸 다섯 개로 나눈 검색 폼', '항공 · 숙소 · 체험 문장 세 개. 화면 가운데 한 줄 입력'],
  ['단계 목록으로 보여 주던 검색 진행', '지구본 위 비행기와 지어지는 호텔'],
  ['한꺼번에 뜨던 결과 표', '한 줄씩 떠오르는 항공권 표와 줄 아래에 펼치는 숙소 3곳'],
];

export const foundations = screens => ({
  id: '00-foundations', no: '00', name: '디자인 기준', kind: 'page', bps: ['d'],
  note: '색 · 글꼴 · 모서리 · 아이콘 · 컴포넌트 · 움직임 기준과 화면 흐름.',
  html: () => page({ title: '00 디자인 기준', body: `<main class="fd" data-n="Foundations">
<div class="g10" data-n="Title"><h1 class="t-display">하늘 · 흰색 · 인디고</h1><p class="t-lg c2 mw720">Trupass 디자인 기준 3차, 2026.11 정리본. 흰 바탕에 깊은 인디고 글자, 강조는 하늘색 한 가지. 색은 사진과 하늘이 맡고, 화면은 넉넉한 모서리와 가는 큰 글자로 부드럽게 정리한다. 화면 소스는 docs/design 에 있다.</p></div>

<section class="fd-sec" data-n="Logo"><div class="fd-h"><h2 class="t-h2">로고</h2><span class="t-sm c3">탑승권을 가로지른 길이 화살표로 이어진다. 흰 바탕에서는 남색과 하늘색 두 색, 남색 면에서는 흰색과 하늘색, 사진과 색 면 위에서는 흰색 한 가지로 쓴다. 끝의 가는 글자는 랜딩 첫 화면의 제목에만 쓴다.</span></div>
<div class="row g16 wrap"><div class="logo-t">${logo(40, { href: '#' })}</div><div class="logo-t on-ink">${logo(32, { inv: 'duo', href: '#' })}</div><div class="logo-t on-sky">${logo(32, { inv: 1, href: '#' })}</div></div>
<div class="row g16 wrap"><div class="logo-t row g24">${mark(64)}${mark(40)}${mark(24)}${mark(16)}</div><div class="logo-t wmk"><span class="wm-b">TRUPASS</span><span class="wm-s">AI Travel Search</span></div></div></section>

<section class="fd-sec" data-n="Color"><div class="fd-h"><h2 class="t-h2">색</h2><span class="t-sm c3">흰색에서 인디고로 이어지는 중립 한 벌(누런 기 없이 인디고 쪽 톤) + 하늘색 한 벌. 상태색은 글자에만 쓴다. 색 값은 전부 tokens.css 의 토큰 블록에 둔다.</span></div>
${ramp('Neutral', R('n'), '흰색 → 인디고 · 화면의 대부분')}${ramp('Sky', R('b'), '강조 · 링크 · 선택 상태')}
<div class="fd-row">${ramp('Success', R('g'), '완료 · 충족')}${ramp('Warning', R('y'), '주의 · 변경')}${ramp('Danger', R('r'), '실패 · 오류')}</div>
<div class="g8" data-n="Semantic"><span class="t-sm w6">쓰임새</span><div class="sw-row">${SEM.map(([n, k, d]) => `<div class="sw" style="width:150px" data-n="Semantic/${n}"><div class="c" style="background:${TOK[k]}"></div><div class="g0"><span class="t-xs w5">${n}</span><span class="t-xs c3">${k} · ${d}</span></div></div>`).join('')}</div></div></section>

<section class="fd-sec" data-n="Type"><div class="fd-h"><h2 class="t-h2">글꼴</h2><span class="t-sm c3">라틴 · 숫자 Outfit, 한글 Gothic A1 (둘 다 SIL OFL). 큰 글자는 300, 본문은 400 · 크기 / 줄 높이 · 굵기</span></div>
<div data-n="Scale">${TYPE.map(([c, n, m, t]) => `<div class="ty" data-n="Type/${n}"><div class="m g0"><span class="t-sm w5">${n}</span><span class="t-xs c3 num">${m}</span></div><span class="${c} grow">${t}</span></div>`).join('')}</div></section>

<section class="fd-sec" data-n="Shape"><div class="fd-h"><h2 class="t-h2">모서리 · 간격 · 그림자</h2><span class="t-sm c3">간격은 4의 배수. 사진을 담는 창은 화면 가장자리에서 16(태블릿 12 · 모바일 8) 띄운다.</span></div>
<div class="fd-row"><div class="fd-col"><span class="t-sm w6">모서리</span><div class="spec">${[[6, '체크'], [14, '입력'], [24, '카드'], [28, '창'], [999, '버튼 · 표식']].map(([r, l]) => `<div class="g4"><div class="rd" style="border-radius:${Math.min(r, 24)}px">${r === 999 ? '알약' : r}</div><span class="t-xs c3">${l}</span></div>`).join('')}</div></div>
<div class="fd-col"><span class="t-sm w6">간격</span><div class="g6">${[4, 8, 12, 16, 24, 32, 48, 72].map(n => `<div class="spc"><span class="t-xs c3 num">${n}</span><i style="width:${n * 3}px"></i></div>`).join('')}</div></div>
<div class="fd-col"><span class="t-sm w6">그림자</span><div class="spec"><div class="g4"><div class="rd sh-1">e1</div><span class="t-xs c2">카드 · 지도 핀</span></div><div class="g4"><div class="rd sh-2">e2</div><span class="t-xs c2">떠 있는 입력 상자</span></div></div></div></div></section>

<section class="fd-sec" data-n="Icons"><div class="fd-h"><h2 class="t-h2">아이콘</h2><span class="t-sm c3">IBM Carbon Icons (Apache-2.0) · 32 그리드를 16 / 20 / 24로 축소해 쓴다</span></div>
<div class="ics">${Object.keys(ICONS).slice(0, 60).map(n => `<div class="ici" data-n="Icon/${n}">${ic(n, 20)}<span class="t-xs c3">${n.length > 13 ? n.slice(0, 12) + '…' : n}</span></div>`).join('')}</div></section>

<section class="fd-sec" data-n="Components"><div class="fd-h"><h2 class="t-h2">컴포넌트</h2><span class="t-sm c3">버튼과 표식은 알약형. 누를 수 있는 것은 실제 버튼과 입력이다. 상태는 글자 색과 테두리로 구분하고 점은 진행 중에만 쓴다</span></div>
<div class="fd-row">
<div class="fd-col" data-n="Buttons"><span class="t-sm w6">버튼</span><div class="spec">${btn('검색 시작', { size: 'lg' })}${btn('가입하고 검색 시작', { kind: 'pri', size: 'lg' })}${btn('이 조합으로 결제', { kind: 'pri' })}</div><div class="spec">${btn('다시 검색', { after: 'renew' })}${btn('수정', { kind: 'txt' })}${btn('다시 검색', { off: 1 })}${btn('로그인', { size: 'sm' })}${ibtn('arrow--left', { cls: 'rb', label: '이전' })}${ibtn('arrow--right', { cls: 'rb', label: '다음' })}</div>
<span class="t-sm w6">선택</span><div class="spec">${chk('약관 전체 동의', 1)}${chk('조식 추가', 0)}${rad('1년', 1, { name: 'fd-term' })}${rad('6개월', 0, { name: 'fd-term' })}</div><div class="spec">${opt('문화 · 예술', 1)}${opt('쇼핑', 0)}</div>
<span class="t-sm w6">상태 · 표식</span><div class="spec">${st('ok', '결제 완료')}${st('run', '결제 중')}${st('warn', '미등록')}${st('bad', '결제 실패')}${st('', '대기')}${tag('추천', 'b')}${tag('새로 찾음', 'y')}${tag('확정', 'g')}${tag('환불 불가')}</div>
<span class="t-sm w6">단계 · 출처 (회사 마크는 Simple Icons, 연동을 가정한 예시)</span><div class="spec">${steps(1)}</div><div class="spec">${src('tripdotcom')}${src('expedia')}${src('bookingdotcom')}${src('hotelsdotcom')}${src('googlemaps')}${src('tripadvisor')}${src('tabelog')}${src('naver')}</div></div>
<div class="fd-col" data-n="Inputs"><span class="t-sm w6">문장 검색 상자 · 사진 위(유리) / 종이 위</span><div class="ask-demo">${ask(PROMPTS[0])}${chips(PROMPTS[0])}</div>${ask(PROMPTS[1], { filled: 1, plain: 1 })}
<span class="t-sm w6">입력</span>${fld('닉네임', inp('OO', { id: 'fd-nick', hint: 1 }), { for: 'fd-nick', hint: '2~12자. 화면과 알림에 표시됩니다.' })}${fld('이메일', inp('user@example.com', { id: 'fd-mail', ro: 1, hint: 1 }), { for: 'fd-mail', hint: '읽기 전용' })}
<span class="t-sm w6">안내 상자</span>${note('요금은 결제 직전에 한 번 더 조회합니다.')}${note('수정 요청을 반영해 다시 검색했습니다.', 'b', 'renew')}</div>
</div></section>

<section class="fd-sec" data-n="Dock"><div class="fd-h"><h2 class="t-h2">수정 요청 독</h2><span class="t-sm c3">결과 화면(07 · 08 · 09) 아래에 늘 붙어 있는 문장 입력 창</span></div>
<div class="fd-row">
<div class="fd-col" data-n="States"><span class="t-sm w6">내림 · 기본</span><div class="dock-demo">${dock({ ph: '예) 숙소를 우에노역에서 더 가까운 곳으로 바꿔 주세요' })}</div>
<span class="t-sm w6">올림 · 마우스를 올렸거나 입력 중</span><div class="dock-demo">${dock({ up: 1, text: REV.text, ph: '예) 숙소를 우에노역에서 더 가까운 곳으로 바꿔 주세요', hint: '항공권 · 숙소 · 장소를 바뀐 조건으로 다시 검색합니다.', egs: ['숙소를 더 저렴한 곳으로', '오후 출발 항공권도 포함', '조식 포함 숙소만'] })}</div></div>
<div class="fd-col" data-n="Behavior"><span class="t-sm w6">움직임 규칙</span><div data-n="List">${DOCK_RULES.map(([a, b]) => `<div class="fl" data-n="Rule"><span class="t">${a}</span><span class="grow c2">${b}</span></div>`).join('')}</div></div>
</div></section>

<section class="fd-sec" data-n="Motion"><div class="fd-h"><h2 class="t-h2">움직임</h2><span class="t-sm c3">스크롤 위치를 0→1 진행도로 바꿔 화면을 움직인다 (src/js/site.js · globe.js)</span></div>
<div data-n="List">${MOTION.map(([a, b]) => `<div class="fl" data-n="Motion/${a}"><span class="t">${a}</span><span class="grow c2">${b}</span></div>`).join('')}</div></section>

<section class="fd-sec" data-n="Flow"><div class="fd-h"><h2 class="t-h2">화면 흐름</h2><span class="t-sm c3">번호 순서대로 진행한다 · 데스크톱 1440 / 태블릿 834 / 모바일 390</span></div>
<div data-n="List">${screens.map(s => `<div class="fl" data-n="Flow/${s.id}"><span class="n num">${s.no}</span><span class="t">${s.name}</span><span class="grow c2">${s.note}</span></div>`).join('')}</div></section>

<section class="fd-sec" data-n="Rules"><div class="fd-h"><h2 class="t-h2">이번에 바꾼 것</h2></div>
<div data-n="List"><div class="rule"><span class="a t-xs">2차 시안</span><span class="b t-xs c3">3차 기준</span></div>${RULES.map(([a, b]) => `<div class="rule" data-n="Rule"><span class="a del">${a}</span><span class="b">${b}</span></div>`).join('')}</div></section>
</main>` }),
});
