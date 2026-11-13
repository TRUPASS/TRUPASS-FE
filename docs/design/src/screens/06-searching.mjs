// 06 검색 중 — 화면 가운데 지구본 위에서 검색이 진행되는 모습을 보여 준다 (움직임은 src/js/globe.js).
//   항공: 출발 국가(남색)에서 도착 국가(하늘색)로 비행기가 호를 그리며 난다. "적절한 항공편을 검색 중입니다"
//   숙소: 도착 국가를 가까이 당기고 그 영토 위에 호텔 건물이 층층이 올라가기를 반복한다. "숙소를 검색 중입니다"
//   끝나면 07 검색 결과로 넘어간다.
import { page, logo, ic, brandName } from '../lib/ui.mjs';
import { ROUTE, PROMPTS, FLIGHTS, APPLIED } from '../lib/data.mjs';

const STEPS = [['문장 해석', 'parse'], ['항공편 검색', 'flight'], ['숙소 검색', 'stay'], ['결과 정리', 'done']];
const TEXT = {
  flight: ['적절한 항공편을 검색 중입니다', `${ROUTE.from.name}에서 ${ROUTE.to.name}으로 가는 ${APPLIED.flight[1][1]} 출발편을 ${brandName('tripdotcom')}과 ${brandName('expedia')}에서 조회하고 있습니다.`],
  stay: ['숙소를 검색 중입니다', `찾은 항공권 ${FLIGHTS.length}건의 일정마다 ${ROUTE.to.city} 우에노 일대에서 예약할 수 있는 숙소를 찾고 있습니다.`],
  done: ['결과를 정리했습니다', '요청에 가까운 순서로 정리해 보여 드립니다.'],
};
// 지금 단계의 문구 하나만 보이고 읽힌다. 나머지는 숨겨 둔다(스크린리더에도 읽히지 않는다).
const body = () => `<header class="srch-top" data-n="Header">${logo(28, { href: '05-home.html' })}<a class="btn txt n sm" href="05-home.html" data-n="Cancel">검색 취소</a></header>
<main class="srch" data-n="Main">
<div class="globe" data-n="Globe"><canvas id="globe" width="560" height="560" role="img" aria-label="${ROUTE.from.name}에서 ${ROUTE.to.name}으로 가는 경로를 표시한 지구본"></canvas></div>
<div class="srch-lg" data-n="Legend"><span class="lg-c"><i class="from"></i>${ROUTE.from.name} 출발</span><span class="lg-c"><i class="to"></i>${ROUTE.to.name} 도착</span></div>
<p class="vh" role="status" data-say></p>
<div class="srch-tx" data-n="Status">${Object.entries(TEXT).map(([k, [h, d]]) => `<div class="srch-t" data-st="${k}" data-n="Text/${k}"><h1 class="srch-h">${h}<span class="dots" aria-hidden="true"><span></span><span></span><span></span></span></h1><p class="t-md c2">${d}</p></div>`).join('')}</div>
<ol class="srch-sp" aria-label="검색 단계" data-n="Steps">${STEPS.map(([l, k], i) => `${i ? '<li class="ln" aria-hidden="true"></li>' : ''}<li class="sp" data-sp="${k}">${ic('checkmark', 12)}<b>${l}</b></li>`).join('')}</ol>
<div class="srch-rc" data-n="Prompts">${PROMPTS.map(p => `<span class="q">${ic(p.icon, 16)}<span data-prompt="${p.k}">${p.v}</span></span>`).join('')}</div>
<a class="t-sm lnk" href="07-result.html" data-skip data-n="Skip">결과로 바로 가기</a>
</main>`;
const attrs = freeze => `data-globe='${JSON.stringify(ROUTE)}' data-next="07-result.html" data-stage="${freeze || 'flight'}"${freeze ? ` data-freeze="${freeze}"` : ''}`;
const SCRIPTS = ['assets/vendor/d3-array.min.js', 'assets/vendor/d3-geo.min.js', 'assets/vendor/topojson-client.min.js', 'assets/geo/world.js', 'js/globe.js'];

export const searching = {
  id: '06-searching', no: '06', name: '검색 중 · 항공편', kind: 'viewport',
  note: '회원가입(또는 로그인) 뒤 검색이 도는 동안의 화면. 가운데 지구본이 대한민국(남색)과 일본(하늘색) 쪽으로 돌아 들어오고, 인천에서 도쿄로 비행기가 호를 그리며 날기를 되풀이한다. 아래에는 "적절한 항공편을 검색 중입니다"와 조회 중인 출처, 단계, 적어 둔 문장을 보여 준다. 항공편 검색이 끝나면 같은 화면에서 숙소 검색 장면으로 넘어간다.',
  html: () => page({ title: '06 검색 중 · 항공편', tab: '검색 중', cls: 'pg-srch', body: body(), scripts: SCRIPTS, attrs: attrs('') }),
};
export const searchingStay = {
  id: '06-searching-stay', no: '06', name: '검색 중 · 숙소', kind: 'viewport',
  note: '숙소 검색 장면(같은 화면의 다음 단계). 지구본이 일본을 가까이 당기고, 그 영토 위 다섯 곳에 호텔 건물이 한 층씩 올라가 간판이 붙었다가 사라지기를 되풀이한다. "숙소를 검색 중입니다"로 문구가 바뀌고, 끝나면 07 검색 결과로 넘어간다.',
  html: () => page({ title: '06 검색 중 · 숙소', tab: '검색 중', cls: 'pg-srch', body: body(), scripts: SCRIPTS, attrs: attrs('stay') }),
};
