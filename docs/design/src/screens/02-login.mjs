// 02 로그인 — 랜딩에서 [통합 검색]을 누르면 뜬다. 칸에 적은 조건을 그대로 보여 주고 Google 계정 하나로 로그인한다.
import { page, ibtn, gmark } from '../lib/ui.mjs';
import { landingBody } from './01-landing.mjs';
import { reqList } from './parts-search.mjs';

const modal = () => `<div class="ovl" data-n="Overlay"><div class="mdl login" data-n="Modal/Login">
<div class="mdl-h jb"><span class="t-h3">로그인</span>${ibtn('close', { kind: 'txt n', n: 'Close' })}</div>
<div class="login-b" data-n="Body">
  <div class="g6"><h2 class="t-h2">Google 계정으로 로그인해 주세요</h2><p class="t-md c2">입력하신 조건은 로그인한 뒤에도 그대로 유지됩니다. 처음 이용하시면 회원 정보 입력 단계로 이어집니다.</p></div>
  <div class="recap" data-n="Recap"><span class="t-xs c3">입력한 검색 조건</span>${reqList()}</div>
  <a class="btn lg gbtn" data-n="Button/Google">${gmark(18)}Google 계정으로 계속하기</a>
  <p class="t-xs c3">로그인하면 Trupass 이용약관과 개인정보 처리방침이 적용됩니다.</p>
</div></div></div>`;

export default {
  id: '02-login', no: '02', name: '로그인 · Google 계정', kind: 'viewport',
  note: '소셜 로그인은 Google 한 가지. 칸에 적은 조건을 모달 안에 다시 보여 주어 입력이 사라지지 않았음을 알린다.',
  html: () => page({ title: '02 로그인 · Google 계정', cls: 'pg-white has-ovl', body: landingBody({ filled: true, focus: 'wish' }) + modal() }),
};
