// 07 검색 결과 · 07 수정 요청 독 올림 · 08 다시 검색한 결과
import { note } from '../lib/ui.mjs';
import { V1, V2, REQ, REV, FLIGHTS } from '../lib/data.mjs';
import { summaryPanel, historyPanel, resultPage } from './parts-result.mjs';

const T1 = REQ.at.slice(11), T2 = REV.at.slice(11);
const NEXT = { cta: '추천 장소 보기', href: '09-places.html', foot: '다음 화면에서 숙소 위치와 맞춤 추천 장소를 확인한 뒤 결제로 넘어갑니다.' };
const HEAD = `항공권 ${FLIGHTS.length}건을 찾았습니다`;

export const result = {
  id: '07-result', no: '07', name: '검색 결과 · 항공권과 숙소 선택', kind: 'page',
  note: '검색이 끝나면 항공권 3건이 표의 줄로 하나씩 떠오른다(0.32초 간격). 맨 위에는 적은 문장과 그 문장에서 뽑아 적용한 조건을 한 줄씩 짝지어 보여 준다. 항공권 줄 아래의 [추천 숙소 3곳]을 펼치면 그 일정에 예약할 수 있는 숙소 3곳이 나오고, 같은 자리에서 숙소와 추가 선택(수하물 · 조식)을 고른다. 고르면 오른쪽 [선택한 조합]의 합계가 바로 바뀐다. 수정 요청 독은 화면 아래에 내려간 상태로 늘 보인다.',
  html: () => resultPage({ title: '07 검색 결과', head: HEAD, c: V1, rail: summaryPanel({ c: V1, ver: `v1 ${T1}`, ...NEXT }) }),
};
export const resultDock = {
  id: '07-result-dock', no: '07', name: '검색 결과 · 수정 요청 독 올림', kind: 'viewport',
  note: '수정 요청 독의 올림 상태. 머리줄을 누르거나 마우스를 올리거나 입력을 시작하면 220ms 동안 올라오고, 입력 없이 포인터가 벗어난 채 4초가 지나면 다시 내려간다. 글자가 남아 있거나 입력 중이면 내려가지 않는다.',
  html: () => resultPage({ title: '07 검색 결과 · 수정 요청 독 올림', head: HEAD, c: V1, vp: 1, open: true, dock: { up: 1, text: REV.text },
    rail: summaryPanel({ c: V1, ver: `v1 ${T1}`, ...NEXT }) }),
};
export const result2 = {
  id: '08-result-v2', no: '08', name: '다시 검색한 결과 · 변경 표시', kind: 'page',
  note: '수정 요청을 반영해 다시 검색한 v2. 무엇이 바뀌고 무엇을 유지했는지 맨 위에 적고, 바뀐 조건과 새로 찾은 숙소에 표식을 단다. 항공권 3건과 고른 숙소(우에노 스테이 인)는 그대로 두고, 나머지 숙소 두 곳이 우에노역 도보 5분 이내로 바뀐다. 바뀐 숙소가 바로 보이도록 고른 항공권의 숙소를 펼쳐 둔다.',
  html: () => resultPage({ title: '08 다시 검색한 결과', head: '조건을 바꿔 다시 찾았습니다', c: V2, changed: true, open: true, dock: { ph: '예) 조식이 포함된 숙소만 보여 주세요' }, change: { stay: [['위치', '우에노역 도보 5분 이내', '변경']] },
    top: note(`<div class="g2"><span class="w6 c1">수정 요청을 반영해 다시 검색했습니다.</span><span>항공권마다 보여 주는 숙소를 우에노역 도보 5분 이내로 바꿨습니다. 항공권 ${FLIGHTS.length}건과 고르신 우에노 스테이 인은 그대로 두었습니다.</span></div>`, 'b', 'renew'),
    rail: summaryPanel({ c: V2, ver: `v2 ${T2}`, ...NEXT }) + historyPanel([['v2', T2, REV.text, 1], ['v1', T1, '첫 검색', 0, '07-result.html']]) }),
};
