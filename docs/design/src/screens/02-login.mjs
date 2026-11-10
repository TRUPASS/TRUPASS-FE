// 02 로그인 · 회원가입 — 랜딩에서 세 번째 문장까지 적고 엔터를 누르면 여기로 온다.
// 왼쪽 창에는 적어 둔 조건을 그대로 보여 주고, 오른쪽에서 로그인과 회원가입을 한 자리에서 전환한다.
import { page, logo, btn, ic, gmark, seg } from '../lib/ui.mjs';
import { PROMPTS } from '../lib/data.mjs';

// 적어 둔 문장 세 개. 앞 화면에서 실제로 적은 문장이 있으면 그 문장으로 바뀐다(data-prompt).
export const recap = (o = {}) => `<div class="rc${o.cls ? ' ' + o.cls : ''}" data-n="Recap"><span class="rc-k" data-when-empty="아직 적어 둔 문장이 없어 예시 조건을 보여 드립니다">적어 둔 여행 조건</span>${PROMPTS.map(p => `<div class="rc-r" data-n="Row/${p.l}">${ic(p.icon, 18)}<div class="grow g2"><span class="l">${p.l}</span><span class="v" data-prompt="${p.k}">${p.v}</span></div></div>`).join('')}${o.edit === false ? '' : '<a class="rc-e" href="01-landing.html">조건 다시 적기</a>'}</div>`;

const gbtn = (label, href) => `<a class="btn lg fill gbtn" href="${href}" data-n="GoogleButton">${gmark(20)}<span>${label}</span></a>`;
const or = t => `<div class="au-or" data-n="Divider"><i></i><span>${t}</span><i></i></div>`;
const pane = (k, on, body) => `<div class="au-pane" data-pane="${k}"${on === k ? '' : ' hidden'} data-n="Pane/${k}">${body}</div>`;
const PTS = [['이메일', '영수증과 예약 확정서를 보내는 데만 씁니다.'], ['결제 권한', '첫 결제 때 한도와 항목을 직접 정해 서명합니다.'], ['관심사', '추천 장소와 활동을 고르는 기준이 됩니다.']];

const auth = on => `<main class="auth" data-n="Auth">
<section class="auth-win" data-n="Window"><div class="lyr" data-n="Sky"></div>
  <div class="auth-top" data-n="Top">${logo(30, { inv: 1 })}</div>
  <div class="auth-btm" data-n="Bottom"><p class="auth-h">로그인하면 적어 둔 조건으로<br>바로 검색을 시작합니다.</p>${recap()}</div>
</section>
<section class="auth-side" data-n="Side"><div class="auth-card" data-tabs="${on}" data-n="Card">
  ${seg([['login', '로그인'], ['join', '회원가입']], on)}
  ${pane('login', on, `<div class="g10" data-n="Heading"><h1 class="t-h1">다시 만나서 반갑습니다</h1><p class="t-md c2">Google 계정으로 로그인합니다. 비밀번호는 Trupass에 저장되지 않습니다.</p></div>${gbtn('Google 계정으로 로그인', '06-searching.html')}${or('처음이신가요?')}<a class="btn lg fill" data-tab-to="join" data-n="ToJoin">회원가입</a>`)}
  ${pane('join', on, `<div class="g10" data-n="Heading"><h1 class="t-h1">처음 오셨군요</h1><p class="t-md c2">Google 계정으로 가입합니다. 추가 정보는 1분이면 입력할 수 있습니다.</p></div>${gbtn('Google 계정으로 가입', '03-signup.html')}<div data-n="Points">${PTS.map(([k, v]) => `<div class="au-pt" data-n="Point"><span class="k">${k}</span><span class="grow c2">${v}</span></div>`).join('')}</div>${or('이미 계정이 있으신가요?')}<a class="btn lg fill" data-tab-to="login" data-n="ToLogin">로그인</a>`)}
  <p class="t-xs c3 tc" data-n="Legal">계속 진행하면 <a class="ul">이용약관</a>과 <a class="ul">개인정보 처리방침</a>에 동의하는 것으로 봅니다.</p>
</div></section>
</main>`;

export const login = {
  id: '02-login', no: '02', name: '로그인', kind: 'page',
  note: '랜딩의 세 번째 문장에서 엔터를 누르면 오는 화면. 왼쪽 하늘 창에 적어 둔 문장 세 개를 그대로 보여 주고, 오른쪽에서 Google 계정으로 로그인한다. 로그인하면 곧바로 06 검색으로 넘어간다.',
  html: () => page({ title: '02 로그인', cls: 'veil-in', body: auth('login') }),
};
export const join = {
  id: '02-join', no: '02', name: '회원가입 (같은 화면의 다른 탭)', kind: 'page',
  note: '로그인과 같은 화면에서 탭만 바꾼 상태. Google 계정으로 가입을 시작하고, 받는 정보가 어디에 쓰이는지 세 줄로 알린다. 처음 가입하면 03 회원 정보 입력으로 넘어간다.',
  html: () => page({ title: '02 회원가입', cls: 'veil-in', body: auth('join') }),
};
