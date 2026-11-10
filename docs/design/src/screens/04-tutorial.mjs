// 04 이용 안내 — 가입 직후 한 번 뜨는 모달. 좌우 버튼으로 넘기고, 아래에서 "다시 보지 않기"를 고른다.
// 그림은 실제 화면을 캡처한 것이다 (tools/make-shots.mjs 가 dist 에서 찍어 assets/tutorial 에 넣는다).
import { page, ibtn, btn, chk } from '../lib/ui.mjs';
import { homeBody } from './05-home.mjs';

export const TUT = [
  ['조건을 칸마다 자유롭게 적습니다', '여행 장소, 출발 시기, 요청사항을 칸마다 문장으로 적어 주세요. "12월 중", "18일 전후 3일"처럼 대략 적어도 됩니다.'],
  ['항공권을 고르고 숙소 3곳을 펼쳐 봅니다', '조건에 맞는 항공권을 여러 건 제안합니다. 항공권마다 그 일정에 예약할 수 있는 숙소 3곳을 펼쳐 함께 고릅니다.'],
  ['바꾸고 싶은 점은 아래 수정 요청 창에 적습니다', '화면 아래 수정 요청 창에 마우스를 올리면 창이 올라옵니다. 문장으로 적어 보내면 조건을 반영해 다시 검색합니다.'],
  ['숙소 위치와 추천 장소를 확인합니다', '지도에서 숙소 위치를 보고, 요청사항에 맞춘 장소와 활동을 후기 링크와 함께 확인합니다.'],
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
  note: '좌우 버튼으로 5장을 넘긴다. 첫 장은 이전, 마지막 장은 다음 버튼이 비활성. 하단 "다시 보지 않기"를 체크하고 닫으면 다시 뜨지 않는다.',
  html: () => page({ title: `04 이용 안내 ${n + 1}/${TUT.length}`, cls: 'pg-white has-ovl', body: homeBody() + modal(n) }), ...extra,
});
export const tutorial2 = mk(1);
export const tutorial5 = mk(4, { bps: ['d'] });
