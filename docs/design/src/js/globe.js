/* 06 검색 중 화면의 지구본. canvas + d3-geo(정사영).
   흐름: 지구본이 출발 · 도착 국가 쪽으로 돌아 들어온다 → [항공] 출발 국가에서 도착 국가로 비행기가 호를 그리며 난다(반복)
        → [숙소] 도착 국가를 더 가까이 당기고 그 영토 위에 호텔 건물이 층층이 올라간다(반복) → 결과 화면으로 넘어간다.
   body[data-globe] 에 경로(JSON), body[data-next] 에 다음 화면 주소. body[data-freeze="flight|stay"] 는 한 장면에 멈춘 시안용 화면.
   주소 끝 #still(정지 화면 캡처)이면 한 장면만 그린다. 움직임 줄이기 설정이면 움직임 없이 두 장면을 차례로 보여 주고 넘어간다. */
(function () {
  'use strict';
  var cv = document.getElementById('globe'), d3 = window.d3, G = window.TP_GEO, T = window.topojson;
  if (!cv || !d3 || !G || !T) return;
  var body = document.body, cfg = JSON.parse(body.dataset.globe);
  var still = location.hash === '#still', reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var freeze = body.dataset.freeze || (still ? 'flight' : '');     // 한 장면에 멈춘 화면
  var calm = reduce && !freeze;                                     // 움직임 줄이기: 움직임 없이 장면만 차례로 바꾼다
  if (calm) freeze = 'flight';
  var ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), S = 0;

  var INK = '#1c1f5a', SKY = '#4fa6e4', SKY_D = '#1971b6', SEA = '#e3eefa', LAND = '#fbfcff', EDGE = 'rgba(28,31,90,.24)', GRID = 'rgba(28,31,90,.06)';
  var world = T.feature(G.world, G.world.objects.countries).features;
  var detail = {}; G.detail.features.forEach(function (f) { detail[f.id] = f; });
  var coarse = world.filter(function (f) { return !detail[String(f.id)]; });
  var fine = G.detail.features;
  var FROM = cfg.from, TO = cfg.to;
  var mid = d3.geoInterpolate([FROM.lon, FROM.lat], [TO.lon, TO.lat])(0.5);
  // 장면: 시작(멀리) → 항공(두 나라가 한눈에) → 숙소(도착 국가를 가까이)
  var V0 = { lon: mid[0] - 62, lat: 8, k: 0.5 }, V1 = { lon: mid[0] + 0.6, lat: mid[1] - 0.4, k: 2.7 }, V2 = { lon: 137.4, lat: 37.6, k: 3.5 };
  var view = { lon: V0.lon, lat: V0.lat, k: V0.k };
  var proj = d3.geoOrthographic().clipAngle(90).precision(0.4);
  var path = d3.geoPath(proj, ctx), grat = d3.geoGraticule().step([15, 15])();

  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var eio = function (t) { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var eout = function (t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); };
  var lerpV = function (a, b, t) { return { lon: a.lon + (b.lon - a.lon) * t, lat: a.lat + (b.lat - a.lat) * t, k: a.k + (b.k - a.k) * t }; };

  function resize() {
    var r = cv.getBoundingClientRect(); S = Math.round(r.width);
    cv.width = Math.round(S * dpr); cv.height = Math.round(S * dpr);
  }
  function setProj() { proj.translate([S / 2, S / 2]).scale(S * 0.5 * view.k).rotate([-view.lon, -view.lat]); }
  function fill(f, color) { ctx.beginPath(); path(f); ctx.fillStyle = color; ctx.fill(); }
  function drawGlobe(hot) {
    var r = S * 0.5 * view.k;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, S, S);
    ctx.save(); ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2, 0, 6.2832); ctx.clip();          // 둥근 창
    // 바다
    var g = ctx.createRadialGradient(S / 2 - r * 0.25, S / 2 - r * 0.3, r * 0.1, S / 2, S / 2, r);
    g.addColorStop(0, '#f4f9ff'); g.addColorStop(0.7, SEA); g.addColorStop(1, '#cfdff2');
    ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); path(grat); ctx.strokeStyle = GRID; ctx.lineWidth = 1; ctx.stroke();
    // 땅
    ctx.beginPath(); coarse.forEach(function (f) { path(f); }); fine.forEach(function (f) { if (String(f.id) !== FROM.id && String(f.id) !== TO.id) path(f); });
    ctx.fillStyle = LAND; ctx.fill(); ctx.strokeStyle = EDGE; ctx.lineWidth = 0.8; ctx.stroke();
    // 출발 국가(남색) · 도착 국가(하늘색). hot 은 0–1: 색이 들어오는 정도
    var a = clamp(hot, 0, 1);
    if (a > 0) {
      ctx.globalAlpha = a;
      fill(detail[FROM.id], INK); fill(detail[TO.id], SKY);
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1; ctx.beginPath(); path(detail[FROM.id]); path(detail[TO.id]); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // 창 가장자리
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 0.5, 0, 6.2832); ctx.strokeStyle = 'rgba(28,31,90,.16)'; ctx.lineWidth = 1; ctx.stroke();
  }

  /* 항공: 두 공항을 잇는 호와 그 위를 나는 비행기 */
  function arcPts() {
    var a = proj([FROM.lon, FROM.lat]), b = proj([TO.lon, TO.lat]);
    var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, lift = len * 0.42;
    var c = [(a[0] + b[0]) / 2 + (dy / len) * lift, (a[1] + b[1]) / 2 - (dx / len) * lift];   // 위쪽으로 휜 2차 곡선의 조절점
    if (c[1] > (a[1] + b[1]) / 2) c = [(a[0] + b[0]) / 2 - (dy / len) * lift, (a[1] + b[1]) / 2 + (dx / len) * lift];
    return { a: a, b: b, c: c };
  }
  function qp(q, t) { var u = 1 - t; return [u * u * q.a[0] + 2 * u * t * q.c[0] + t * t * q.b[0], u * u * q.a[1] + 2 * u * t * q.c[1] + t * t * q.b[1]]; }
  function dot(p, color, r, label, dx, align) {
    ctx.beginPath(); ctx.arc(p[0], p[1], r + 4, 0, 6.2832); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();
    ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 6.2832); ctx.fillStyle = color; ctx.fill();
    if (label) {
      ctx.font = '500 13px Outfit, "Gothic A1", sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = align;
      var w = ctx.measureText(label).width + 20, x = p[0] + dx - (align === 'right' ? w - 10 : 10), y = p[1] - 13;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, 26, 13) : ctx.rect(x, y, w, 26); ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(28,31,90,.18)'; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = INK; ctx.fillText(label, p[0] + dx, p[1] + 0.5);
    }
  }
  function plane(p, ang, s) {
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(ang); ctx.scale(s, s);
    ctx.beginPath();                                                    // 위에서 본 기체 (머리가 +x)
    ctx.moveTo(15, 0); ctx.quadraticCurveTo(13, -2.4, 7, -2.4); ctx.lineTo(1.5, -2.4); ctx.lineTo(-5.5, -13); ctx.lineTo(-9, -13); ctx.lineTo(-5, -2.4);
    ctx.lineTo(-10.5, -2.2); ctx.lineTo(-13.5, -6.4); ctx.lineTo(-15.8, -6.4); ctx.lineTo(-14, 0);
    ctx.lineTo(-15.8, 6.4); ctx.lineTo(-13.5, 6.4); ctx.lineTo(-10.5, 2.2); ctx.lineTo(-5, 2.4); ctx.lineTo(-9, 13); ctx.lineTo(-5.5, 13); ctx.lineTo(1.5, 2.4); ctx.lineTo(7, 2.4); ctx.quadraticCurveTo(13, 2.4, 15, 0);
    ctx.closePath();
    ctx.shadowColor = 'rgba(28,31,90,.35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  }
  function drawFlight(t, show) {           // t: 0–1 비행 진행, show: 0–1 나타나는 정도
    var q = arcPts(), n = 48, i;
    ctx.save(); ctx.globalAlpha = show;
    // 전체 경로(점선) + 지나온 길(실선)
    ctx.beginPath(); for (i = 0; i <= n; i++) { var p = qp(q, i / n); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.setLineDash([2, 7]); ctx.lineCap = 'round'; ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(28,31,90,.5)'; ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); for (i = 0; i <= n; i++) { var u = (i / n) * t, p2 = qp(q, u); i ? ctx.lineTo(p2[0], p2[1]) : ctx.moveTo(p2[0], p2[1]); }
    ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    dot(q.a, INK, 5, FROM.city, -16, 'right'); dot(q.b, SKY_D, 5, TO.city, 16, 'left');
    var pos = qp(q, t), ahead = qp(q, Math.min(1, t + 0.02)), back = qp(q, Math.max(0, t - 0.02));
    plane(pos, Math.atan2(ahead[1] - back[1], ahead[0] - back[0]), clamp(S / 360, 1, 1.6));
    ctx.restore();
  }

  /* 숙소: 도착 국가 위에 호텔이 한 층씩 올라간다 */
  var FLOORS = [6, 4, 3, 4, 5];
  function building(p, floors, grow, s) {  // grow: 0–1 (0.86 까지 층이 쌓이고, 그 뒤 지붕과 간판이 붙는다)
    var w = 19 * s, fh = 7.6 * s, built = clamp(grow / 0.86, 0, 1) * floors, full = Math.floor(built), part = built - full, i, y;
    ctx.save(); ctx.translate(Math.round(p[0]), Math.round(p[1]));
    ctx.beginPath(); ctx.ellipse(0, 1.5 * s, w * 0.9, 3.4 * s, 0, 0, 6.2832); ctx.fillStyle = 'rgba(28,31,90,.22)'; ctx.fill();   // 그림자
    for (i = 0; i < full + (part > 0 ? 1 : 0) && i < floors; i++) {
      var a = i < full ? 1 : part, drop = (1 - eout(a)) * 9 * s;
      y = -(i + 1) * fh - drop;
      ctx.globalAlpha = Math.min(1, a * 1.6);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.rect(-w / 2, y, w, fh); ctx.fill(); ctx.stroke();
      ctx.fillStyle = (i + Math.round(p[0])) % 3 === 0 ? '#f0b63a' : SKY;                    // 창문 (가끔 불이 켜진 창)
      ctx.fillRect(-w / 2 + 3.2 * s, y + 2.2 * s, 4 * s, 3.2 * s); ctx.fillRect(w / 2 - 7.2 * s, y + 2.2 * s, 4 * s, 3.2 * s);
    }
    ctx.globalAlpha = 1;
    var cap = clamp((grow - 0.86) / 0.14, 0, 1);
    if (cap > 0) {                                                                           // 지붕 + H 간판
      y = -floors * fh;
      ctx.globalAlpha = cap; ctx.fillStyle = INK;
      ctx.fillRect(-w / 2 - 1.5 * s, y - 2.4 * s, w + 3 * s, 2.4 * s);
      var k = eout(cap), bw = 11 * s * k;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-bw / 2, y - 2.4 * s - 12.5 * s * k, bw, 11 * s * k, 3 * s) : ctx.rect(-bw / 2, y - 14.9 * s, bw, 11 * s); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 ' + (8.5 * s * k).toFixed(1) + 'px Outfit, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('H', 0, y - 2.4 * s - 6.8 * s * k);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  function drawHotels(clock, show) {       // clock: 초. 건물마다 시차를 두고 짓기 → 잠깐 서 있기 → 사라지기를 반복
    var s = clamp(S / 400, 0.95, 1.6), sites = cfg.sites.map(function (c, i) { return { p: proj(c), i: i }; }).sort(function (a, b) { return a.p[1] - b.p[1]; });
    ctx.save();
    sites.forEach(function (o) {
      var per = 3.4, ph = ((clock - o.i * 0.55) % per + per) % per / per;     // 0–1
      var grow = clamp(ph / 0.62, 0, 1), fade = ph > 0.9 ? 1 - (ph - 0.9) / 0.1 : 1;
      if (clock < o.i * 0.55) return;
      ctx.globalAlpha = show * fade; building(o.p, FLOORS[o.i % FLOORS.length], grow, s);
    });
    ctx.restore();
  }

  /* 시간표(초) */
  var T_IN = 1.9, T_FLIGHT = 6.4, T_MOVE = 1.3, T_STAY = 6.2, T_OUT = 0.9, LOOP = 2.3;
  var t0 = 0, raf = 0, stage = '';
  function setStage(s) { if (stage !== s) { stage = s; body.dataset.stage = s; } }
  function render(now) {
    if (!t0) t0 = now;
    var t = (now - t0) / 1000;
    if (freeze === 'flight') { view = V1; setProj(); drawGlobe(1); drawFlight(0.58, 1); setStage('flight'); return; }
    if (freeze === 'stay') { view = V2; setProj(); drawGlobe(1); drawHotels(1.9, 1); setStage('stay'); return; }
    if (t < T_IN) {
      view = lerpV(V0, V1, eio(t / T_IN)); setProj(); drawGlobe(eio((t - T_IN * 0.45) / (T_IN * 0.55))); setStage('flight');
    } else if (t < T_IN + T_FLIGHT) {
      var tf = t - T_IN; view = V1; setProj(); drawGlobe(1);
      var cyc = (tf % LOOP) / LOOP, fly = eio(clamp(cyc / 0.82, 0, 1)), vis = Math.min(1, tf / 0.4) * (cyc > 0.9 ? 1 - (cyc - 0.9) / 0.1 : 1);
      drawFlight(fly, clamp(vis, 0, 1)); setStage('flight');
    } else if (t < T_IN + T_FLIGHT + T_MOVE) {
      view = lerpV(V1, V2, eio((t - T_IN - T_FLIGHT) / T_MOVE)); setProj(); drawGlobe(1); setStage('stay');
    } else if (t < T_IN + T_FLIGHT + T_MOVE + T_STAY) {
      var ts = t - T_IN - T_FLIGHT - T_MOVE; view = V2; setProj(); drawGlobe(1); drawHotels(ts, Math.min(1, ts / 0.3)); setStage('stay');
    } else {
      view = V2; setProj(); drawGlobe(1); drawHotels(1.9, 1); setStage('done');
      if (body.dataset.next) setTimeout(function () { location.href = body.dataset.next; }, T_OUT * 1000);
      return;
    }
    raf = requestAnimationFrame(render);
  }
  function start() {
    resize(); if (S > 0) { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); }
    if (calm) {
      setTimeout(function () { freeze = 'stay'; requestAnimationFrame(render); }, 2600);
      setTimeout(function () { setStage('done'); if (body.dataset.next) location.href = body.dataset.next; }, 5400);
    }
  }
  window.addEventListener('resize', function () { resize(); if (freeze || stage === 'done') requestAnimationFrame(render); });
  // 글꼴이 준비된 뒤에 그린다 (지구본 위 도시 이름표)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
  // 건너뛰기
  var skip = document.querySelector('[data-skip]');
  if (skip) skip.addEventListener('click', function (e) { if (body.dataset.next) { e.preventDefault(); location.href = body.dataset.next; } });
})();
