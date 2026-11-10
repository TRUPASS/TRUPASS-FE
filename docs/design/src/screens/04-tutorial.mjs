// 04 이용 안내 — 가입 직후 한 번 뜨는 모달. 좌우 버튼으로 넘기고, 아래에서 "다시 보지 않기"를 고른다.
// 그림은 실제 화면을 캡처한 것이다 (tools/make-shots.mjs 가 dist 에서 찍어 assets/tutorial 에 넣는다).
import { page, ibtn, btn, chk } from '../lib/ui.mjs';
import { homeBody } from './05-home.mjs';

export const TUT = [
  ['요청을 문장으로 입력합니다', '목적지, 일정, 인원, 예산을 한 문장으로 적어 주세요. 조건이 구체적일수록 조합이 정확해집니다.'],
  ['조합안과 숙소 주변을 확인합니다', '항공권과 숙소의 조합, 요금 출처, 숙소 위치와 주변 음식점 · 명소를 한 화면에서 확인합니다.'],
  ['옵션을 고르거나 수정 요청을 보냅니다', '다른 항공편이나 숙소를 선택하거나, 바꾸고 싶은 점을 적어 조합을 다시 받을 수 있습니다.'],
  ['결제 권한 범위 안에서 결제합니다', '서명해 둔 한도와 항목 안에서 한 번의 승인으로 결제하고, 영수증과 확정서를 이메일로 받습니다.'],
];
const modal = n => {
  const [t, d] = TUT[n], last = n === TUT.length - 1, first = n === 0;
  const prev = c => ibtn('chevron--left', { cls: c + (first ? ' dis' : ''), n: 'Prev' }), next = c => ibtn('chevron--right', { cls: c + (last ? ' dis' : ''), n: 'Next' });
  return `<div class="ovl" data-n="Overlay"><div class="mdl tut" data-n="Modal/Tutorial">
<div class="mdl-h jb"><div class="row g10"><span class="t-h3">이용 안내</span><span class="t-sm c3 num dt-only">${n + 1} / ${TUT.length}</span></div>${ibtn('close', { kind: 'txt n', n: 'Close' })}</div>
<div class="tut-m" data-n="Slide">${prev('dt-only')}<div class="shot" data-n="Screenshot"><img src="../assets/tutorial/step${n + 1}.jpg" width="1280" height="760" alt="" data-n="Image"></div>${next('dt-only')}</div>
<div class="tut-nav m-only" data-n="Pager">${prev('')}<span class="t-sm c2 num">${n + 1} / ${TUT.length}</span>${next('')}</div>
<div class="tut-t" data-n="Caption"><h2 class="t-h2">${t}</h2><p class="t-md c2">${d}</p></div>
<div class="mdl-f jb" data-n="Footer">${chk('다시 보지 않기', 0)}${last ? btn('시작하기', { kind: 'pri', n: 'Start' }) : btn('닫기', { n: 'Dismiss' })}</div>
</div></div>`;
};
const mk = (n, extra = {}) => ({
  id: `04-tutorial-${n + 1}`, no: '04', name: `이용 안내 ${n + 1}/${TUT.length}`, kind: 'viewport',
  note: '좌우 버튼으로 4장을 넘긴다. 첫 장은 이전, 마지막 장은 다음 버튼이 비활성. 하단 "다시 보지 않기"를 체크하고 닫으면 다시 뜨지 않는다.',
  html: () => page({ title: `04 이용 안내 ${n + 1}/${TUT.length}`, cls: 'pg-white has-ovl', body: homeBody() + modal(n) }), ...extra,
});
export const tutorial2 = mk(1);
export const tutorial4 = mk(3, { bps: ['d'] });
