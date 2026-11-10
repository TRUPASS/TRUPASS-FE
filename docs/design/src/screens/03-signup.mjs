// 03 회원 정보 입력 — Google 로 처음 가입했을 때 한 번만 거친다. 한 줄로 내려가는 폼 하나만 둔다.
// 입력 순서: 이메일(확인) → 닉네임 → 출생 연도 → 성별(선택) → 여행 관심사 → 약관.
import { page, header, footer, btn, ic, inp, fld, chk, rad, opt } from '../lib/ui.mjs';
import { U } from '../lib/data.mjs';

const INTERESTS = [['미식 · 맛집', 0], ['관광 · 명소', 0], ['쇼핑', 0], ['휴양 · 온천', 0], ['문화 · 예술', 1], ['건축 · 도시 산책', 1], ['자연 · 야외 활동', 0], ['테마파크 · 체험', 0]];
const TERMS = [['(필수) Trupass 이용약관', 1], ['(필수) 개인정보 수집 · 이용', 1], ['(선택) 여행 혜택 · 알림 수신', 0]];

const form = () => `<form class="pnl su-form" data-n="Form">
<div class="pnl-b g24" data-n="Fields">
  ${fld('이메일', inp(U.mail, { ro: 1, after: '<span class="t-xs c3 fn">Google 계정</span>' }), { hint: '영수증과 예약 확정서가 이 주소로 발송됩니다.' })}
  <div class="f2">
    ${fld('닉네임', inp(U.nick, { focus: 1, after: '<span class="t-xs c3 fn num">2 / 12</span>' }), { hint: '2~12자. 화면과 알림에 표시됩니다.' })}
    ${fld('출생 연도', inp(U.birth + '년', { after: ic('chevron--down', 16) }), { hint: '연령대에 맞는 추천에 사용합니다.' })}
  </div>
  ${fld('성별', `<div class="radios" data-radios data-n="Radios">${rad('여성', 1)}${rad('남성', 0)}${rad('선택 안 함', 0)}</div>`, { opt: '선택 항목' })}
  ${fld('여행 관심사', `<div class="tiles" data-n="Options">${INTERESTS.map(([l, on]) => opt(l, on, 'data-toggle="interest"')).join('')}</div>`, { opt: '최대 3개 · 2개 선택됨', hint: '추천 장소와 활동을 고르는 기준이 됩니다. 설정에서 언제든 바꿀 수 있습니다.' })}
</div>
<div class="hr"></div>
<div class="pnl-b g10" data-n="Terms">
  ${chk('약관 전체 동의', 0, { tcls: 'w6', at: 'data-toggle="all"' })}
  <div class="hr"></div>
  ${TERMS.map(([l, on]) => `<div class="term" data-n="Term">${chk(l, on, { at: 'data-toggle="term"' })}<a class="t-sm c3 ul fn">보기</a></div>`).join('')}
</div>
<div class="pnl-f" data-n="Actions"><span class="t-sm c3 dt-only">가입을 마치면 적어 둔 조건으로 바로 검색합니다.</span>${btn('가입하고 검색 시작', { kind: 'pri', size: 'lg', arr: true, href: '06-searching.html', n: 'Submit' })}</div>
</form>`;

export default {
  id: '03-signup', no: '03', name: '회원 정보 입력 · 최초 1회', kind: 'page',
  note: '가운데 한 줄 폼 하나만 둔다(오른쪽 보조 상자 없음). 이메일은 Google 계정에서 가져와 확인만 하고, 나이는 출생 연도로 받는다. 성별은 선택 항목, 관심사는 최대 3개. [가입하고 검색 시작]을 누르면 06 검색으로 넘어간다.',
  html: () => page({ title: '03 회원 정보 입력', cls: 'veil-in', body: `${header({ kind: 'bare', mail: U.mail })}
<main class="main" data-n="Main"><div class="cx w680 g24" data-n="Content">
<div class="g8 su-hd" data-n="Title"><span class="eyebrow">(회원가입)</span><h1 class="t-display">회원 정보 입력</h1><p class="t-md c2">Google 계정으로 처음 오셨습니다. 한 번만 입력하면 되며, 설정에서 언제든 바꿀 수 있습니다.</p></div>
${form()}
</div></main>
${footer()}` }),
};
