// 09 숙소 위치와 추천 장소 — 08 에서 조합을 고른 다음 화면.
// 숙소 위치 지도, 요청사항에 맞춘 추천 장소(웹 검색으로 찾은 후기 썸네일과 사이트 링크 포함), 추천 활동을 보여 준다.
// 실제 화면의 지도는 Google 지도다. 시안의 지도 그림은 OpenStreetMap 자료로 만들었고 그 사실을 화면에도 적었다.
import { readFileSync } from 'node:fs';
import { page, header, footer, ic, tag, steps, kv, bottom, DOCK_JS } from '../lib/ui.mjs';
import { AREA, ACTS, PLACE_SRC, V2, REV, REV_PLACES } from '../lib/data.mjs';
import { summaryPanel, ctaBar } from './parts-result.mjs';

const MAP = JSON.parse(readFileSync(new URL('../../assets/map/meta.json', import.meta.url), 'utf8'));
// 지도 핀: 위경도 → 합성 이미지 안의 위치(%)
const proj = (m, lat, lon) => {
  const n = 2 ** m.z * 256;
  const x = (lon + 180) / 360 * n - m.x0;
  const y = (1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * n - m.y0;
  return `left:${(x / m.w * 100).toFixed(2)}%;top:${(y / m.h * 100).toFixed(2)}%`;
};
const pins = (key, cls) => {
  const m = MAP[key], h = AREA.hotel;
  return AREA.groups.flatMap(g => g.items).map(p => `<span class="pin ${cls}" style="${proj(m, p.lat, p.lon)}" data-n="Pin/${p.no}">${p.no}</span>`).join('')
    + `<span class="pin h ${cls}" style="${proj(m, h.lat, h.lon)}" data-n="Pin/Hotel">${ic('hotel', 18)}</span><span class="pin-l ${cls}" style="${proj(m, h.lat, h.lon)}" data-n="PinLabel">${h.name}</span>`;
};
const out = (label, cls = '') => `<a class="lk${cls ? ' ' + cls : ''}" data-n="Link"><span>${label}</span>${ic('launch', 14)}</a>`;

const mapPanel = () => `<section class="pnl" data-n="Map">
<div class="pnl-h jb"><div class="row g10 wrap">${ic('location', 20)}<h2 class="t-h3">숙소 위치</h2><span class="t-sm c3">${AREA.hotel.name}<span class="dt-only"> · ${AREA.hotel.access}</span></span></div>${out('Google 지도<span class="dt-only">에서 열기</span>')}</div>
<div class="pnl-b g12">
<div class="map" data-n="MapView"><img class="dk dt-only" src="../assets/map/${AREA.key}.jpg" width="880" height="480" alt="" data-n="MapImage"><img class="mb m-only" src="../assets/map/${AREA.key}_m.jpg" width="560" height="480" alt="" data-n="MapImage">${pins(AREA.key, 'dt-only')}${pins(AREA.key + '_m', 'm-only')}<div class="map-ctl dt-only" data-n="Zoom"><div class="b">${ic('add', 16)}</div><div class="b ln">${ic('subtract', 16)}</div></div><span class="map-attr">© OpenStreetMap contributors</span></div>
<div class="lgd" data-n="Legend"><div class="lg"><span class="lg-h">${ic('hotel', 12)}</span><span>숙소</span></div>${AREA.groups.map(g => `<div class="lg"><span class="lg-n">${g.items[0].no}–${g.items[g.items.length - 1].no}</span><span>${g.title}</span></div>`).join('')}</div>
<span class="t-xs c3">실제 화면에서는 이 자리에 Google 지도가 들어가고, 숙소와 추천 장소가 같은 번호로 표시됩니다. 시안의 지도 그림은 © OpenStreetMap contributors 자료로 만들었습니다.</span>
</div></section>`;

// 웹 검색으로 찾은 후기 한 건: 썸네일 + 제목 + 사이트 링크
const review = r => `<a class="rv" data-n="Review"><img class="rv-ph" src="../assets/${r.photo}" width="48" height="36" alt="" data-n="Thumb"><div class="grow"><span class="t-sm">${r.t}</span><span class="lk n t-xs"><span>${r.s}</span>${ic('launch', 12)}</span></div></a>`;
const reviews = p => `<div class="pc-rv" data-n="Reviews">${p.rv.length
  ? `<span class="t-xs c3">후기 ${p.rv.length}건 · 웹 검색</span>${p.rv.map(review).join('')}`
  : `<span class="t-xs c3">후기 · 웹 검색</span><span class="t-sm c3">아직 검색된 후기가 없습니다.</span>`}</div>`;
const place = (p, i) => `<div class="pc" data-n="Place/${p.name}">
<img class="pc-ph" src="../assets/${p.photo}" width="112" height="84" alt="" data-n="Photo">
<div class="pc-i" data-n="Info"><div class="row g8 wrap"><span class="pno">${p.no}</span><span class="t-md w6">${p.name}</span>${p.fit ? tag('요청: ' + p.fit, 'b') : ''}</div><span class="t-sm c2">${p.kind} · ${p.why}</span><div class="pc-m" data-n="Meta"><span class="i c2">${ic('pedestrian', 14)}<span>${p.walk} · ${p.dist}</span></span>${p.rate ? `<span class="i">${ic('star--filled', 14, 'star')}<span class="num"><b>${p.rate}</b> <span class="c3">(${p.cnt})</span></span></span>` : ''}${out(p.site)}</div></div>
${reviews(p)}</div>`;
const placesPanel = () => `<section class="pnl clip" data-n="Places">
<div class="pnl-h jb"><div class="row g10 wrap">${ic('map', 20)}<h2 class="t-h3">맞춤 추천 장소</h2><span class="t-sm c3">9곳 · 요청사항과 숙소 위치 기준</span></div><span class="t-xs c3 dt-only fn">검색 ${AREA.at}</span></div>
${AREA.groups.map((g, gi) => `<div class="grp-h${gi ? '' : ' first'}" data-n="Group/${g.title}"><span class="t-sm w6">${g.title}</span><span class="t-xs c3">${g.sub}</span></div>${g.items.map(place).join('\n')}`).join('\n')}
<div class="pn-n" data-n="Note"><span class="t-xs c3">평점 · 후기 수 · 후기 제목은 시안용 예시 값입니다. 장소 사진과 후기 썸네일은 Wikimedia Commons 자료입니다(라이선스는 각 사진 원문 참고).</span></div>
</section>`;

const act = (a, i) => `<div class="pc${i ? '' : ' first'}" data-n="Activity/${a.t}">
<img class="pc-ph" src="../assets/${a.photo}" width="112" height="84" alt="" data-n="Photo">
<div class="pc-i" data-n="Info"><div class="row g8 wrap"><span class="t-md w6">${a.t}</span>${tag('요청: ' + a.fit, 'b')}</div><span class="t-sm c2">${a.d}</span><div class="pc-m" data-n="Meta"><span class="i c2">${ic('time', 14)}<span>${a.time}</span></span>${out('Google 지도에서 경로 보기')}${out('후기 검색')}</div></div></div>`;
const actsPanel = () => `<section class="pnl clip" data-n="Activities">
<div class="pnl-h jb"><div class="row g10 wrap">${ic('pedestrian', 20)}<h2 class="t-h3">추천 활동</h2><span class="t-sm c3">${ACTS.length}건 · 요청사항 기준</span></div></div>
${ACTS.map(act).join('\n')}
</section>`;

const srcPanel = () => `<section class="pnl" data-n="SearchSources">
<div class="pnl-h jb"><h2 class="t-h3">검색 출처</h2><span class="t-xs c3 num">${AREA.at}</span></div>
<div class="pnl-b" style="padding-top:8px;padding-bottom:8px"><div data-n="List">${PLACE_SRC.map(([k, v], i) => kv(k, v, !!i)).join('')}</div></div></section>`;

const DOCK = { ph: '예) 건축물 탐방 장소를 더 넣어 주세요', hint: '장소와 활동을 바뀐 조건으로 다시 검색합니다. 항공권과 숙소 선택은 그대로 둡니다.', egs: ['건축물 탐방 장소를 더', '저녁 식당은 조용한 곳으로', '비 오는 날 갈 곳'] };
const placesPage = ({ title, vp, dock = {} }) => page({ title, cls: 'has-dock' + (vp ? ' vp' : ''), js: DOCK_JS, body: `${header({ kind: 'in', on: '새 검색' })}
<main class="main" data-n="Main"><div class="cx g20" data-n="Content">
<div class="g8" data-n="Title"><div class="pt"><h1 class="t-h1">숙소 위치와 추천 장소</h1>${steps(2)}</div><p class="t-md c2">선택한 숙소 ${AREA.hotel.name}을 기준으로 지도와 후기 검색 결과를 정리했습니다. 장소가 마음에 들면 결제로 넘어갑니다.</p></div>
<div class="two"><div class="two-m" data-n="MainColumn">${mapPanel()}${placesPanel()}${actsPanel()}</div>
<aside class="two-r stick" data-n="Rail">${summaryPanel({ c: V2, ver: `v2 · ${REV.at.slice(11)}`, cta: '이 조합으로 결제', back: '항공권 · 숙소 다시 선택', foot: '결제 단계에서 결제 권한의 한도와 허용 항목을 확인합니다. 요금은 결제 직전에 한 번 더 조회합니다.' })}${srcPanel()}</aside></div>
</div></main>
${footer()}
${bottom({ dock: { ...DOCK, ...dock }, bar: ctaBar(V2, '이 조합으로 결제') })}` });

export const places = {
  id: '09-places', no: '09', name: '숙소 위치와 추천 장소', kind: 'page',
  note: '조합을 고른 다음 화면. 숙소 위치를 지도(실제 화면은 Google 지도)에 표시하고, 요청사항에 맞춘 장소 · 많이 찾는 명소 · 주변 음식점을 같은 번호로 보여 준다. 장소마다 웹 검색으로 찾은 후기를 썸네일과 함께 싣고 후기 사이트로 가는 링크를 단다. 추천 활동도 요청사항의 어느 말과 맞는지 표시한다. 수정 요청 독은 여기서도 아래에 늘 보인다.',
  html: () => placesPage({ title: '09 숙소 위치와 추천 장소' }),
};
export const placesDock = {
  id: '09-places-dock', no: '09', name: '숙소 위치와 추천 장소 · 수정 요청 독 올림', kind: 'viewport', bps: ['d'],
  note: '장소 화면의 수정 요청 독 올림 상태. 움직임 규칙은 07 과 같다. 여기서 보낸 수정 요청은 장소와 활동만 다시 검색하고 항공권과 숙소 선택은 그대로 둔다.',
  html: () => placesPage({ title: '09 숙소 위치와 추천 장소 · 수정 요청 독 올림', vp: 1, dock: { up: 1, text: REV_PLACES.text } }),
};
