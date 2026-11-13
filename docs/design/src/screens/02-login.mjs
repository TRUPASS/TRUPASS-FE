// 02 로그인 — 랜딩에서 세 번째 문장까지 적고 엔터를 누르면 여기로 온다.
// 왼쪽 창에는 적어 둔 조건을 그대로 보여 주고, 오른쪽에는 버튼 하나만 둔다.
// 로그인 수단이 Google 계정 하나뿐이라 로그인과 회원가입을 나누지 않는다. 처음 온 계정이면 03 회원 정보 입력을 한 번 거친다.
import { page, logo, ic, gmark } from '../lib/ui.mjs';
import { PROMPTS } from '../lib/data.mjs';

// 적어 둔 문장 세 개. 앞 화면에서 실제로 적은 문장이 있으면 그 문장으로 바뀐다(data-prompt).
export const recap = (o = {}) => `<div class="rc${o.cls ? ' ' + o.cls : ''}" data-n="Recap"><span class="rc-k" data-when-empty="아직 적어 둔 문장이 없어 예시 조건을 보여 드립니다">적어 둔 여행 조건</span>${PROMPTS.map(p => `<div class="rc-r" data-n="Row/${p.l}">${ic(p.icon, 18)}<div class="grow g2"><span class="l">${p.l}</span><span class="v" data-prompt="${p.k}">${p.v}</span></div></div>`).join('')}${o.edit === false ? '' : '<a class="rc-e" href="01-landing.html#search">문장 다시 적기</a>'}</div>`;

const auth = () => `<main class="auth" data-n="Auth">
<section class="auth-win" data-n="Window"><div class="lyr" data-n="Sky"></div>
  <div class="auth-top" data-n="Top">${logo(28, { inv: 1 })}</div>
  <div class="auth-btm" data-n="Bottom"><p class="auth-h">적어 둔 조건으로<br>바로 검색을 시작합니다.</p>${recap()}</div>
</section>
<section class="auth-side" data-n="Side"><div class="auth-card" data-n="Card">
  <div class="g10" data-n="Heading"><h1 class="t-h1">Google 계정으로 시작합니다</h1><p class="t-md c2">처음이면 닉네임과 관심사를 한 번만 입력합니다. 비밀번호는 Trupass에 저장되지 않습니다.</p></div>
  <a class="btn pri lg fill gbtn" href="03-signup.html" data-n="GoogleButton"><span class="g-tile">${gmark(18)}</span>Google 계정으로 계속하기</a>
  <p class="t-xs c3" data-n="Legal">계속 진행하면 이용약관과 개인정보 처리방침에 동의하는 것으로 봅니다.</p>
</div></section>
</main>`;

export const login = {
  id: '02-login', no: '02', name: '로그인 · Google 계정으로 계속하기', kind: 'page',
  note: '랜딩의 세 번째 문장에서 엔터를 누르면 오는 화면. 왼쪽 하늘 창에 적어 둔 문장 세 개를 그대로 보여 주고, 오른쪽에는 [Google 계정으로 계속하기] 하나만 둔다. 로그인과 회원가입을 나누지 않는다. 처음 온 계정은 03 회원 정보 입력을 한 번 거치고, 가입한 계정은 곧바로 06 검색으로 넘어간다(시안에서는 03 으로 이어진다).',
  html: () => page({ title: '02 로그인', tab: '로그인', cls: 'veil-in', body: auth() }),
};
