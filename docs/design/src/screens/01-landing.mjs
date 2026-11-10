// 01 랜딩 — 스크롤로 넘기는 한 장짜리 소개 + 문장 입력 세 번.
//   하늘(구름이 가까워진다) → 숫자 → 이용 방법(좌우로 넘기는 상자) → 항공 · 숙소 · 체험 문장 입력 → 푸터.
//   세 번째 문장에서 엔터를 누르면 02 로그인으로 넘어간다. 움직임은 src/js/site.js 가 스크롤 위치(--p)로 만든다.
//   스크립트가 꺼져 있으면 연출 없이 같은 내용이 위에서 아래로 그대로 보인다 (screens.css 의 .js 범위 참고).
import { page, logo, mark, btn, ibtn, ic, ask, chips, brandMark, brandName } from '../lib/ui.mjs';
import { PROMPTS, STATS, HOW } from '../lib/data.mjs';

const pad2 = n => String(n).padStart(2, '0');

// 오른쪽 위에 늘 떠 있는 알약 두 개
const top = () => `<div class="lp-top" data-n="TopBar">${btn('로그인', { size: 'sm', href: '02-login.html', n: 'Login' })}${btn('검색 시작', { size: 'sm', href: '#search', at: 'data-goto="stage:0"', n: 'Start' })}</div>`;

const hero = () => `<section class="lp-hero" data-sec="hero" data-n="Hero"><div class="hold"><div class="win" data-n="Window">
<div class="lyr sky" data-n="Sky"></div><div class="lyr mid" data-n="CloudSea"></div><div class="lyr deck" data-n="CloudDeck"></div><div class="lyr haze" data-n="Haze"></div>
<div class="hero-logo" data-n="Logo">${logo(30, { href: '#' })}</div>
<div class="hero-hint" aria-hidden="true" data-n="ScrollHint"><span>스크롤을 내려 여행을 시작하세요</span><i></i></div>
<div class="hero-t" data-n="Title">
  <div class="hero-wm" data-n="Wordmark"><span class="wm-b">TRUPASS</span><span class="wm-s">AI Travel Search</span></div>
  <div class="hero-cp" data-n="Copy"><h1 class="hero-h">항공권 · 숙소 · 여행 장소를<br>문장 세 개로 한 번에</h1><p class="hero-d">여행 조건을 평소 말하듯 적으면 AI가 항공권과 숙소, 주변 장소를 함께 찾아 한 화면에 정리합니다.</p></div>
</div>
</div></div></section>`;

const stats = () => `<section class="lp-stats" data-sec="stats" data-n="Stats"><div class="hold"><div class="win" data-n="Window">
<div class="lyr bg" data-n="Sky"></div>
<h2 class="st-cap" data-n="Caption">한 번의 검색이 대신 하는 일</h2>
<div class="st-rows" data-n="Rows">${STATS.map((s, i) => `<div class="st-row" style="--i:${i}" data-n="Row"><div class="st-cell" data-n="Stat/${s.l}"><span class="st-num num"><span class="${s.pre.trim().length > 1 || /[가-힣]/.test(s.pre) ? 'u pre' : ''}">${s.pre.trim()}</span><span data-count="${s.n}" data-i="${i}">${s.n}</span><span class="u">${s.u}</span></span><div class="st-lb"><span class="l">${s.l}</span><span class="s">${s.s}</span></div></div></div>`).join('')}</div>
<p class="st-note" data-n="Note">도쿄 3박 예시 검색 한 건을 기준으로 한 시안용 값입니다.</p>
</div></div></section>`;

// 이용 방법: 순서가 있는 목록(ol). 번호는 CSS 카운터가 그린다. 스크립트가 켜지면 한 장씩 넘겨 보는 상자가 된다.
const how = () => `<section class="lp-how" id="how" data-car data-n="HowTo">
<div class="how-hd" data-n="Heading"><h2 class="t-display">다섯 걸음이면 여행이 정해집니다</h2></div>
<div class="how-car" data-n="Carousel">
  ${ibtn('arrow--left', { cls: 'rb', label: '이전 걸음', at: 'data-car-prev', n: 'Prev' })}
  <ol class="how-box" data-n="Box">${HOW.map((h, i) => `<li class="how-sl${i ? '' : ' on'}" data-slide data-n="Slide/${pad2(i + 1)}"><div class="how-img" data-n="Shot"><img src="../assets/tutorial/step${i + 1}.jpg" width="1280" height="760" alt="" loading="lazy"></div><div class="how-tx" data-n="Text"><h3 class="t-h1">${h.t}</h3><p class="t-lg c2">${h.d}</p></div></li>`).join('')}</ol>
  ${ibtn('arrow--right', { cls: 'rb', label: '다음 걸음', at: 'data-car-next', n: 'Next' })}
</div>
<div class="how-ft" data-n="Pager"><div class="how-dots" data-n="Dots">${HOW.map((_, i) => `<button type="button" class="${i ? '' : 'on'}" data-dot aria-label="${i + 1}번째 걸음"></button>`).join('')}</div></div>
<button type="button" class="how-go" data-goto="stage:0" data-n="ScrollNudge"><span>다 읽으셨다면 아래로 스크롤하세요</span>${ic('arrow--down', 18)}</button>
</section>`;

const svc = () => `<section class="lp-svc" id="search" data-sec="svc" data-on="0" data-n="Services"><div class="hold">
<div class="mq" data-n="Marquee" aria-hidden="true"><div class="mq-t">${Array.from({ length: 6 }, () => '<span>Flights · Hotels · Experiences</span>').join('')}</div></div>
<button type="button" class="mq-x" data-mq aria-pressed="false" aria-label="흐르는 글자 멈춤" data-n="MarqueePause">${ic('pause--filled', 16, 'i-pause')}${ic('play--filled--alt', 16, 'i-play')}</button>
<div class="win" data-n="Window">
  ${PROMPTS.map((p, i) => `<div class="stg stg-${i}" style="background-image:url(../assets/${p.img})" data-n="Photo/${p.en}"></div>`).join('')}
  <div class="svc-ui" data-n="Overlay">
    <div class="svc-c" data-n="Center">${PROMPTS.map((p, i) => `<div class="svc-pane" data-i="${i}" data-stage-ui="${i}" data-n="Stage/${p.en}"><h2 class="svc-q">${p.q}</h2>${ask(p, { next: i < 2 ? `stage:${i + 1}` : '02-login.html', last: i === 2 })}${chips(p)}<p class="svc-k">${i < 2 ? '엔터를 누르면 다음 질문으로 넘어갑니다' : '엔터를 누르면 로그인 후 검색을 시작합니다'}</p></div>`).join('')}</div>
    <div class="svc-b" data-n="Bottom"><div class="svc-ds" data-n="Descriptions">${PROMPTS.map((p, i) => `<p class="svc-d" data-i="${i}">${p.d}</p>`).join('')}</div><div class="svc-pg" aria-hidden="true" data-n="Progress"><span class="num svc-n">${PROMPTS.map((_, i) => `<b data-i="${i}">${pad2(i + 1)}</b>`).join('')}<em>/ ${pad2(PROMPTS.length)}</em></span><span class="svc-bar"><i></i></span></div></div>
  </div>
</div>
</div></section>`;

const SRC = ['tripdotcom', 'expedia', 'bookingdotcom', 'hotelsdotcom'];
const ftr = () => `<footer class="lp-ftr" data-n="Footer"><div class="ftr-win" data-n="Window">
<div class="ftr-t" data-n="Closing"><p class="ftr-h">문장 세 개면 항공권과 숙소, 여행 장소가 한 화면에 정리됩니다.</p>${btn('검색 시작', { size: 'lg', href: '#search', at: 'data-goto="stage:0"', n: 'Start' })}</div>
<div class="ftr-g" data-n="Columns">
  <div class="ftr-c" data-n="Sources"><span class="k">검색 출처</span><div class="ftr-src">${SRC.map(k => `<span class="s">${brandMark(k)}<span>${brandName(k)}</span></span>`).join('')}</div><span class="d">장소와 후기는 Google 지도와 웹 검색 결과를 함께 조회합니다. 위 회사들은 연동을 가정한 예시이며 실제 제휴 관계가 아닙니다.</span></div>
  <div class="ftr-c" data-n="Guide"><span class="k">안내</span><a href="#how" data-goto="#how">이용 방법</a><span>이용약관</span><span>개인정보 처리방침</span><span>전자금융거래 이용약관</span></div>
  <div class="ftr-c" data-n="Contact"><span class="k">고객센터</span><span class="v num">1600-0000</span><span class="d">평일 09:00 ~ 18:00</span><a href="02-login.html">로그인</a></div>
</div>
<div class="ftr-e" data-n="Legal"><a class="logo inv" href="#" aria-label="Trupass 맨 위로">${mark(24)}<span class="wm">Trupass</span></a><span>© 2026 Trupass</span><span class="grow"></span><a class="ul" href="../assets/CREDITS.md">사진 · 지도 · 글꼴 · 회사 마크 출처</a></div>
</div></footer>`;

// 정지 화면을 찍는 자리: [이름, 구간, 구간 안의 위치(0–1)]. tools/render.mjs 가 이 위치로 스크롤해 화면을 찍는다.
export const STOPS = [['하늘', 'hero', 0], ['구름이 가까워진다', 'hero', 0.2], ['소개', 'hero', 0.62], ['숫자', 'stats', 0.86], ['이용 방법', '#how', 0], ['창이 커진다', 'svc', 0.085], ['항공', 'svc', 0.3], ['숙소', 'svc', 0.58], ['체험', 'svc', 0.9], ['푸터', 'end', 0]];

export default {
  id: '01-landing', no: '01', name: '랜딩 · 스크롤 소개와 문장 입력', kind: 'scroll', stops: STOPS,
  note: '하늘에서 시작해 스크롤을 내리면 구름이 가까워지며 서비스 소개가 크게 나온다. 이어서 숫자 → 이용 방법(좌우 버튼으로 넘기는 상자, 끝까지 읽으면 아래로 스크롤을 권한다) → 항공 · 숙소 · 체험 문장 입력이 차례로 나온다. 입력 칸은 검색 엔진처럼 화면 가운데에 놓고 연한 예시를 깔았다. 세 번째 문장에서 엔터를 누르면 로그인으로 넘어가며, 그 아래는 푸터에서 스크롤이 끝난다. 스크립트가 꺼져 있어도 같은 내용이 차례로 보인다.',
  html: () => page({ title: '01 랜딩', tab: '문장 세 개로 찾는 여행', cls: 'lp', body: `${top()}\n<main data-n="Main">\n${hero()}\n${stats()}\n${how()}\n${svc()}\n</main>\n${ftr()}` }),
};
