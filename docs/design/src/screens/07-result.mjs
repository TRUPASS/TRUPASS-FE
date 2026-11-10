// 07 조합 결과 · 08 조합 수정 · 09 재조합 결과
import { note, ic } from '../lib/ui.mjs';
import { HOTELS_V1, HOTELS_V2, AREA_V1, AREA_V2, V1, V1B, V2, REQ, REV } from '../lib/data.mjs';
import { requestSummary, flightPanel, hotelPanel, areaPanel, summaryPanel, revisePanel, resultPage } from './parts-result.mjs';

const T1 = REQ.at.slice(11), T2 = REV.at.slice(11);

export const result = {
  id: '07-result', no: '07', name: '조합 결과', kind: 'page',
  note: '항공편·숙소 조합과 요금 출처(로고+링크), 숙소 위치 지도, 주변 장소 세 묶음(요청 맞춤 · 많이 찾는 명소 · 주변 음식점)을 한 화면에 둔다.',
  html: () => resultPage({ title: '07 조합 결과', c: V1,
    main: requestSummary() + flightPanel() + hotelPanel({ list: HOTELS_V1, sel: 'H1' }) + areaPanel(AREA_V1),
    rail: summaryPanel({ c: V1, ver: `v1 · ${T1}` }) + revisePanel() }),
};
export const revise = {
  id: '08-revise', no: '08', name: '조합 수정 · 옵션 선택과 수정 요청', kind: 'page',
  note: '옵션(수하물 변경)을 체크하면 합계가 바로 바뀌고, 선택지에 없는 변경은 수정 요청 문장으로 보낸다.',
  html: () => resultPage({ title: '08 조합 수정', c: V1B,
    main: requestSummary() + flightPanel({ bag: true }) + hotelPanel({ list: HOTELS_V1, sel: 'H1' }) + areaPanel(AREA_V1),
    rail: summaryPanel({ c: V1B, ver: `v1 · ${T1}`, prev: V1.total, changed: ['수하물'] }) + revisePanel({ text: REV.text }) }),
};
export const result2 = {
  id: '09-result-v2', no: '09', name: '재조합 결과 · 변경 표시', kind: 'page',
  note: '수정 요청을 반영한 v2. 무엇이 바뀌고 무엇을 유지했는지 맨 위에 적고, 바뀐 항목에 "변경" 표식을 단다. 지도와 주변 장소도 새 숙소 기준으로 바뀐다.',
  html: () => resultPage({ title: '09 재조합 결과', c: V2,
    top: note(`<div class="g2"><span class="w6 c1">수정 요청을 반영해 조합을 다시 만들었습니다.</span><span>숙소 지역을 시부야에서 우에노로 바꿨습니다. 항공편과 수하물 옵션은 그대로 두었습니다.</span></div>`, 'b', 'renew'),
    main: requestSummary() + flightPanel({ bag: true }) + hotelPanel({ list: HOTELS_V2, sel: 'H4', note: '우에노 지역' }) + areaPanel(AREA_V2),
    rail: summaryPanel({ c: V2, ver: `v2 · ${T2}`, prev: V1B.total, changed: ['숙소'] }) + revisePanel({ versions: [['v2', T2, REV.text, 1], ['v1', T1, '최초 조합', 0]] }) }),
};
