// 03 회원 정보 입력 — Google 로 처음 가입했을 때 한 번만 거친다. 한 줄로 내려가는 폼 하나만 둔다.
// 입력 순서: 이메일(확인) → 닉네임 → 출생 연도 → 성별(선택) → 여행 관심사 → 약관.
// 칸은 전부 실제 input · select · checkbox · radio 다. 이름(name)을 주지 않아 주소에 값이 실리지 않는다.
import { page, header, footer, btn, inp, sel, fld, chk, rad, opt } from '../lib/ui.mjs';
import { U } from '../lib/data.mjs';

const INTERESTS = [['미식 · 맛집', 0], ['관광 · 명소', 0], ['쇼핑', 0], ['휴양 · 온천', 0], ['문화 · 예술', 1], ['건축 · 도시 산책', 1], ['자연 · 야외 활동', 0], ['테마파크 · 체험', 0]];
const TERMS = [['(필수) Trupass 이용약관', 1, 1], ['(필수) 개인정보 수집 · 이용', 1, 1], ['(선택) 여행 혜택 · 알림 수신', 0, 0]];
const YEARS = Array.from({ length: 2008 - 1940 + 1 }, (_, i) => (2008 - i) + '년');

const form = () => `<form class="pnl su-form" action="06-searching.html" method="get" data-n="Form">
<div class="pnl-b g24" data-n="Fields">
  ${fld('이메일', inp(U.mail, { id: 'su-mail', type: 'email', ro: 1, hint: 1, after: '<span class="t-xs c3 fn">Google 계정</span>' }), { for: 'su-mail', hint: '영수증과 예약 확정서가 이 주소로 발송됩니다.' })}
  <div class="f2">
    ${fld('닉네임', inp(U.nick, { id: 'su-nick', max: 12, auto: 'nickname', hint: 1, after: `<span class="t-xs c3 fn num" data-len>${U.nick.length} / 12</span>` }), { for: 'su-nick', hint: '2~12자. 화면과 알림에 표시됩니다.' })}
    ${fld('출생 연도', sel(YEARS, U.birth + '년', { id: 'su-birth', hint: 1 }), { for: 'su-birth', hint: '연령대에 맞는 추천에 사용합니다.' })}
  </div>
  ${fld('성별', `<div class="radios" data-n="Radios">${rad('여성', 1, { name: 'gender' })}${rad('남성', 0, { name: 'gender' })}${rad('선택 안 함', 0, { name: 'gender' })}</div>`, { opt: '선택 항목' })}
  ${fld('여행 관심사', `<div class="tiles t3" data-max="3" data-n="Options">${INTERESTS.map(([l, on]) => opt(l, on)).join('')}</div>`, { opt: '최대 3개', hint: '추천 장소와 활동을 고르는 기준이 됩니다. 설정에서 언제든 바꿀 수 있습니다.' })}
</div>
<div class="hr"></div>
<div class="pnl-b g10" data-n="Terms">
  ${chk('약관 전체 동의', 0, { tcls: 'w6', at: 'data-toggle="all"' })}
  <div class="hr"></div>
  ${TERMS.map(([l, on, req]) => `<div class="term" data-n="Term">${chk(l, on, { at: 'data-toggle="term"', req })}<button type="button" class="tbtn n t-sm fn" aria-label="${l.replace(/^\([^)]*\)\s*/, '')} 보기">보기</button></div>`).join('')}
</div>
<div class="pnl-f" data-n="Actions"><span class="t-sm c3 dt-only">가입을 마치면 적어 둔 조건으로 바로 검색합니다.</span>${btn('가입하고 검색 시작', { kind: 'pri', size: 'lg', type: 'submit', n: 'Submit' })}</div>
</form>`;

export default {
  id: '03-signup', no: '03', name: '회원 정보 입력 · 최초 1회', kind: 'page',
  note: '가운데 한 줄 폼 하나만 둔다(오른쪽 보조 상자 없음). 이메일은 Google 계정에서 가져와 확인만 하고, 나이는 출생 연도로 받는다. 성별은 선택 항목, 관심사는 최대 3개. [가입하고 검색 시작]을 누르면 06 검색으로 넘어간다.',
  html: () => page({ title: '03 회원 정보 입력', cls: 'veil-in', body: `${header({ kind: 'bare', mail: U.mail })}
<main class="main" data-n="Main"><div class="cx w680 g24" data-n="Content">
<div class="g8 su-hd" data-n="Title"><h1 class="t-h1">회원 정보 입력</h1><p class="t-md c2">Google 계정으로 처음 오셨습니다. 한 번만 입력하면 되며, 설정에서 언제든 바꿀 수 있습니다.</p></div>
${form()}
</div></main>
${footer()}` }),
};
