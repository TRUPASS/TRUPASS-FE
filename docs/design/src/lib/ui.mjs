// Trupass 디자인 — 화면이 공통으로 쓰는 마크업 조각.
// data-n 은 피그마 레이어 이름이 된다. 화면의 뼈대는 flex(row/column)+gap+padding 으로 짠다.
// 누를 수 있는 것은 실제 a(주소가 있을 때) · button · input 으로 만든다.
import { readFileSync } from 'node:fs';
import { ICONS } from './icons.mjs';
import { BRANDS } from './brands.mjs';

// 항공사 로고의 화면 크기 (tools/fetch-airline-logos.py 가 로고와 함께 만든다)
const AIRLINES = JSON.parse(readFileSync(new URL('../../assets/brands/airlines.json', import.meta.url), 'utf8'));

export const won = n => n.toLocaleString('ko-KR') + '원';
export const sgn = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toLocaleString('ko-KR') + '원';

// 아이콘: IBM Carbon (32 그리드). 색은 currentColor.
export const ic = (name, size = 16, cls = '') => {
  if (!ICONS[name]) throw new Error('unknown icon: ' + name);
  return `<svg class="ic${cls ? ' ' + cls : ''}" width="${size}" height="${size}" viewBox="0 0 32 32" data-n="icon/${name}" aria-hidden="true">${ICONS[name]}</svg>`;
};

// 로고: 승인 체크의 긴 획이 이륙 방향으로 이어지고 그 끝에 기체가 놓인다. 워드마크는 한 가지 색. 색은 CSS(.mark)가 정한다.
export const mark = (s = 28, o = {}) =>
  `<svg class="mark${o.inv ? ' inv' : ''}" width="${s}" height="${s}" viewBox="0 0 32 32" data-n="logo/mark" aria-hidden="true"><rect width="32" height="32" rx="10"/><path class="s" d="M7.6 16.6l4.9 5 7.3-8.6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path class="f" d="M26 6l-9 2.5 4.1 2.4 2.4 4.1z"/></svg>`;
export const logo = (s = 28, o = {}) =>
  `<a class="logo${o.inv ? ' inv' : ''}" href="${o.href || '01-landing.html'}" aria-label="Trupass 처음 화면" data-n="Logo">${mark(s)}<span class="wm">Trupass</span></a>`;

// Google 버튼용 G 마크 (Google 브랜드 가이드의 표준 4색 마크)
export const gmark = (s = 18) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 18 18" data-n="logo/google" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>`;

// 회사 마크와 이름 (요금 조회처 · 지도 · 후기 사이트). 자료는 lib/brands.mjs (Simple Icons).
// 연동을 가정한 예시이며 실제 제휴 관계를 뜻하지 않는다. 그 사실은 화면 푸터에 적는다.
// 그리는 방법은 마크마다 다르다(tools/gen-brands.mjs): 가로로 긴 워드마크는 글자 띠만 잘라 넓게, 색이 옅은 마크는 회사 색 바탕 위에 올린다.
export const brandMark = (k, s = 16) => {
  const b = BRANDS[k];
  if (!b) throw new Error('unknown brand: ' + k);
  const at = `class="bm bm-${k}" data-n="logo/${k}" aria-hidden="true"`;
  if (b.box) {
    const [, , bw, bh] = b.box.split(' ').map(Number), h = Math.round(s * 0.75);
    return `<svg ${at} width="${Math.round(h * bw / bh)}" height="${h}" viewBox="${b.box}"><path d="${b.path}"/></svg>`;
  }
  if (b.tile) {
    return `<svg ${at} width="${s}" height="${s}" viewBox="0 0 24 24"><rect class="t" width="24" height="24" rx="${b.tile === 'round' ? 12 : 5.5}"/><path class="g-${b.ink === 'light' ? 'l' : 'd'}" transform="translate(12 12) scale(${b.scale}) translate(-12 -12)" d="${b.path}"/></svg>`;
  }
  return `<svg ${at} width="${s}" height="${s}" viewBox="0 0 24 24"><path d="${b.path}"/></svg>`;
};
export const brandName = k => BRANDS[k].label;
// 항공사 로고 (Wikimedia Commons 의 공식 로고 벡터). 이름은 옆에 글자로 따로 적으므로 대체 글은 비운다.
export const airlineLogo = k => {
  const a = AIRLINES[k];
  if (!a) throw new Error('unknown airline: ' + k);
  return `<img class="al" src="../assets/brands/${k}.svg" width="${a.w}" height="${a.h}" alt="" data-n="logo/${k}">`;
};
export const src = k => `<span class="src" data-n="Source">${brandMark(k)}<span class="nm">${BRANDS[k].label}</span></span>`;

// 버튼. href 를 주면 그 화면으로 넘어가는 링크(a), 없으면 button 이다. at 은 스크립트가 붙는 자리(data-*) 와 aria 속성.
// arr 는 끝에 동그란 화살표를 붙인다(랜딩 오른쪽 위의 검색 시작). true 면 오른쪽 위를 가리키는 화살표, 아이콘 이름을 주면 그 아이콘.
export const btn = (label, o = {}) => {
  const cls = `btn${o.kind ? ' ' + o.kind : ''}${o.size ? ' ' + o.size : ''}${o.arr ? ' cta' : ''}${o.cls ? ' ' + o.cls : ''}`;
  const inner = `${o.icon ? ic(o.icon, o.isz || 16) : ''}${o.pre || ''}${label}${o.after ? ic(o.after, o.isz || 16) : ''}${o.arr ? `<span class="arr" aria-hidden="true">${ic(o.arr === true ? 'arrow--up-right' : o.arr, o.size === 'sm' ? 14 : 16)}</span>` : ''}`;
  const rest = `${o.at ? ' ' + o.at : ''} data-n="${o.n || 'Button'}"`;
  return o.href
    ? `<a class="${cls}" href="${o.href}"${rest}>${inner}</a>`
    : `<button type="${o.type || 'button'}" class="${cls}"${o.off ? ' disabled' : ''}${rest}>${inner}</button>`;
};
// 아이콘만 있는 버튼. label 은 스크린리더가 읽는 이름(필수).
export const ibtn = (icon, o = {}) => {
  if (!o.label) throw new Error('ibtn needs a label: ' + icon);
  const cls = `btn ico${o.kind ? ' ' + o.kind : ''}${o.size ? ' ' + o.size : ''}${o.cls ? ' ' + o.cls : ''}`;
  const rest = ` aria-label="${o.label}"${o.at ? ' ' + o.at : ''} data-n="${o.n || 'IconButton'}"`;
  return o.href ? `<a class="${cls}" href="${o.href}"${rest}>${ic(icon, o.isz || 20)}</a>` : `<button type="button" class="${cls}"${o.off ? ' disabled' : ''}${rest}>${ic(icon, o.isz || 20)}</button>`;
};

// 입력 칸. 실제 input 을 테두리 상자(.inp)에 담는다. o.id 는 이름표(label for)와 잇는 자리.
export const inp = (value, o = {}) =>
  `<div class="inp${o.ro ? ' ro' : ''}${o.cls ? ' ' + o.cls : ''}" data-n="Input">${o.icon ? ic(o.icon) : ''}<input id="${o.id}" type="${o.type || 'text'}" value="${value}"${o.ro ? ' readonly' : ''}${o.max ? ` maxlength="${o.max}"` : ''}${o.mode ? ` inputmode="${o.mode}"` : ''}${o.auto ? ` autocomplete="${o.auto}"` : ''}${o.hint ? ` aria-describedby="${o.id}-h"` : ''}>${o.after || ''}</div>`;
// 고르는 칸(select). options: [값, 고른 값]
export const sel = (options, value, o = {}) =>
  `<div class="inp" data-n="Select"><select id="${o.id}"${o.hint ? ` aria-describedby="${o.id}-h"` : ''}>${options.map(v => `<option${v === value ? ' selected' : ''}>${v}</option>`).join('')}</select>${ic('chevron--down', 16)}</div>`;
// 이름표 + 칸 + 도움말. o.for 가 있으면 label, 없으면(여러 칸을 묶는 경우) 묶음 이름으로 쓴다.
export const fld = (label, control, o = {}) => {
  const gid = o.for ? '' : 'g-' + (o.n || label).replace(/[^0-9A-Za-z가-힣]+/g, '');
  const head = o.for ? `<label class="l" for="${o.for}">${label}</label>` : `<span class="l" id="${gid}">${label}</span>`;
  return `<div class="fld${o.cls ? ' ' + o.cls : ''}"${o.for ? '' : ` role="group" aria-labelledby="${gid}"`} data-n="Field/${o.n || label}"><div class="fld-l">${head}${o.opt ? `<span class="o">${o.opt}</span>` : ''}</div>${control}${o.hint ? `<span class="hint"${o.for ? ` id="${o.for}-h"` : ''}>${o.hint}</span>` : ''}</div>`;
};
// 체크박스 · 라디오 · 선택 타일: 실제 input + 상태를 보여 주는 상자
export const chk = (label, on, o = {}) =>
  `<label class="chk${o.cls ? ' ' + o.cls : ''}"${o.at ? ' ' + o.at : ''} data-n="Checkbox"><input class="vh" type="checkbox"${on ? ' checked' : ''}${o.req ? ' required' : ''}><span class="box" data-n="Box">${ic('checkmark', 14)}</span><span class="${o.tcls || ''}">${label}</span>${o.after || ''}</label>`;
export const rad = (label, on, o = {}) =>
  `<label class="chk${o.cls ? ' ' + o.cls : ''}" data-n="Radio"><input class="vh" type="radio" name="${o.name}"${on ? ' checked' : ''}><span class="rad" data-n="Dot"></span><span>${label}</span></label>`;
export const opt = (label, on, at = '') =>
  `<label class="opt"${at ? ' ' + at : ''} data-n="Option"><input class="vh" type="checkbox"${on ? ' checked' : ''}><span class="box" data-n="Box">${ic('checkmark', 14)}</span><span>${label}</span></label>`;
// 상태: 글자 색으로 구분한다. 점은 진행 중(run)에만 붙는다.
export const st = (tone, text) => `<span class="st ${tone}" data-n="Status">${tone === 'run' ? '<span class="d"></span>' : ''}<span>${text}</span></span>`;
export const tag = (text, tone = '') => `<span class="tag ${tone}" data-n="Tag">${text}</span>`;
export const kv = (k, v, line = true) => `<div class="kv${line ? ' line' : ''}" data-n="Row"><span class="k">${k}</span><div class="grow">${v}</div></div>`;
export const note = (html, tone = '', icon = 'information') => `<div class="note ${tone}" data-n="Note">${ic(icon, 16)}<div class="grow">${html}</div></div>`;

// 진행 단계: 검색 → 항공 · 숙소 → 장소 → 결제 → 완료
const STEPS = ['검색', '항공 · 숙소', '장소', '결제', '완료'];
export const steps = cur =>
  `<ol class="steps" aria-label="진행 단계" data-n="Steps">${STEPS.map((l, i) => `${i ? `<li class="bar${i <= cur ? ' done' : ''}" aria-hidden="true"></li>` : ''}<li class="step${i < cur ? ' done' : i === cur ? ' on' : ''}"${i === cur ? ' aria-current="step"' : ''} data-n="Step"><span class="no">${i < cur ? ic('checkmark', 12) : i + 1}</span><span class="${i === cur ? '' : 'dt-only'}">${l}</span></li>`).join('')}</ol>`;

// 상단 바 (앱 화면). 아직 화면이 없는 메뉴는 주소 없이 이름만 둔다.
const NAV_IN = [['새 검색', '05-home.html'], ['내 여행', '14-trips.html'], ['결제 내역', '']];
export const header = (o = {}) => {
  const cls = `hdr jb${o.wide ? ' wide' : ''}`;
  if (o.kind === 'bare') {
    return `<header class="${cls}" data-n="Header">${logo()}<div class="row g12"><span class="t-sm c3 dt-only">${o.mail || ''}</span><a class="btn txt n sm" href="01-landing.html" data-n="Button">로그아웃</a></div></header>`;
  }
  return `<header class="${cls}" data-n="Header"><div class="row g32">${logo(28, { href: '05-home.html' })}<nav class="nav dt-only" aria-label="주 메뉴" data-n="Nav">${NAV_IN.map(([l, h]) => `<a class="${l === o.on ? 'on' : ''}"${h ? ` href="${h}"` : ' aria-disabled="true"'}${l === o.on ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav></div><div class="row g8">${ibtn('notification', { kind: 'txt n', label: '알림', n: 'Notifications' })}<button type="button" class="me dt-only" aria-label="OO님 계정 메뉴" data-n="Account"><span class="av">O</span><span class="w5">OO님</span>${ic('chevron--down', 16, 'c3')}</button>${ibtn('menu', { kind: 'txt n', cls: 'm-only', label: '메뉴', n: 'Menu' })}</div></header>`;
};
// 푸터 (앱 화면). 회사 이름과 요금이 예시라는 사실을 여기에 한 번 적는다.
export const footer = (o = {}) =>
  `<footer class="ftr jb${o.wide ? ' wide' : ''}" data-n="Footer"><span>© 2026 Trupass. 화면의 항공권, 숙소, 요금과 회사 이름은 시안용 예시입니다.</span><div class="row g16 wrap"><span>이용약관</span><span>개인정보 처리방침</span><span>전자금융거래 이용약관</span><span>고객센터 1600-0000</span></div></footer>`;

// 문장 입력 상자 (수정 요청 독 안에서 쓴다): 실제 textarea
export const pbox = (o = {}) =>
  `<div class="pbox" data-n="${o.n || 'Prompt'}"><textarea class="pbox-x" rows="2" maxlength="${o.max ?? 300}" placeholder="${o.ph || ''}" aria-label="${o.label || '수정 요청'}" data-n="Text">${o.text || ''}</textarea><div class="pbox-f${o.hint ? '' : ' je'}" data-n="Bar">${o.hint ? `<span class="hint grow">${o.hint}</span>` : ''}<div class="row g12 fn pbox-a"><span class="t-xs c3 num" data-len>${(o.text || '').length} / ${o.max ?? 300}</span>${btn(o.cta || '다시 검색', { kind: o.text ? 'pri' : '', after: 'renew', n: 'Submit', href: o.href })}</div></div></div>`;

// 수정 요청 독: 결과 화면 아래에 늘 붙어 있다.
//   내림(기본) — 머리줄 한 줄만 보인다.  올림(.up) — 머리줄을 누르거나 마우스를 올리거나 입력을 시작하면 입력 상자가 올라온다.
//   입력 없이 포인터가 벗어난 채 4초가 지나면 다시 내려간다. (움직임은 src/js/site.js)
export const dock = (o = {}) => `<div class="dock${o.up ? ' up' : ''}" data-n="ReviseDock/${o.up ? '올림' : '내림'}" data-dock>
<button type="button" class="dock-h" aria-expanded="true" data-n="Head">${ic('edit', 16, 'c2')}<span class="t-sm w6 fn">수정 요청</span><span class="dock-ph t-sm grow">${o.ph}</span><span class="dock-de t-sm c2 grow">바꾸고 싶은 점을 문장으로 적어 주세요.<span class="dt-only"> ${o.desc || '조건을 반영해 다시 검색합니다.'}</span></span>${ic('chevron--up', 16, 'c3 i-up')}${ic('chevron--down', 16, 'c3 i-dn')}</button>
<div class="dock-b" data-n="Body">${pbox({ n: 'RevisePrompt', text: o.text, ph: o.ph, hint: o.hint, href: o.href })}${o.egs ? `<div class="dock-eg" data-n="Examples"><span class="t-xs c3 fn">예시</span>${o.egs.map(t => `<button type="button" class="tbtn t-xs" data-eg>${t}</button>`).join('')}</div>` : ''}</div>
</div>`;
// 화면 아래 고정 영역: 수정 요청 독 + (태블릿·모바일) 합계와 다음 단계 버튼
export const bottom = (o = {}) => `<div class="bottom" data-n="Bottom"><div class="bottom-in" data-n="DockArea">${dock(o.dock)}</div>${o.bar || ''}</div>`;

// 문장 검색 상자 (랜딩 · 새 검색). p 는 data.mjs 의 PROMPTS 한 건.
//   next: 엔터를 눌렀을 때 넘어갈 곳 — 'stage:1' 처럼 랜딩의 다음 구간이거나 화면 주소. 스크립트가 꺼져 있으면 action 주소로 간다.
//   filled: 고객이 적은 문장을 채워서 보여 준다(시안의 입력 뒤 상태).  plain: 사진이 아닌 종이 바탕 위에 놓을 때.
export const ask = (p, o = {}) =>
  `<form class="ask${o.plain ? ' plain' : ''}" action="${o.action || '02-login.html'}" data-ask="${p.k}" data-next="${o.next || ''}" data-n="Prompt/${p.l}">${ic(p.icon, 24)}<input type="text" name="${p.k}" placeholder="${p.ph}" value="${o.filled ? p.v : ''}" autocomplete="off" enterkeyhint="${o.last ? 'search' : 'next'}" aria-label="${p.q || p.l}"><button class="go" type="submit" aria-label="${o.last ? '검색' : '다음'}" data-n="Submit">${ic(o.last ? 'search' : 'arrow--right', 22)}</button></form>`;
export const chips = (p, cls = '') => `<div class="chips${cls ? ' ' + cls : ''}" data-n="Examples">${p.egs.map(t => `<button type="button" class="chip" data-eg="${p.k}">${t}</button>`).join('')}</div>`;

// 문서 틀. scripts: 화면이 따로 쓰는 스크립트(../ 기준 경로). 공통 스크립트 site.js 는 항상 붙는다.
// title 은 설계용 이름(번호 포함, 피그마 레이어 이름), tab 은 브라우저 탭에 보이는 이름.
// cls 에 veil-in 을 주면 그 화면은 구름 장막이 걷히며 열린다(로그인 · 회원 정보 입력). 장막(.veil)은 모든 화면에 깔려 있고 평소에는 보이지 않는다.
// <html class="js"> 는 스크립트가 켜져 있을 때만 붙는다. 스크롤 연출처럼 스크립트가 있어야 풀리는 숨김은 전부 .js 아래에 둔다.
export const DESC = '여행 조건을 문장 세 개로 적으면 항공권과 숙소, 주변 장소를 한 번에 찾아 주는 Trupass의 화면 시안입니다.';
export const page = ({ title, tab, cls = '', body, scripts = [], attrs: at = '' }) => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${tab || title.replace(/^\d+\s*/, '')} | Trupass</title>
<meta name="description" content="${DESC}">
<meta name="robots" content="noindex, nofollow">
<script>document.documentElement.classList.add('js')</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;500;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../app.css">${/\bveil-in\b/.test(cls) ? '\n<link rel="preload" as="image" href="../assets/bg/deck.webp">' : ''}
</head>
<body class="${cls}" data-n="${title}"${at ? ' ' + at : ''}>
${body}
<div class="veil" aria-hidden="true" data-n="CloudVeil"><i></i></div>
${[...scripts, 'js/site.js'].map(s => `<script src="../${s}"></script>`).join('\n')}
</body>
</html>
`;
