// Trupass 디자인 — 화면이 공통으로 쓰는 마크업 조각.
// data-n 은 피그마 레이어 이름이 된다. 레이아웃은 전부 flex(row/column)+gap+padding 으로만 짠다.
import { ICONS } from './icons.mjs';

export const won = n => n.toLocaleString('ko-KR') + '원';
export const sgn = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toLocaleString('ko-KR') + '원';
const a = (o = {}) => Object.entries(o).filter(([, v]) => v != null && v !== false).map(([k, v]) => ` ${k}="${v}"`).join('');

// 아이콘: IBM Carbon (32 그리드). 색은 currentColor.
export const ic = (name, size = 16, cls = '') => {
  if (!ICONS[name]) throw new Error('unknown icon: ' + name);
  return `<svg class="ic${cls ? ' ' + cls : ''}" width="${size}" height="${size}" viewBox="0 0 32 32" data-n="icon/${name}" aria-hidden="true">${ICONS[name]}</svg>`;
};

// 로고: 승인 체크의 긴 획이 이륙 방향으로 이어지고 그 끝에 기체가 놓인다. 워드마크는 한 가지 색.
export const mark = (s = 24, tile = '#0b3c9d', fg = '#fff') =>
  `<svg class="mark" width="${s}" height="${s}" viewBox="0 0 32 32" data-n="logo/mark" aria-hidden="true"><rect width="32" height="32" rx="7" fill="${tile}"/><path d="M7.6 16.6l4.9 5 7.3-8.6" fill="none" stroke="${fg}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 6l-9 2.5 4.1 2.4 2.4 4.1z" fill="${fg}"/></svg>`;
export const logo = (s = 24) => `<a class="logo" data-n="Logo">${mark(s)}<span class="wm">Trupass</span></a>`;

// Google 로그인 버튼용 G 마크 (Google 브랜드 가이드의 표준 4색 마크)
export const gmark = (s = 18) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 18 18" data-n="logo/google" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>`;

// 요금 조회 출처(가상의 제휴사). 로고 자리는 실제 연동 API가 정해지면 교체한다.
const SM = {
  haneul: ['하늘길', '#0d6f8a', '<path d="M3 10.5 8 5l5 5.5h-2.6L8 8 5.6 10.5z"/><path d="M3 14l5-5.5 5 5.5h-2.6L8 11.5 5.6 14z" opacity=".55"/>'],
  airmoa: ['에어모아', '#b4501f', '<circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="8" r="1.7"/>'],
  stayon: ['스테이온', '#2c7550', '<path d="M2.5 8 8 2.8 13.5 8v5.7h-3.6V10H6.1v3.7H2.5z"/>'],
  naru: ['호텔나루', '#5647a8', '<path d="M2.8 13.2V2.8h3.1l4.2 6.1V2.8h3.1v10.4h-3L6 7.1v6.1z"/>'],
};
export const srcMark = (k, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" data-n="logo/${k}" style="color:${SM[k][1]};fill:${SM[k][1]}" aria-hidden="true">${SM[k][2]}</svg>`;
export const srcName = k => SM[k][0];
export const src = (k, o = {}) => `<a class="src" data-n="Source">${srcMark(k)}<span class="nm">${SM[k][0]}</span>${o.link === false ? '' : ic('launch', 14)}</a>`;

export const btn = (label, o = {}) =>
  `<a class="btn${o.kind ? ' ' + o.kind : ''}${o.size ? ' ' + o.size : ''}${o.cls ? ' ' + o.cls : ''}" data-n="${o.n || 'Button'}">${o.icon ? ic(o.icon, o.isz || 16) : ''}${o.pre || ''}${label}${o.after ? ic(o.after, o.isz || 16) : ''}</a>`;
export const ibtn = (icon, o = {}) => `<a class="btn ico${o.kind ? ' ' + o.kind : ''}${o.size ? ' ' + o.size : ''}${o.cls ? ' ' + o.cls : ''}" data-n="${o.n || 'IconButton'}">${ic(icon, o.isz || 20)}</a>`;

export const inp = (value, o = {}) =>
  `<div class="inp${o.ph ? ' ph' : ''}${o.ro ? ' ro' : ''}${o.focus ? ' focus' : ''}${o.cls ? ' ' + o.cls : ''}" data-n="Input"${o.w ? ` style="width:${o.w}px"` : ''}>${o.icon ? ic(o.icon) : ''}<span class="grow">${value}</span>${o.after || ''}</div>`;
export const fld = (label, control, o = {}) =>
  `<div class="fld${o.cls ? ' ' + o.cls : ''}" data-n="Field/${o.n || label}"><div class="fld-l"><span class="l">${label}</span>${o.opt ? `<span class="o">${o.opt}</span>` : ''}</div>${control}${o.hint ? `<span class="hint">${o.hint}</span>` : ''}</div>`;
export const chk = (label, on, o = {}) =>
  `<label class="chk${o.cls ? ' ' + o.cls : ''}" data-n="Checkbox"><span class="box${on ? ' on' : ''}" data-n="Box">${on ? ic('checkmark', 14) : ''}</span><span class="${o.tcls || ''}">${label}</span>${o.after || ''}</label>`;
export const rad = (label, on, o = {}) =>
  `<label class="chk${o.cls ? ' ' + o.cls : ''}" data-n="Radio"><span class="rad${on ? ' on' : ''}" data-n="Dot">${on ? '<span class="dot"></span>' : ''}</span>${label ? `<span>${label}</span>` : ''}</label>`;
export const opt = (label, on) =>
  `<label class="opt${on ? ' on' : ''}" data-n="Option"><span class="box${on ? ' on' : ''}" data-n="Box">${on ? ic('checkmark', 14) : ''}</span><span>${label}</span></label>`;
export const st = (tone, text) => `<span class="st ${tone}" data-n="Status"><span class="d"></span><span>${text}</span></span>`;
export const tag = (text, tone = '') => `<span class="tag ${tone}" data-n="Tag">${text}</span>`;
export const kv = (k, v, line = true) => `<div class="kv${line ? ' line' : ''}" data-n="Row"><span class="k">${k}</span><div class="grow">${v}</div></div>`;
export const note = (html, tone = '', icon = 'information') => `<div class="note ${tone}" data-n="Note">${ic(icon, 16)}<div class="grow">${html}</div></div>`;
export const img = (file, w, h, o = {}) => `<img src="../assets/${file}" width="${w}" height="${h}" alt="${o.alt || ''}" data-n="${o.n || 'Image'}" style="width:${w}px;height:${h}px;border-radius:${o.r ?? 4}px${o.css ? ';' + o.css : ''}">`;

// 진행 단계: 요청 → 조합 확인 → 결제 → 완료
const STEPS = ['요청', '조합 확인', '결제', '완료'];
export const steps = cur =>
  `<div class="steps" data-n="Steps">${STEPS.map((l, i) => `${i ? `<span class="bar${i <= cur ? ' done' : ''}"></span>` : ''}<div class="step${i < cur ? ' done' : i === cur ? ' on' : ''}" data-n="Step"><span class="no">${i < cur ? ic('checkmark', 12) : i + 1}</span><span class="${i === cur ? '' : 'dt-only'}">${l}</span></div>`).join('')}</div>`;

// 상단 바
const NAV_OUT = ['서비스 소개', '이용 방법', '결제 권한 안내', '고객센터'];
const NAV_IN = ['새 요청', '내 여행', '결제 내역'];
export const header = (o = {}) => {
  if (o.kind === 'bare') {
    return `<header class="hdr jb" data-n="Header">${logo()}<div class="row g12"><span class="t-sm c3 dt-only">${o.mail || ''}</span><a class="btn txt n sm" data-n="Button">로그아웃</a></div></header>`;
  }
  if (o.kind === 'in') {
    return `<header class="hdr jb" data-n="Header"><div class="row g32">${logo()}<nav class="nav dt-only" data-n="Nav">${NAV_IN.map(l => `<a class="${l === o.on ? 'on' : ''}">${l}</a>`).join('')}</nav></div><div class="row g4">${ibtn('notification', { kind: 'txt n', n: 'Notifications' })}<a class="me dt-only" data-n="Account"><span class="av">지</span><span class="w5">지안</span>${ic('chevron--down', 16, 'c3')}</a>${ibtn('menu', { kind: 'txt n', cls: 'm-only', n: 'Menu' })}</div></header>`;
  }
  return `<header class="hdr jb" data-n="Header"><div class="row g32">${logo()}<nav class="nav dt-only" data-n="Nav">${NAV_OUT.map(l => `<a>${l}</a>`).join('')}</nav></div><div class="row g8">${btn('로그인', { size: 'sm', n: 'Login' })}${ibtn('menu', { kind: 'txt n', size: 'sm', cls: 'm-only', n: 'Menu' })}</div></header>`;
};
export const footer = () =>
  `<footer class="ftr jb" data-n="Footer"><span>© 2026 Trupass</span><div class="row g16 wrap"><span>이용약관</span><span>개인정보 처리방침</span><span>전자금융거래 이용약관</span><span>고객센터 1600-0000</span></div></footer>`;

// 요청 입력 상자
export const pbox = (o = {}) => {
  const txt = o.text
    ? `<p class="pbox-x">${o.text}</p>`
    : `<p class="pbox-x ph">${o.ph || ''}</p>`;
  return `<div class="pbox${o.focus ? ' focus' : ''}${o.sm ? ' sm' : ''}" data-n="${o.n || 'Prompt'}"><div class="pbox-t" data-n="Text">${txt}</div><div class="pbox-f${o.hint ? '' : ' je'}" data-n="Bar">${o.hint ? `<span class="hint grow">${o.hint}</span>` : ''}<div class="row g12 fn pbox-a"><span class="t-xs c3 num">${o.count ?? 0} / ${o.max ?? 500}</span>${btn(o.cta || '조합 요청', { kind: o.ckind ?? 'pri', after: o.cicon ?? 'arrow--right', n: 'Submit', cls: o.dis ? 'dis' : '' })}</div></div></div>`;
};

// 문서 틀
export const page = ({ title, cls = '', body }) => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — Trupass</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../app.css">
</head>
<body class="${cls}" data-n="${title}">
${body}
</body>
</html>
`;
