// 검색 중 화면의 지구본을 canvas 에 그린다 (d3-geo, 정사영).
// 흐름: 지구본이 출발 · 도착 국가 쪽으로 돌아 들어온다 → [항공] 출발 국가에서 도착 국가로 비행기가 호를 그리며 난다(반복)
//       → [숙소] 도착 국가를 더 가까이 당기고 그 영토 위에 호텔 건물이 층층이 올라간다(반복) → 끝났음을 알린다.
import {
  geoGraticule,
  geoInterpolate,
  geoOrthographic,
  geoPath,
  type ExtendedFeature,
  type ExtendedFeatureCollection,
  type GeoPermissibleObjects,
} from 'd3-geo';
import { feature } from 'topojson-client';

interface Spot {
  /** ISO 3166-1 숫자 코드 */
  id: string;
  name: string;
  city: string;
  lon: number;
  lat: number;
}
export interface GlobeRoute {
  from: Spot;
  to: Spot;
  /** 숙소가 지어지는 도시들의 좌표 */
  sites: [number, number][];
}
/** 지도 데이터 (src/assets/geo/world.json): 세계 지도(TopoJSON)와, 출발 · 도착 국가 둘레의 자세한 국경(GeoJSON) */
export interface GlobeData {
  world: unknown;
  detail: unknown;
}
export type GlobeStage = 'flight' | 'stay' | 'done';

interface GlobeOptions {
  route: GlobeRoute;
  data: GlobeData;
  /** 한 장면에 멈춘 모습으로 그린다 */
  freeze: '' | 'flight' | 'stay';
  /** 움직임 없이 두 장면을 차례로 보여 주고 끝낸다 (움직임 줄이기 설정) */
  calm: boolean;
  onStage: (stage: GlobeStage) => void;
  /** 검색이 끝났다 → 다음 화면으로 넘어갈 때 */
  onDone: () => void;
}

interface View {
  lon: number;
  lat: number;
  k: number;
}
type Point = [number, number];
type Topo = Parameters<typeof feature>[0];
type TopoObject = Parameters<typeof feature>[1];

const INK = '#1c1f5a';
const SKY = '#4fa6e4';
const SKY_D = '#1971b6';
const SEA = '#e3eefa';
const LAND = '#fbfcff';
const EDGE = 'rgba(28,31,90,.24)';
const GRID = 'rgba(28,31,90,.06)';
const TAU = 6.2832;

// 시간표(초)
const T_IN = 1.9;
const T_FLIGHT = 6.4;
const T_MOVE = 1.3;
const T_STAY = 6.2;
const T_OUT = 0.9;
const LOOP = 2.3;
const FLOORS = [6, 4, 3, 4, 5];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const eio = (v: number) => {
  const t = clamp(v, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const eout = (v: number) => 1 - Math.pow(1 - clamp(v, 0, 1), 3);
const lerp = (a: View, b: View, t: number): View => ({
  lon: a.lon + (b.lon - a.lon) * t,
  lat: a.lat + (b.lat - a.lat) * t,
  k: a.k + (b.k - a.k) * t,
});

/** 지구본을 그리기 시작한다. 돌려주는 함수를 부르면 멈춘다. */
export function runGlobe(cv: HTMLCanvasElement, o: GlobeOptions): () => void {
  const ctx = cv.getContext('2d');
  if (!ctx) return () => {};
  const { from: FROM, to: TO } = o.route;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let S = 0;
  let freeze = o.calm ? 'flight' : o.freeze;

  const topo = o.data.world as { objects: { countries: unknown } };
  const world = (
    feature(
      topo as unknown as Topo,
      topo.objects.countries as TopoObject,
    ) as unknown as ExtendedFeatureCollection
  ).features;
  const fine = (o.data.detail as ExtendedFeatureCollection).features;
  const detail = new Map<string, ExtendedFeature>(fine.map((f) => [String(f.id), f]));
  const coarse = world.filter((f) => !detail.has(String(f.id)));
  const fromLand = detail.get(FROM.id);
  const toLand = detail.get(TO.id);

  const mid = geoInterpolate([FROM.lon, FROM.lat], [TO.lon, TO.lat])(0.5);
  // 장면: 시작(멀리) → 항공(두 나라가 한눈에) → 숙소(도착 국가를 가까이)
  const V0: View = { lon: mid[0] - 62, lat: 8, k: 0.5 };
  const V1: View = { lon: mid[0] + 0.6, lat: mid[1] - 0.4, k: 2.7 };
  const V2: View = { lon: 137.4, lat: 37.6, k: 3.5 };
  let view: View = V0;
  const proj = geoOrthographic().clipAngle(90).precision(0.4);
  const path = geoPath(proj, ctx);
  const grat = geoGraticule().step([15, 15])();
  const at = (c: Point): Point => proj(c) ?? [0, 0];

  function resize() {
    S = Math.round(cv.getBoundingClientRect().width);
    cv.width = Math.round(S * dpr);
    cv.height = Math.round(S * dpr);
  }
  function setProj() {
    proj
      .translate([S / 2, S / 2])
      .scale(S * 0.5 * view.k)
      .rotate([-view.lon, -view.lat]);
  }
  function fill(f: GeoPermissibleObjects, color: string) {
    ctx!.beginPath();
    path(f);
    ctx!.fillStyle = color;
    ctx!.fill();
  }
  const c = ctx;

  // hot 은 0–1: 출발 · 도착 국가에 색이 들어오는 정도
  function drawGlobe(hot: number) {
    const r = S * 0.5 * view.k;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, S, S);
    c.save();
    c.beginPath();
    c.arc(S / 2, S / 2, S / 2, 0, TAU);
    c.clip(); // 둥근 창
    // 바다
    const g = c.createRadialGradient(S / 2 - r * 0.25, S / 2 - r * 0.3, r * 0.1, S / 2, S / 2, r);
    g.addColorStop(0, '#f4f9ff');
    g.addColorStop(0.7, SEA);
    g.addColorStop(1, '#cfdff2');
    c.beginPath();
    path({ type: 'Sphere' });
    c.fillStyle = g;
    c.fill();
    c.beginPath();
    path(grat);
    c.strokeStyle = GRID;
    c.lineWidth = 1;
    c.stroke();
    // 땅
    c.beginPath();
    coarse.forEach((f) => path(f));
    fine.forEach((f) => {
      if (String(f.id) !== FROM.id && String(f.id) !== TO.id) path(f);
    });
    c.fillStyle = LAND;
    c.fill();
    c.strokeStyle = EDGE;
    c.lineWidth = 0.8;
    c.stroke();
    // 출발 국가(남색) · 도착 국가(하늘색)
    const a = clamp(hot, 0, 1);
    if (a > 0 && fromLand && toLand) {
      c.globalAlpha = a;
      fill(fromLand, INK);
      fill(toLand, SKY);
      c.strokeStyle = 'rgba(255,255,255,.75)';
      c.lineWidth = 1;
      c.beginPath();
      path(fromLand);
      path(toLand);
      c.stroke();
      c.globalAlpha = 1;
    }
    c.restore();
    // 창 가장자리
    c.beginPath();
    c.arc(S / 2, S / 2, S / 2 - 0.5, 0, TAU);
    c.strokeStyle = 'rgba(28,31,90,.16)';
    c.lineWidth = 1;
    c.stroke();
  }

  /* 항공: 두 공항을 잇는 호와 그 위를 나는 비행기 */
  interface Arc {
    a: Point;
    b: Point;
    c: Point;
  }
  function arcPts(): Arc {
    const a = at([FROM.lon, FROM.lat]);
    const b = at([TO.lon, TO.lat]);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const lift = len * 0.42;
    // 위쪽으로 휜 2차 곡선의 조절점
    let k: Point = [(a[0] + b[0]) / 2 + (dy / len) * lift, (a[1] + b[1]) / 2 - (dx / len) * lift];
    if (k[1] > (a[1] + b[1]) / 2)
      k = [(a[0] + b[0]) / 2 - (dy / len) * lift, (a[1] + b[1]) / 2 + (dx / len) * lift];
    return { a, b, c: k };
  }
  function qp(q: Arc, t: number): Point {
    const u = 1 - t;
    return [
      u * u * q.a[0] + 2 * u * t * q.c[0] + t * t * q.b[0],
      u * u * q.a[1] + 2 * u * t * q.c[1] + t * t * q.b[1],
    ];
  }
  function dot(
    p: Point,
    color: string,
    r: number,
    label: string,
    dx: number,
    align: 'left' | 'right',
  ) {
    c.beginPath();
    c.arc(p[0], p[1], r + 4, 0, TAU);
    c.fillStyle = 'rgba(255,255,255,.9)';
    c.fill();
    c.beginPath();
    c.arc(p[0], p[1], r, 0, TAU);
    c.fillStyle = color;
    c.fill();
    if (!label) return;
    c.font = '500 13px Outfit, "Gothic A1", sans-serif';
    c.textBaseline = 'middle';
    c.textAlign = align;
    const w = c.measureText(label).width + 20;
    const x = p[0] + dx - (align === 'right' ? w - 10 : 10);
    const y = p[1] - 13;
    c.beginPath();
    c.roundRect(x, y, w, 26, 13);
    c.fillStyle = '#fff';
    c.shadowColor = 'rgba(28,31,90,.18)';
    c.shadowBlur = 12;
    c.fill();
    c.shadowBlur = 0;
    c.fillStyle = INK;
    c.fillText(label, p[0] + dx, p[1] + 0.5);
  }
  function plane(p: Point, ang: number, s: number) {
    c.save();
    c.translate(p[0], p[1]);
    c.rotate(ang);
    c.scale(s, s);
    c.beginPath(); // 위에서 본 기체 (머리가 +x)
    c.moveTo(15, 0);
    c.quadraticCurveTo(13, -2.4, 7, -2.4);
    c.lineTo(1.5, -2.4);
    c.lineTo(-5.5, -13);
    c.lineTo(-9, -13);
    c.lineTo(-5, -2.4);
    c.lineTo(-10.5, -2.2);
    c.lineTo(-13.5, -6.4);
    c.lineTo(-15.8, -6.4);
    c.lineTo(-14, 0);
    c.lineTo(-15.8, 6.4);
    c.lineTo(-13.5, 6.4);
    c.lineTo(-10.5, 2.2);
    c.lineTo(-5, 2.4);
    c.lineTo(-9, 13);
    c.lineTo(-5.5, 13);
    c.lineTo(1.5, 2.4);
    c.lineTo(7, 2.4);
    c.quadraticCurveTo(13, 2.4, 15, 0);
    c.closePath();
    c.shadowColor = 'rgba(28,31,90,.35)';
    c.shadowBlur = 10;
    c.shadowOffsetY = 4;
    c.fillStyle = '#fff';
    c.fill();
    c.shadowColor = 'transparent';
    c.lineWidth = 1.6;
    c.strokeStyle = INK;
    c.lineJoin = 'round';
    c.stroke();
    c.restore();
  }
  // t: 0–1 비행 진행, show: 0–1 나타나는 정도
  function drawFlight(t: number, show: number) {
    const q = arcPts();
    const n = 48;
    c.save();
    c.globalAlpha = show;
    // 전체 경로(점선) + 지나온 길(실선)
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const p = qp(q, i / n);
      if (i) c.lineTo(p[0], p[1]);
      else c.moveTo(p[0], p[1]);
    }
    c.setLineDash([2, 7]);
    c.lineCap = 'round';
    c.lineWidth = 2;
    c.strokeStyle = 'rgba(28,31,90,.5)';
    c.stroke();
    c.setLineDash([]);
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const p = qp(q, (i / n) * t);
      if (i) c.lineTo(p[0], p[1]);
      else c.moveTo(p[0], p[1]);
    }
    c.lineWidth = 2.5;
    c.strokeStyle = INK;
    c.stroke();
    dot(q.a, INK, 5, FROM.city, -16, 'right');
    dot(q.b, SKY_D, 5, TO.city, 16, 'left');
    const pos = qp(q, t);
    const ahead = qp(q, Math.min(1, t + 0.02));
    const back = qp(q, Math.max(0, t - 0.02));
    plane(pos, Math.atan2(ahead[1] - back[1], ahead[0] - back[0]), clamp(S / 360, 1, 1.6));
    c.restore();
  }

  /* 숙소: 도착 국가 위에 호텔이 한 층씩 올라간다 */
  // grow: 0–1 (0.86 까지 층이 쌓이고, 그 뒤 지붕과 간판이 붙는다)
  function building(p: Point, floors: number, grow: number, s: number) {
    const w = 19 * s;
    const fh = 7.6 * s;
    const built = clamp(grow / 0.86, 0, 1) * floors;
    const full = Math.floor(built);
    const part = built - full;
    c.save();
    c.translate(Math.round(p[0]), Math.round(p[1]));
    c.beginPath();
    c.ellipse(0, 1.5 * s, w * 0.9, 3.4 * s, 0, 0, TAU);
    c.fillStyle = 'rgba(28,31,90,.22)';
    c.fill(); // 그림자
    for (let i = 0; i < full + (part > 0 ? 1 : 0) && i < floors; i++) {
      const a = i < full ? 1 : part;
      const drop = (1 - eout(a)) * 9 * s;
      const y = -(i + 1) * fh - drop;
      c.globalAlpha = Math.min(1, a * 1.6);
      c.fillStyle = '#fff';
      c.strokeStyle = INK;
      c.lineWidth = 1.3;
      c.beginPath();
      c.rect(-w / 2, y, w, fh);
      c.fill();
      c.stroke();
      c.fillStyle = (i + Math.round(p[0])) % 3 === 0 ? '#f0b63a' : SKY; // 창문 (가끔 불이 켜진 창)
      c.fillRect(-w / 2 + 3.2 * s, y + 2.2 * s, 4 * s, 3.2 * s);
      c.fillRect(w / 2 - 7.2 * s, y + 2.2 * s, 4 * s, 3.2 * s);
    }
    c.globalAlpha = 1;
    const cap = clamp((grow - 0.86) / 0.14, 0, 1);
    if (cap > 0) {
      // 지붕 + H 간판
      const y = -floors * fh;
      c.globalAlpha = cap;
      c.fillStyle = INK;
      c.fillRect(-w / 2 - 1.5 * s, y - 2.4 * s, w + 3 * s, 2.4 * s);
      const k = eout(cap);
      const bw = 11 * s * k;
      c.beginPath();
      c.roundRect(-bw / 2, y - 2.4 * s - 12.5 * s * k, bw, 11 * s * k, 3 * s);
      c.fill();
      c.fillStyle = '#fff';
      c.font = `600 ${(8.5 * s * k).toFixed(1)}px Outfit, sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('H', 0, y - 2.4 * s - 6.8 * s * k);
      c.globalAlpha = 1;
    }
    c.restore();
  }
  // clock: 초. 건물마다 시차를 두고 짓기 → 잠깐 서 있기 → 사라지기를 반복
  function drawHotels(clock: number, show: number) {
    const s = clamp(S / 400, 0.95, 1.6);
    const sites = o.route.sites
      .map((site, i) => ({ p: at(site), i }))
      .sort((a, b) => a.p[1] - b.p[1]);
    c.save();
    sites.forEach((site) => {
      const per = 3.4;
      const ph = ((((clock - site.i * 0.55) % per) + per) % per) / per; // 0–1
      const grow = clamp(ph / 0.62, 0, 1);
      const fade = ph > 0.9 ? 1 - (ph - 0.9) / 0.1 : 1;
      if (clock < site.i * 0.55) return;
      c.globalAlpha = show * fade;
      building(site.p, FLOORS[site.i % FLOORS.length] ?? 4, grow, s);
    });
    c.restore();
  }

  let t0 = 0;
  let raf = 0;
  let stage = '';
  let dead = false;
  const timers: number[] = [];
  function setStage(s: GlobeStage) {
    if (stage === s) return;
    stage = s;
    o.onStage(s);
  }
  function render(now: number) {
    if (dead) return;
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;
    if (freeze === 'flight') {
      view = V1;
      setProj();
      drawGlobe(1);
      drawFlight(0.58, 1);
      setStage('flight');
      return;
    }
    if (freeze === 'stay') {
      view = V2;
      setProj();
      drawGlobe(1);
      drawHotels(1.9, 1);
      setStage('stay');
      return;
    }
    if (t < T_IN) {
      view = lerp(V0, V1, eio(t / T_IN));
      setProj();
      drawGlobe(eio((t - T_IN * 0.45) / (T_IN * 0.55)));
      setStage('flight');
    } else if (t < T_IN + T_FLIGHT) {
      const tf = t - T_IN;
      view = V1;
      setProj();
      drawGlobe(1);
      const cyc = (tf % LOOP) / LOOP;
      const fly = eio(clamp(cyc / 0.82, 0, 1));
      const vis = Math.min(1, tf / 0.4) * (cyc > 0.9 ? 1 - (cyc - 0.9) / 0.1 : 1);
      drawFlight(fly, clamp(vis, 0, 1));
      setStage('flight');
    } else if (t < T_IN + T_FLIGHT + T_MOVE) {
      view = lerp(V1, V2, eio((t - T_IN - T_FLIGHT) / T_MOVE));
      setProj();
      drawGlobe(1);
      setStage('stay');
    } else if (t < T_IN + T_FLIGHT + T_MOVE + T_STAY) {
      const ts = t - T_IN - T_FLIGHT - T_MOVE;
      view = V2;
      setProj();
      drawGlobe(1);
      drawHotels(ts, Math.min(1, ts / 0.3));
      setStage('stay');
    } else {
      view = V2;
      setProj();
      drawGlobe(1);
      drawHotels(1.9, 1);
      setStage('done');
      timers.push(window.setTimeout(() => !dead && o.onDone(), T_OUT * 1000));
      return;
    }
    raf = requestAnimationFrame(render);
  }
  function start() {
    if (dead) return;
    resize();
    if (S > 0) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(render);
    }
    if (o.calm) {
      timers.push(
        window.setTimeout(() => {
          freeze = 'stay';
          requestAnimationFrame(render);
        }, 2600),
        window.setTimeout(() => {
          if (dead) return;
          setStage('done');
          o.onDone();
        }, 5400),
      );
    }
  }
  const onResize = () => {
    resize();
    if (freeze || stage === 'done') requestAnimationFrame(render);
  };
  window.addEventListener('resize', onResize);
  // 글꼴이 준비된 뒤에 그린다 (지구본 위 도시 이름표)
  void document.fonts.ready.then(start);

  return () => {
    dead = true;
    cancelAnimationFrame(raf);
    timers.forEach((id) => clearTimeout(id));
    window.removeEventListener('resize', onResize);
  };
}
