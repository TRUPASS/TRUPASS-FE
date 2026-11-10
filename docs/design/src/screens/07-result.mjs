// 07 검색 결과 · 07 수정 요청 독 올림 · 08 다시 검색한 결과
import { note } from '../lib/ui.mjs';
import { V1, V1B, V2, REQ, REV } from '../lib/data.mjs';
import { summaryPanel, historyPanel, resultPage } from './parts-result.mjs';

const T1 = REQ.at.slice(11), T2 = REV.at.slice(11);
const NEXT = { cta: '숙소 위치와 추천 장소 보기', foot: '다음 화면에서 숙소 위치와 맞춤 추천 장소를 확인한 뒤 결제로 넘어갑니다.' };

export const result = {
  id: '07-result', no: '07', name: '검색 결과 · 항공권과 숙소 선택', kind: 'page',
  note: '조건에 맞는 항공권을 여러 건 제안한다(날짜를 "전후 3일"로 적었으므로 하루 앞뒤 편도 함께). 항공권마다 [숙소 3곳] 토글을 펼치면 그 일정에 예약할 수 있는 숙소 3곳이 나오고, 같은 자리에서 숙소와 추가 선택(수하물 · 조식)까지 고른다. 수정 요청 독은 화면 아래에 내려간 상태로 늘 보인다.',
  html: () => resultPage({ title: '07 검색 결과', c: V1, rail: summaryPanel({ c: V1, ver: `v1 · ${T1}`, ...NEXT }) }),
};
export const resultDock = {
  id: '07-result-dock', no: '07', name: '검색 결과 · 수정 요청 독 올림', kind: 'viewport',
  note: '수정 요청 독의 올림 상태. 독에 마우스를 올리거나 입력을 시작하면 220ms 동안 올라오고, 입력 없이 포인터가 벗어난 채 4초가 지나면 다시 내려간다. 글자가 남아 있거나 입력 중이면 내려가지 않는다. 터치 화면에서는 머리줄을 누르면 올라온다.',
  html: () => resultPage({ title: '07 검색 결과 · 수정 요청 독 올림', c: V1B, vp: 1, dock: { up: 1, text: REV.text },
    rail: summaryPanel({ c: V1B, ver: `v1 · ${T1}`, prev: V1.total, changed: ['수하물'], ...NEXT }) }),
};
export const result2 = {
  id: '08-result-v2', no: '08', name: '다시 검색한 결과 · 변경 표시', kind: 'page',
  note: '수정 요청을 반영해 다시 검색한 v2. 무엇이 바뀌고 무엇을 유지했는지 맨 위에 적고, 바뀐 항목에 "변경" 표식을 단다. 항공권 4건은 그대로 두고 항공권별 숙소 3곳이 우에노 지역으로 바뀐다.',
  html: () => resultPage({ title: '08 다시 검색한 결과', c: V2, changed: true, dock: { ph: '예) 조식이 포함된 숙소만 보여 주세요' }, extra: [['숙소 지역', '우에노 · 미술관 도보권', '변경']],
    top: note(`<div class="g2"><span class="w6 c1">수정 요청을 반영해 다시 검색했습니다.</span><span>항공권마다 보여 주는 숙소 3곳을 우에노 지역으로 바꿨습니다. 항공권 4건과 수하물 선택은 그대로 두었습니다.</span></div>`, 'b', 'renew'),
    rail: summaryPanel({ c: V2, ver: `v2 · ${T2}`, prev: V1B.total, changed: ['숙소'], ...NEXT }) + historyPanel([['v2', T2, REV.text, 1], ['v1', T1, '첫 검색', 0]]) }),
};
