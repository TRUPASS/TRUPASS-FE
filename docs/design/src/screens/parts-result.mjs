// 07–09 조합 결과 화면의 조각들: 요청 요약, 항공편·숙소 선택표, 숙소 위치와 주변, 선택한 조합, 수정 요청.
import { readFileSync } from 'node:fs';
import { ic, btn, chk, tag, src, won, sgn, pbox, steps, header, footer, page } from '../lib/ui.mjs';
import { REQ, FLIGHTS, BAG } from '../lib/data.mjs';
import { cond } from './06-generating.mjs';

const MAP = JSON.parse(readFileSync(new URL('../../assets/map/meta.json', import.meta.url), 'utf8'));
const radio = on => `<span class="rad${on ? ' on' : ''}" data-n="Radio">${on ? '<span class="dot"></span>' : ''}</span>`;

export const requestSummary = () => `<section class="pnl" data-n="Request"><div class="pnl-b g12"><div class="g4"><span class="t-xs c3">요청 · ${REQ.at}</span><p class="t-md">${REQ.text}</p></div><div class="hr"></div>${cond()}</div></section>`;

const leg = (h, l) => `<span class="t-xs c3"><span class="m-only">${h} · </span>${l.d} · ${l.no}</span><div class="row g6" data-n="Times"><span class="t-h3 num">${l.dep}</span><span class="t-sm c2">${l.from}</span>${ic('arrow--right', 14, 'c3')}<span class="t-h3 num">${l.arr}</span><span class="t-sm c2">${l.to}</span></div><span class="t-xs c3">직항 · ${l.dur}</span>`;
export const flightPanel = ({ sel = 'F1', bag = false } = {}) => `<section class="pnl" data-n="Flights">
<div class="pnl-h jb"><div class="row g10">${ic('plane', 20)}<h2 class="t-h3">항공편</h2><span class="t-sm c3">왕복 · 성인 2명 · ${FLIGHTS.length}건</span></div><span class="t-xs c3 dt-only">요금 조회 ${REQ.at}</span></div>
<div class="ot-h dt-only" data-n="Columns"><span class="c-sel"></span><span class="c-air">항공사</span><span class="c-leg">가는 편</span><span class="c-leg">오는 편</span><span class="c-price tr">요금 · 출처</span></div>
${FLIGHTS.map((f, i) => `<label class="or${i ? '' : ' first'}${f.id === sel ? ' on' : ''}" data-n="Option/${f.air} ${f.out.no}"><div class="c-sel">${radio(f.id === sel)}</div><div class="c-air"><div class="row g6"><span class="t-md w6">${f.air}</span>${f.tag ? tag(f.tag, 'b') : ''}</div><span class="t-xs c3">${f.cls} · ${f.bag}</span></div><div class="c-leg" data-n="Outbound">${leg('가는 편', f.out)}</div><div class="c-leg" data-n="Inbound">${leg('오는 편', f.back)}</div><div class="c-price"><span class="t-h3 num">${won(f.price)}</span>${src(f.src)}</div></label>`).join('\n')}
<div class="addon" data-n="AddOn">${chk(`${BAG.label} <span class="c3">· ${BAG.sub}</span>`, bag)}<span class="t-sm num w5 fn">${sgn(BAG.price)}</span></div>
</section>`;

export const hotelPanel = ({ list, sel, note = '' }) => `<section class="pnl" data-n="Hotels">
<div class="pnl-h jb"><div class="row g10">${ic('hotel', 20)}<h2 class="t-h3">숙소</h2><span class="t-sm c3">3박 · 2인 1실 · ${list.length}건${note ? ' · ' + note : ''}</span></div><span class="t-xs c3 dt-only">세금 · 봉사료 포함</span></div>
${list.map((h, i) => `<label class="or ho${i ? '' : ' first'}${h.id === sel ? ' on' : ''}" data-n="Option/${h.name}"><div class="c-sel">${radio(h.id === sel)}</div><img class="th" src="../assets/${h.photo}" width="96" height="72" alt="" data-n="Photo" style="width:96px;height:72px;border-radius:4px"><div class="c-info"><div class="row g6 wrap"><span class="t-md w6">${h.name}</span>${h.tag ? tag(h.tag, h.tag === '변경' ? 'y' : 'b') : ''}</div><span class="t-sm c2">${h.grade} · ${h.area}</span><span class="t-sm c2">${h.room} · ${h.meal}</span><span class="t-xs c3">${h.cancel}</span></div><div class="c-price"><span class="t-h3 num">${won(h.price)}</span>${src(h.src)}</div></label>`).join('\n')}
</section>`;

// 지도 핀: 위경도 → 합성 이미지 안의 위치(%)
const proj = (m, lat, lon) => {
  const n = 2 ** m.z * 256;
  const x = (lon + 180) / 360 * n - m.x0;
  const y = (1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * n - m.y0;
  return `left:${(x / m.w * 100).toFixed(2)}%;top:${(y / m.h * 100).toFixed(2)}%`;
};
const pins = (area, key, cls) => {
  const m = MAP[key];
  return area.groups.flatMap(g => g.items).map(p => `<span class="pin ${cls}" style="${proj(m, p.lat, p.lon)}" data-n="Pin/${p.no}">${p.no}</span>`).join('')
    + `<span class="pin h ${cls}" style="${proj(m, area.hotel.lat, area.hotel.lon)}" data-n="Pin/Hotel">${ic('hotel', 18)}</span><span class="pin-l ${cls}" style="${proj(m, area.hotel.lat, area.hotel.lon)}" data-n="PinLabel">${area.hotel.name}</span>`;
};
export const areaPanel = area => `<section class="pnl" data-n="Area">
<div class="pnl-h jb"><div class="row g10">${ic('location', 20)}<h2 class="t-h3">숙소 위치와 주변</h2><span class="t-sm c3">${area.hotel.name} 기준</span></div><a class="t-sm lnk w5 row g4 dt-only" style="display:flex">큰 지도로 보기${ic('launch', 14)}</a></div>
<div class="pnl-b g20">
<div class="map" data-n="Map"><img class="dk dt-only" src="../assets/map/${area.key}.jpg" width="880" height="480" alt="" data-n="MapImage"><img class="mb m-only" src="../assets/map/${area.key}_m.jpg" width="716" height="440" alt="" data-n="MapImage">${pins(area, area.key, 'dt-only')}${pins(area, area.key + '_m', 'm-only')}<span class="map-attr">© OpenStreetMap contributors</span></div>
<div class="pg3" data-n="Places">${area.groups.map(g => `<div data-n="Group/${g.title}"><div class="row jb g8"><span class="t-sm w6">${g.title}</span><span class="t-xs c3">${g.sub}</span></div><div data-n="List">${g.items.map(p => `<a class="pl" data-n="Place/${p.name}"><img src="../assets/${p.photo}" width="56" height="56" alt="" data-n="Photo" style="width:56px;height:56px;border-radius:4px"><div class="grow g2"><div class="row g6 top"><span class="pno">${p.no}</span><span class="t-sm w5 grow">${p.name}</span></div><span class="t-xs c3">${p.kind}</span><span class="t-xs c2">${p.walk} · ${p.dist}</span></div></a>`).join('')}</div></div>`).join('')}</div>
<span class="t-xs c3">지도 © OpenStreetMap contributors · 장소 사진 Wikimedia Commons (라이선스는 각 사진 원문 참고)</span>
</div></section>`;

// 오른쪽: 선택한 조합
export const summaryPanel = ({ c, ver, prev, changed = [] }) => `<section class="pnl" data-n="Summary">
<div class="pnl-h jb"><h2 class="t-h3">선택한 조합</h2><span class="t-xs c3 num">${ver}</span></div>
<div class="pnl-b g12">
<div data-n="Lines">${c.lines.map((l, i) => `<div class="sl${i ? '' : ' first'}" data-n="Line"><span class="k">${l.k}</span><div class="grow g2"><div class="row g6 wrap"><span class="t-sm w5">${l.t}</span>${changed.includes(l.k) ? tag('변경', 'y') : ''}</div><span class="t-xs c3">${l.s}</span></div><span class="t-sm num w5 fn">${won(l.p)}</span></div>`).join('')}</div>
<div class="hr"></div>
<div class="g4" data-n="Total"><div class="row jb"><span class="t-md w6">합계 <span class="t-sm c3 w4">성인 2명</span></span><span class="t-h2 num">${won(c.total)}</span></div>${prev ? `<div class="row jb"><span class="t-sm c2">변경 전</span><span class="t-sm c3 num del">${won(prev)}</span></div>` : ''}<div class="row jb"><span class="t-sm c2">예산 ${won(REQ.budget)} 대비</span><span class="t-sm cok w5 num">${won(c.left)} 여유</span></div></div>
${btn('이 조합으로 결제', { kind: 'pri', size: 'lg', cls: 'fill d-only', n: 'Pay' })}
<span class="t-xs c3">결제 단계에서 결제 권한의 한도와 허용 항목을 확인합니다. 요금은 결제 직전에 한 번 더 조회합니다.</span>
</div></section>`;

export const revisePanel = ({ text = '', versions = [] } = {}) => `<section class="pnl" data-n="Revise">
<div class="pnl-h"><h2 class="t-h3">수정 요청</h2></div>
<div class="pnl-b g12"><p class="t-sm c2">위 선택지에 없는 변경은 문장으로 요청해 주세요. 조건을 반영해 조합을 다시 만듭니다.</p>
${pbox({ sm: 1, n: 'RevisePrompt', text, focus: !!text, count: text.length, max: 300, ph: '예) 숙소를 우에노 미술관 근처로 바꿔 주세요', cta: '다시 조합', ckind: text ? 'pri' : '', cicon: 'renew', dis: false })}
${versions.length ? `<div data-n="Versions">${versions.map(([v, t, d, on]) => `<div class="ver" data-n="Version"><span class="v ${on ? 'cb' : 'c3'}">${v}</span><div class="grow g2"><span class="${on ? 'w5' : 'c2'}">${d}</span><span class="t-xs c3 num">${t}</span></div>${on ? '<span class="t-xs c3 fn">현재</span>' : '<a class="t-xs lnk w5 fn">보기</a>'}</div>`).join('')}</div>` : ''}
</div></section>`;

export const ctaBar = c => `<div class="cta-bar tm-only" data-n="BottomBar"><div class="g2"><span class="t-xs c3">합계 · 성인 2명</span><span class="t-h3 num">${won(c.total)}</span></div>${btn('이 조합으로 결제', { kind: 'pri', size: 'lg', n: 'Pay' })}</div>`;

export const resultPage = ({ title, top = '', main, rail, c }) => page({ title, body: `${header({ kind: 'in', on: '새 요청' })}
<main class="main" data-n="Main"><div class="cx g20" data-n="Content">
<div class="pt" data-n="Title"><h1 class="t-h1">조합 결과</h1>${steps(1)}</div>
<div class="two"><div class="two-m" data-n="MainColumn">${top}${main}</div><aside class="two-r" data-n="Rail">${rail}</aside></div>
</div></main>
${footer()}
${ctaBar(c)}` });
