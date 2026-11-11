// 렌더된 화면(DOM)을 피그마용 노드 트리로 뽑는다.
//   F 프레임(flex → 오토레이아웃) · T 텍스트 · S 벡터(svg) · I 이미지
// 이 파일의 inPage() 는 브라우저 안에서 실행된다(Playwright page.evaluate). 바깥 변수를 참조하면 안 된다.
//
// 사이징 추론 규칙 (CSS → 피그마)
//   flex-grow > 0                → 주축 FILL
//   width/height 가 auto + stretch → 교차축 FILL,  auto + stretch 아님 → HUG,  그 외(px·%) → FIXED
//   부모가 그 축에서 HUG 이면 자식은 FILL 이 될 수 없다 → 측정값 FIXED 로 낮춘다
//   텍스트: 한 줄·왼쪽 정렬이면 자동 폭, 여러 줄이면 폭 고정 + 높이 자동 (줄바꿈은 브라우저 결과를 그대로 옮긴다)
//   position: absolute · fixed → 절대 위치 자식. left/right/top/bottom 중 어느 변에 붙였는지를 제약(cons)으로 옮긴다
//
// 3차 이후 화면에서 더한 것
//   · 스크롤한 자리에서도 뽑는다: 좌표는 그때 보이는 화면(뷰포트) 기준이다
//   · 배경 사진과 그라데이션(background-image)을 프레임의 배경 층(bg)으로 옮긴다
//   · ::before · ::after 를 실제 요소로 바꿔 놓고 뽑는다 (라디오의 점, 이용 방법의 번호, 사진 위 덧씌움)
//   · 입력 칸 · 선택 상자 · 여러 줄 입력의 값(없으면 예시 문구)을 글자로 옮긴다
//   · 글자를 글꼴별로 나눈다: 라틴 글자와 숫자는 첫 글꼴(Outfit), 거기에 없는 글자는 둘째 글꼴(Gothic A1)
//   · 가려진 것(.vh, 닫힌 details 의 내용, 투명도 0)은 건너뛴다
//   · 마스크나 흐림을 쓰는 겹친 배경 층(opts.raster)은 한 장의 그림으로 굽도록 자리만 표시한다 (굽는 일은 run-extract 가 한다)
//   · canvas 는 그려진 그림을 PNG 로 옮긴다

export async function inPage(opts) {
  const O = opts || {};
  const COVER = O.cover || [[0x20, 0x7e], [0xa0, 0x17f]];           // 첫 글꼴에 들어 있는 글자 구간
  const inFirst = c => { for (const r of COVER) if (c >= r[0] && c <= r[1]) return true; return false; };
  const px = v => parseFloat(v) || 0;
  const r2 = v => Math.round(v * 100) / 100;
  const rgba = v => {
    const m = /rgba?\(([^)]+)\)/.exec(v || '');
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    const a = p.length > 3 ? p[3] : 1;
    return a === 0 ? null : { r: p[0], g: p[1], b: p[2], a: r2(a) };
  };
  const rgbaAny = v => {                                              // 투명색도 돌려준다 (그라데이션의 끝점)
    const m = /rgba?\(([^)]+)\)/.exec(v || '');
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: r2(p.length > 3 ? p[3] : 1) };
  };
  const splitTop = s => {                                             // 괄호 밖의 쉼표로 나눈다
    const out = []; let d = 0, cur = '';
    for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; }
    if (cur.trim()) out.push(cur.trim());
    return out;
  };
  const INLINE = new Set(['inline', 'none', 'contents']);
  const cv = document.createElement('canvas').getContext('2d');
  const ascCache = {};
  const ascent = (wt, size, fam) => {
    const k = `${wt} ${size}px "${fam}"`;
    if (!(k in ascCache)) { cv.font = k; ascCache[k] = cv.measureText('Hg').fontBoundingBoxAscent; }
    return ascCache[k];
  };
  // 글꼴 하나로만 그렸을 때의 폭 (자간 없이). 피그마의 글자 층이 그려질 폭이다.
  const natural = (text, st) => { cv.font = `${st.wt} ${st.size}px "${st.fam}"`; return cv.measureText(text).width; };
  // 글자마다 그려질 글꼴을 정한다.
  //   글자 · 숫자: 첫 글꼴에 있으면 첫 글꼴(Outfit), 없으면 둘째 글꼴(Gothic A1)
  //   공백 · 문장 부호 · 기호: 브라우저는 첫 글꼴로 그리지만, 구간이 잘게 쪼개지지 않도록 앞 글자의 글꼴을 따르게 한다
  //   (폭의 차이는 구간마다 자간으로 맞춘다 — 아래 measureText)
  const strong = c => (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a) || c >= 0xc0;
  const famPlan = (s, fams) => {
    const out = new Array(s.length).fill(null);
    for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); if (strong(c) && c !== 0xd7 && c !== 0xf7 && !(c >= 0x2000 && c <= 0x2bff)) out[i] = inFirst(c) || fams.length < 2 ? fams[0] : fams[1]; }
    let last = null;
    for (let i = 0; i < s.length; i++) { if (out[i]) last = out[i]; else if (last) out[i] = last; }
    let next = null;
    for (let i = s.length - 1; i >= 0; i--) { if (out[i]) next = out[i]; else out[i] = next || fams[0]; }
    return out;
  };
  const famsOf = cs => cs.fontFamily.split(',').map(s => s.replace(/["']/g, '').trim());

  // ── 준비 1: ::before · ::after 를 실제 요소로 바꾼다 ──
  // 계산된 스타일을 그대로 옮긴 <span data-ps> 를 넣고, 원래의 의사 요소는 끈다. 그 뒤로는 보통 요소처럼 뽑힌다.
  const counterValue = (el, name) => {
    const has = (v, n) => new RegExp('(?:^|\\s)' + n + '\\s+(-?\\d+)').exec(v);
    let scope = el;
    while (scope && !has(getComputedStyle(scope).counterReset, name)) scope = scope.parentElement;
    scope = scope || document.body;
    const m0 = has(getComputedStyle(scope).counterReset, name);
    let v = m0 ? +m0[1] : 0;
    const w = document.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = w.nextNode())) {
      const cs = getComputedStyle(n);
      if (cs.display !== 'none') { const mi = has(cs.counterIncrement, name); if (mi) v += +mi[1]; }
      if (n === el) break;
    }
    return v;
  };
  const resolveContent = (el, content) => {
    let out = '', m;
    const re = /"((?:[^"\\]|\\.)*)"|counter\(\s*([\w-]+)\s*(?:,\s*([\w-]+)\s*)?\)/g;
    while ((m = re.exec(content))) {
      if (m[1] != null) out += m[1].replace(/\\(.)/g, '$1');
      else { const v = counterValue(el, m[2]); out += m[3] === 'decimal-leading-zero' ? String(v).padStart(2, '0') : String(v); }
    }
    return out;
  };
  // 스크롤 자리마다 다시 뽑으므로(덧씌움의 투명도가 자리마다 다르다) 앞서 넣은 것은 걷어 내고 새로 넣는다
  for (const s of document.querySelectorAll('[data-ps]')) s.remove();
  for (const e of document.querySelectorAll('.__nops')) e.classList.remove('__nops');
  for (const e of document.querySelectorAll('[data-iso], [data-iso-self]')) { e.removeAttribute('data-iso'); e.removeAttribute('data-iso-self'); }
  {
    const SKIP = new Set(['SCRIPT', 'STYLE', 'IMG', 'INPUT', 'TEXTAREA', 'SELECT', 'CANVAS', 'BR', 'OPTION']);
    const jobs = [];
    for (const el of document.querySelectorAll('body *')) {
      if (SKIP.has(el.tagName) || el.closest('svg')) continue;
      if (getComputedStyle(el).display === 'none') continue;
      for (const ps of ['::before', '::after']) {
        const cs = getComputedStyle(el, ps);
        if (!cs.content || cs.content === 'none' || cs.content === 'normal' || cs.display === 'none') continue;
        const span = document.createElement('span');
        span.setAttribute('data-ps', ps);
        for (let i = 0; i < cs.length; i++) { const p = cs[i]; if (p !== 'content') span.style.setProperty(p, cs.getPropertyValue(p)); }
        span.textContent = resolveContent(el, cs.content);
        jobs.push([el, ps, span]);
      }
    }
    if (!document.getElementById('__nops')) {
      const st = document.createElement('style');
      st.id = '__nops';
      st.textContent = '.__nops::before, .__nops::after { content: none !important; display: none !important; }';
      document.head.appendChild(st);
    }
    for (const [el, ps, span] of jobs) { el.classList.add('__nops'); if (ps === '::before') el.insertBefore(span, el.firstChild); else el.appendChild(span); }
  }

  // ── 준비 2: 배경 사진의 원래 크기 ──
  const NAT = {};
  const urls = new Set();
  for (const el of document.querySelectorAll('body *')) {
    const bi = getComputedStyle(el).backgroundImage;
    if (bi && bi !== 'none') for (const m of bi.matchAll(/url\("?([^")]+)"?\)/g)) urls.add(m[1]);
  }
  await Promise.all([...urls].map(u => new Promise(res => { const im = new Image(); im.onload = () => { NAT[u] = { w: im.naturalWidth, h: im.naturalHeight }; res(); }; im.onerror = () => res(); im.src = u; })));

  // ── 텍스트: 글자 단위로 줄과 위치를 잰다 ──
  // nodes: 이 텍스트를 이루는 DOM 텍스트 노드들(인라인 자식 포함, 문서 순서)
  // limit: 말줄임표로 잘리는 글의 오른쪽 한계(화면 좌표). 그 너머의 글자는 버리고 끝에 … 를 붙인다.
  function measureText(nodes, limit) {
    const range = document.createRange();
    const lines = [];
    let cur = null, cut = false;
    for (const tn of nodes) {
      if (cut) break;
      const el = tn.parentElement, cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const fams = famsOf(cs);
      const st0 = { wt: +cs.fontWeight, c: rgba(cs.color), deco: cs.textDecorationLine.includes('line-through') ? 'S' : cs.textDecorationLine.includes('underline') ? 'U' : '', size: px(cs.fontSize) };
      const s = tn.data;
      const plan = famPlan(s, fams);
      for (let i = 0; i < s.length; i++) {
        range.setStart(tn, i); range.setEnd(tn, i + 1);
        const rects = range.getClientRects();
        if (!rects.length) continue;
        const r = rects[rects.length - 1];
        const ws = /\s/.test(s[i]);
        if (ws && r.width < 0.01) continue;                       // 접힌 공백 · 줄 끝 공백
        if (limit != null && r.right > limit) { cut = true; break; }
        const style = { ...st0, fam: plan[i] };
        const sk = JSON.stringify(style);
        if (!cur || r.top >= cur.bottom - 2 || (r.left < cur.right - 2 && r.top > cur.top + 2)) {
          cur = { top: r.top, bottom: r.bottom, left: r.left, right: r.right, segs: [] };
          lines.push(cur);
        }
        cur.top = Math.min(cur.top, r.top); cur.bottom = Math.max(cur.bottom, r.bottom);
        cur.left = Math.min(cur.left, r.left); cur.right = Math.max(cur.right, r.right);
        let seg = cur.segs[cur.segs.length - 1];
        if (!seg || seg.sk !== sk) { seg = { sk, style, text: '', left: r.left, right: r.right, top: r.top, f0: fams[0] }; cur.segs.push(seg); }
        seg.text += ws ? ' ' : s[i];
        seg.right = Math.max(seg.right, r.right);
      }
    }
    if (cut && cur && cur.segs.length) {                            // 말줄임표: 마지막 구간 끝에 붙인다
      const z = cur.segs[cur.segs.length - 1];
      z.text = z.text.replace(/\s+$/, '') + '\u2026';
      z.right += natural('\u2026', z.style);
    }
    for (const l of lines) {                                        // 줄 앞뒤 공백 정리
      while (l.segs.length && !l.segs[0].text.trim()) l.segs.shift();
      while (l.segs.length && !l.segs[l.segs.length - 1].text.trim()) l.segs.pop();
      if (l.segs.length) { l.segs[0].text = l.segs[0].text.replace(/^\s+/, ''); const z = l.segs[l.segs.length - 1]; z.text = z.text.replace(/\s+$/, ''); }
      // 구간의 자간: 브라우저가 그린 폭과 글꼴 하나로 그린 폭의 차이를 글자 수로 나눈다.
      // (공백과 문장 부호는 브라우저에서 첫 글꼴로 그려지고 숫자는 고정폭이라, 그대로 두면 구간 끝이 조금씩 밀린다)
      for (const sg of l.segs) { const n = [...sg.text].length; sg.ls = n ? Math.round((sg.right - sg.left - natural(sg.text, sg.style)) / n * 1000) / 1000 : 0; }
    }
    return lines.filter(l => l.segs.length);
  }

  const shadowOf = v => {                                           // "rgba(...) 0px 2px 30px" → 첫 그림자만
    if (!v || v === 'none') return null;
    const part = splitTop(v)[0];
    const c = rgba(part); const nums = part.replace(/rgba?\([^)]*\)/, '').trim().split(/\s+/).map(px);
    return c ? { x: nums[0] || 0, y: nums[1] || 0, blur: nums[2] || 0, c } : null;
  };

  function textNode(nodes, boxEl, pRect, name) {
    const cs = getComputedStyle(boxEl);
    let limit = null;                                               // text-overflow: ellipsis 로 잘린 한 줄
    if (cs.textOverflow === 'ellipsis' && /hidden|clip/.test(cs.overflowX) && boxEl.scrollWidth > boxEl.clientWidth + 1) {
      const f0 = famsOf(cs)[0];
      limit = boxEl.getBoundingClientRect().right - px(cs.paddingRight) - px(cs.borderRightWidth) - natural('\u2026', { wt: +cs.fontWeight, size: px(cs.fontSize), fam: f0 });
    }
    const lines = measureText(nodes, limit);
    if (!lines.length) return null;
    const fams = famsOf(cs);
    const fam = fams[0];
    const base = { wt: +cs.fontWeight, c: rgba(cs.color), deco: cs.textDecorationLine.includes('line-through') ? 'S' : cs.textDecorationLine.includes('underline') ? 'U' : '', size: px(cs.fontSize) };
    const lh = cs.lineHeight === 'normal' ? Math.round(base.size * 1.5) : px(cs.lineHeight);
    const ls = cs.letterSpacing === 'normal' ? 0 : px(cs.letterSpacing);
    // 문자열과 스타일 구간
    let chars = '';
    const runs = [];
    const outLines = [];
    const count = {};
    lines.forEach((l, li) => {
      if (li) chars += '\n';
      const segs = [];
      for (const sg of l.segs) {
        const s0 = chars.length; chars += sg.text;
        const st = sg.style;
        count[st.fam] = (count[st.fam] || 0) + sg.text.replace(/\s/g, '').length;
        runs.push({ s: s0, e: chars.length, wt: st.wt, c: st.c, deco: st.deco, size: st.size, fam: st.fam, ls: sg.ls });
        segs.push({ t: sg.text, x: r2(sg.left - pRect.left), wt: st.wt, c: st.c, deco: st.deco, size: st.size, fam: st.fam, ls: sg.ls, w: r2(sg.right - sg.left) });
      }
      const maxSize = Math.max(...l.segs.map(s => s.style.size));
      const big = l.segs.find(s => s.style.size === maxSize);
      // 줄 상자의 높이는 첫 글꼴의 치수로 정해진다(다른 글꼴로 그려진 글자도 같은 기준선에 놓인다)
      outLines.push({ y: r2(big.top + ascent(big.style.wt, maxSize, big.f0) - pRect.top), x: r2(l.left - pRect.left), w: r2(l.right - l.left), segs });
    });
    // 이 글의 대표 글꼴: 글자가 가장 많은 글꼴. runs 에는 모든 구간을 남긴다(구간마다 글꼴과 자간이 다르다).
    const main = Object.keys(count).sort((a, b) => count[b] - count[a])[0] || fam;
    const same = r => r.wt === base.wt && JSON.stringify(r.c) === JSON.stringify(base.c) && r.deco === base.deco && r.size === base.size && r.fam === main;
    const uni = runs.every(r => same(r) && Math.abs((r.ls || 0) - ls) < base.size * 0.004);   // 글꼴 · 굵기 · 색 · 자간이 모두 같은 글
    const left = Math.min(...lines.map(l => l.left)), right = Math.max(...lines.map(l => l.right));
    const top = lines[0].top, bottom = lines[lines.length - 1].bottom;
    const ta = cs.textAlign;
    const t = {
      t: 'T', n: name || '', chars, lines: outLines, runs, uni,
      font: { fam: main, f0: fam, wt: base.wt, size: base.size, lh, ls: r2(ls) }, c: base.c, deco: base.deco,
      align: ta === 'center' ? 'CENTER' : ta === 'right' || ta === 'end' ? 'RIGHT' : 'LEFT',
      // 글자 묶음의 실제 범위 (박스가 따로 없을 때 쓴다)
      ix: r2(left - pRect.left), iy: r2((top + bottom) / 2 - lh * lines.length / 2 - pRect.top), iw: r2(right - left), ih: lh * lines.length,
      nowrap: cs.whiteSpace === 'nowrap',
    };
    const sh = shadowOf(cs.textShadow); if (sh) t.tsh = sh;
    return t;
  }

  const isTextLeaf = (el, cs) => {
    if (/flex|grid/.test(cs.display)) return false;
    let has = false;
    const walk = n => {
      for (const c of n.childNodes) {
        if (c.nodeType === 3) { if (c.data.trim()) has = true; continue; }
        if (c.nodeType !== 1) continue;
        if (c.tagName === 'BR') continue;
        if (!INLINE.has(getComputedStyle(c).display) || c.tagName === 'svg' || c.tagName === 'IMG') return false;
        if (walk(c) === false) return false;
      }
      return true;
    };
    return walk(el) !== false && has;
  };
  const textNodesOf = el => { const out = []; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) out.push(n); return out; };

  const radii = (cs, w, h) => {
    const lim = Math.min(w, h) / 2;
    const f = v => { const m = /([\d.]+)(px|%)/.exec(v); if (!m) return 0; return r2(Math.min(lim, m[2] === '%' ? Math.min(w, h) * m[1] / 100 : +m[1])); };
    const a = [f(cs.borderTopLeftRadius), f(cs.borderTopRightRadius), f(cs.borderBottomRightRadius), f(cs.borderBottomLeftRadius)];
    return a.some(Boolean) ? a : null;
  };
  const shadows = cs => {
    if (!cs.boxShadow || cs.boxShadow === 'none') return null;
    const out = [];
    for (const part of cs.boxShadow.split(/,(?![^(]*\))/)) {
      const c = rgba(part); const nums = part.replace(/rgba?\([^)]*\)/, '').replace(/inset/, '').trim().split(/\s+/).map(px);
      if (c) out.push({ x: nums[0] || 0, y: nums[1] || 0, blur: nums[2] || 0, spread: nums[3] || 0, c, inset: /inset/.test(part) });
    }
    return out.length ? out : null;
  };

  // 배경 층: 사진(url)과 선형 그라데이션. 아래에 깔리는 것부터 차례로 돌려준다.
  function bgLayers(cs, w, h) {
    const bi = cs.backgroundImage;
    if (!bi || bi === 'none') return null;
    const layers = splitTop(bi), sizes = splitTop(cs.backgroundSize), poss = splitTop(cs.backgroundPosition);
    const out = [];
    layers.forEach((L, i) => {
      const size = sizes[i % sizes.length] || 'auto', pos = (poss[i % poss.length] || '0% 0%').split(/\s+/);
      let m;
      if ((m = /^url\("?([^")]+)"?\)$/.exec(L))) {
        const nat = NAT[m[1]]; if (!nat) return;
        const key = new URL(m[1], location.href).pathname.replace(/^.*\/assets\//, '');
        let dw = nat.w, dh = nat.h;
        if (size === 'cover' || size === 'contain') { const s = (size === 'cover' ? Math.max : Math.min)(w / nat.w, h / nat.h); dw = nat.w * s; dh = nat.h * s; }
        else if (size !== 'auto') {
          const [a, b] = size.split(/\s+/); const len = (v, full) => v.endsWith('%') ? full * parseFloat(v) / 100 : px(v);
          if (a !== 'auto') dw = len(a, w);
          if (b && b !== 'auto') dh = len(b, h); else if (a !== 'auto') dh = nat.h * dw / nat.w;
          if (a === 'auto' && b && b !== 'auto') dw = nat.w * dh / nat.h;
        }
        const at = (v, room) => v.endsWith('%') ? room * parseFloat(v) / 100 : px(v);
        out.push({ k: 'img', img: key, iw: nat.w, ih: nat.h, x: r2(at(pos[0] || '0%', w - dw)), y: r2(at(pos[1] || '0%', h - dh)), w: r2(dw), h: r2(dh) });
      } else if ((m = /^linear-gradient\((.*)\)$/.exec(L))) {
        const args = splitTop(m[1]);
        let ang = 180;                                              // 기본: 위에서 아래로
        const a0 = args[0];
        if (/^-?[\d.]+(deg|rad|turn)$/.test(a0)) { const v = parseFloat(a0); ang = a0.endsWith('rad') ? v * 180 / Math.PI : a0.endsWith('turn') ? v * 360 : v; args.shift(); }
        else if (/^to\s/.test(a0)) {
          const s = a0.slice(3).trim().split(/\s+/);
          const vx = s.includes('right') ? 1 : s.includes('left') ? -1 : 0, vy = s.includes('bottom') ? 1 : s.includes('top') ? -1 : 0;
          ang = Math.atan2(vx * (s.length > 1 ? h : 1), -vy * (s.length > 1 ? w : 1)) * 180 / Math.PI; args.shift();
        }
        const rad = ang * Math.PI / 180, dx = Math.sin(rad), dy = -Math.cos(rad);
        const len = Math.abs(w * dx) + Math.abs(h * dy);
        const stops = args.map(a => { const c = rgbaAny(a); const rest = a.replace(/rgba?\([^)]*\)/, '').trim(); return { c, p: rest ? (rest.endsWith('%') ? parseFloat(rest) / 100 : px(rest) / (len || 1)) : null }; }).filter(s => s.c);
        if (stops.length < 2) return;
        if (stops[0].p == null) stops[0].p = 0;
        if (stops[stops.length - 1].p == null) stops[stops.length - 1].p = 1;
        for (let a = 0; a < stops.length; a++) {                     // 자리가 빈 끝점은 이웃 사이에 고르게 놓는다
          if (stops[a].p != null) continue;
          let b = a; while (stops[b].p == null) b++;
          const p0 = stops[a - 1].p, p1 = stops[b].p;
          for (let k = a; k < b; k++) stops[k].p = p0 + (p1 - p0) * (k - a + 1) / (b - a + 1);
        }
        // 투명한 끝점은 이웃의 색을 빌린다 (SVG 는 색과 투명도를 따로 섞어서, 그러지 않으면 회색이 낀다)
        stops.forEach((s, k) => { if (s.c.a === 0) { const nb = stops[k + 1] && stops[k + 1].c.a > 0 ? stops[k + 1] : stops[k - 1]; if (nb) s.c = { r: nb.c.r, g: nb.c.g, b: nb.c.b, a: 0 }; } });
        out.push({ k: 'lin', x1: r2(w / 2 - dx * len / 2), y1: r2(h / 2 - dy * len / 2), x2: r2(w / 2 + dx * len / 2), y2: r2(h / 2 + dy * len / 2), stops: stops.map(s => ({ c: s.c, p: r2(s.p) })) });
      }
    });
    return out.length ? out.reverse() : null;
  }

  function svgNode(el, base) {
    const clone = el.cloneNode(true);
    const src = [el, ...el.querySelectorAll('*')], dst = [clone, ...clone.querySelectorAll('*')];
    src.forEach((s, i) => {
      const d = dst[i];
      if (i === 0) return;
      const cs = getComputedStyle(s);
      const tag = s.tagName.toLowerCase();
      if (['path', 'circle', 'rect', 'polygon', 'ellipse', 'line', 'polyline'].includes(tag)) {
        const hex = v => { const c = rgba(v); return c ? '#' + [c.r, c.g, c.b].map(n => Math.round(n).toString(16).padStart(2, '0')).join('') : 'none'; };
        d.setAttribute('fill', hex(cs.fill));
        const fa = rgba(cs.fill); if (fa && fa.a < 1) d.setAttribute('fill-opacity', fa.a);
        if (cs.stroke && cs.stroke !== 'none') { d.setAttribute('stroke', hex(cs.stroke)); d.setAttribute('stroke-width', px(cs.strokeWidth)); }
        if (+cs.opacity < 1) d.setAttribute('opacity', cs.opacity);
      }
      for (const a of ['class', 'style', 'data-n', 'aria-hidden']) d.removeAttribute(a);
    });
    const vb = (el.getAttribute('viewBox') || `0 0 ${base.w} ${base.h}`).split(/\s+/).map(Number);
    const out = { ...base, t: 'S', inner: clone.innerHTML.trim(), vb };
    // 돌려 놓은 아이콘(펼친 줄의 화살표): 감싼 상자는 같으므로 각도만 적어 둔다
    const tf = getComputedStyle(el).transform;
    if (tf && tf !== 'none') { const m = new DOMMatrix(tf); const deg = Math.round(Math.atan2(m.b, m.a) * 180 / Math.PI); if (deg) out.rot = deg; }
    return out;
  }

  // 반환: sw/sh 와, 폭이 FIXED 인 이유(wHard: 명시 폭·줄바꿈 행의 늘어난 칸 → 레이아웃에 의미가 있는 폭)
  function sizing(el, cs, pctx, abs, kind) {
    if (!pctx || abs) return { sw: 'FIXED', sh: 'FIXED', wHard: true };
    if (kind === 'S' || kind === 'I') return { sw: 'FIXED', sh: 'FIXED', wHard: true };
    if (cs.display === 'table-cell') return { sw: 'FIXED', sh: 'FIXED', wHard: true };       // 표의 칸: 열 폭과 줄 높이는 표가 정한 값이다
    const map = el.computedStyleMap();
    const kw = p => { const v = map.get(p); return v ? v.toString() : 'auto'; };
    const wv = kw('width'), hv = kw('height');
    const grow = parseFloat(cs.flexGrow) > 0;
    const sa = cs.alignSelf === 'auto' || cs.alignSelf === 'normal' ? pctx.ai : cs.alignSelf;
    const stretch = sa === 'normal' || sa === 'stretch';
    const o = { wAuto: wv === 'auto', hAuto: hv === 'auto', wHard: false };
    if (grow) o._grow = cs.flexGrow + '|' + (px(cs.flexBasis) === 0 && cs.flexBasis !== 'auto' && cs.flexBasis !== 'content' ? '0' : cs.flexBasis);
    if (pctx.lay === 'H') {
      // 주축(가로). 줄바꿈 행에서 늘어난 칸은 측정값으로 고정한다. 넘치는 행에서는 늘어나지 않았으므로 내용 크기.
      if (grow) { if (pctx.wrap) { o.sw = 'FIXED'; o.wHard = true; } else o.sw = pctx.over ? (o.wAuto ? 'HUG' : 'FIXED') : 'FILL'; }
      else { o.sw = o.wAuto ? 'HUG' : 'FIXED'; o.wHard = !o.wAuto; }
      o.sh = o.hAuto ? (stretch ? 'FILL' : 'HUG') : hv === '100%' ? 'FILL' : 'FIXED';
    } else {
      o.sh = grow ? (pctx.over ? (o.hAuto ? 'HUG' : 'FIXED') : 'FILL') : o.hAuto ? 'HUG' : 'FIXED';
      if (o.wAuto) o.sw = stretch ? 'FILL' : 'HUG';
      else if (wv === '100%') o.sw = 'FILL';
      else { o.sw = 'FIXED'; o.wHard = true; }
    }
    // max-width 에 걸려 폭이 멈춘 컨테이너는 그 폭으로 고정한다 (부모의 가운데 정렬이 그대로 먹는다)
    if (o.sw === 'FILL' && cs.maxWidth !== 'none' && px(cs.maxWidth) > 0 && el.getBoundingClientRect().width >= px(cs.maxWidth) - 0.5) { o.sw = 'FIXED'; o.wHard = true; }
    if (o.sw === 'FILL' && pctx.sw === 'HUG') o.sw = pctx.lay === 'H' && o.wAuto ? 'HUG' : 'FIXED';
    if (o.sh === 'FILL' && pctx.sh === 'HUG') o.sh = pctx.lay === 'V' && o.hAuto ? 'HUG' : 'FIXED';
    if (o.sh === 'HUG' && px(cs.minHeight) > 0) o.minH = px(cs.minHeight);
    return o;
  }

  // 입력 칸 · 선택 상자 · 여러 줄 입력의 글자: 같은 자리에 같은 글꼴로 임시 상자를 놓고 잰 뒤 지운다
  function controlText(el, cs, r) {
    const tag = el.tagName;
    const val = tag === 'SELECT' ? (el.selectedOptions[0] ? el.selectedOptions[0].textContent : '') : el.value;
    const text = val || el.placeholder || '';
    if (!text.trim() || el.type === 'checkbox' || el.type === 'radio' || el.type === 'hidden') return null;
    const color = val ? cs.color : getComputedStyle(el, '::placeholder').color;
    const bl = px(cs.borderLeftWidth) + px(cs.paddingLeft), bt = px(cs.borderTopWidth) + px(cs.paddingTop);
    const w = r.width - bl - px(cs.borderRightWidth) - px(cs.paddingRight), h = r.height - bt - px(cs.borderBottomWidth) - px(cs.paddingBottom);
    const m = document.createElement('div');
    const multi = tag === 'TEXTAREA';
    Object.assign(m.style, {
      position: 'fixed', left: (r.left + bl) + 'px', top: (r.top + bt) + 'px', width: w + 'px', height: h + 'px', margin: '0', padding: '0', border: '0', zIndex: '-1',
      fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontStyle: cs.fontStyle, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing,
      fontVariantNumeric: cs.fontVariantNumeric, textAlign: cs.textAlign, color, display: multi ? 'block' : 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center',
      whiteSpace: multi ? 'pre-wrap' : 'pre', overflowWrap: multi ? 'break-word' : 'normal', overflow: 'visible',
    });
    const inner = document.createElement('span');
    inner.textContent = text;
    m.appendChild(inner);
    document.body.appendChild(m);
    const t = textNode(textNodesOf(inner), inner, r, '');
    m.remove();
    return t;
  }

  let rasterN = 0;
  const rasters = [];
  const RASTER = O.raster || [];

  function visit(el, pRect, pctx) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || el.classList.contains('vh')) return null;        // 화면에는 없는 것
    if (el.checkVisibility && !el.checkVisibility()) return null;                 // 닫힌 details 의 내용
    const r = el.getBoundingClientRect();
    if (r.width < 0.5 || r.height < 0.5) return null;
    const tag = el.tagName.toLowerCase();
    const abs = cs.position === 'absolute' || cs.position === 'fixed';
    const base = { n: el.dataset.n || '', x: r2(r.left - pRect.left), y: r2(r.top - pRect.top), w: r2(r.width), h: r2(r.height) };
    if (cs.visibility === 'hidden' || +cs.opacity === 0) {
      // 보이지는 않지만 자리를 차지하는 요소(나중에 나타나는 단추 등): 흐름 안에 있으면 빈 칸으로 남겨 배치가 어긋나지 않게 한다.
      // 절대 위치이거나, 한 칸에 겹쳐 놓은 grid 의 숨은 장(다음 걸음 · 다음 질문)은 자리를 차지하지 않으므로 건너뛴다.
      if (abs || !pctx || pctx.grid) return null;
      return { ...base, n: base.n || 'Hidden', t: 'F', lay: 'V', sw: 'FIXED', sh: 'FIXED', ja: 'MIN', aa: 'MIN', kids: [] };
    }
    if (abs) {
      base.abs = true;
      // 붙어 있는 변: 아래·오른쪽에 붙은 요소(수정 요청 독, 지도 출처 표기)는 프레임 크기가 바뀌어도 그 변을 따라가야 한다
      const sm = el.computedStyleMap();
      const set = p => { const v = sm.get(p); return !!v && v.toString() !== 'auto'; };
      const ch = set('left') && set('right') ? 'STRETCH' : set('right') ? 'MAX' : 'MIN';
      const cv2 = set('top') && set('bottom') ? 'STRETCH' : set('bottom') ? 'MAX' : 'MIN';
      if (ch !== 'MIN' || cv2 !== 'MIN') base.cons = [ch, cv2];
    }
    if (+cs.opacity < 1) base.op = +cs.opacity;
    if (pctx && +cs.order) base.order = +cs.order;
    // 그리는 순서: 위치를 잡은 요소(absolute · fixed · relative · sticky)는 그렇지 않은 형제보다 위에, z-index 가 크면 더 위에 그려진다.
    // 자식의 순서(흐름)는 문서 순서 그대로 두고, 겹치는 순서만 zi 로 적어 둔다.
    if (cs.position !== 'static') { const z = cs.zIndex === 'auto' ? 0 : parseInt(cs.zIndex, 10) || 0; base.zi = z < 0 ? -1 : 1 + z; }

    if (tag === 'svg') return { ...svgNode(el, base), ...sizing(el, cs, pctx, abs, 'S') };
    if (tag === 'img') {
      const u = new URL(el.currentSrc || el.src);
      return { ...base, t: 'I', img: u.pathname.replace(/^.*\/assets\//, ''), iw: el.naturalWidth, ih: el.naturalHeight, fit: cs.objectFit, rad: radii(cs, r.width, r.height), ...sizing(el, cs, pctx, abs, 'I') };
    }
    if (tag === 'canvas') {
      let data = null;
      try { data = el.toDataURL('image/png'); } catch (e) { data = null; }
      if (!data) return null;
      return { ...base, n: base.n || 'Canvas', t: 'I', data, iw: el.width, ih: el.height, rad: radii(cs, r.width, r.height), ...sizing(el, cs, pctx, abs, 'I') };
    }

    const bw = [px(cs.borderTopWidth), px(cs.borderRightWidth), px(cs.borderBottomWidth), px(cs.borderLeftWidth)];
    const pad = [px(cs.paddingTop), px(cs.paddingRight), px(cs.paddingBottom), px(cs.paddingLeft)];
    const fill = rgba(cs.backgroundColor);
    const fx = shadows(cs);
    const bg = bgLayers(cs, r.width, r.height);
    const control = tag === 'input' || tag === 'textarea' || tag === 'select';
    const hasBox = !!fill || bw.some(Boolean) || pad.some(Boolean) || !!fx || !!bg || control;
    const leaf = !control && isTextLeaf(el, cs);
    const sz = sizing(el, cs, pctx, abs, leaf && !hasBox ? 'T' : 'F');

    if (leaf && !hasBox) {
      const t = textNode(textNodesOf(el), el, pRect, base.n);
      if (!t) return null;
      return { ...base, ...t, ...textSizing(t, sz, cs, pctx), box: true };
    }

    const flex = /flex/.test(cs.display);
    const lay = (flex && cs.flexDirection.startsWith('row')) || cs.display === 'table-row' ? 'H' : 'V';
    const f = { ...base, t: 'F', lay, ...sz, kids: [] };
    if (pad.some(Boolean)) f.pad = pad;
    if (fill) f.fill = fill;
    if (bg) f.bg = bg;
    if (bw.some(Boolean)) {
      const i = bw.findIndex(Boolean);
      f.stroke = { c: rgba([cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor][i]), w: bw };
      if (!f.stroke.c) delete f.stroke;
    }
    const rad = radii(cs, r.width, r.height); if (rad) f.rad = rad;
    if (fx) f.fx = fx;
    if (cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.overflow === 'clip' || cs.overflowX === 'clip') f.clip = true;
    if (flex) {
      const g = lay === 'H' ? px(cs.columnGap) : px(cs.rowGap); if (g) f.gap = g;
      if (cs.flexWrap === 'wrap') { f.wrap = true; const cg = lay === 'H' ? px(cs.rowGap) : px(cs.columnGap); if (cg) f.cgap = cg; }
      const jc = cs.justifyContent, ai = cs.alignItems;
      f.ja = jc === 'center' ? 'CENTER' : jc === 'flex-end' || jc === 'end' ? 'MAX' : jc === 'space-between' ? 'SPACE_BETWEEN' : 'MIN';
      f.aa = ai === 'center' ? 'CENTER' : ai === 'flex-end' || ai === 'end' ? 'MAX' : ai === 'baseline' ? 'BASELINE' : 'MIN';
    } else {
      f.ja = 'MIN'; f.aa = 'MIN';
      if (cs.display === 'table-cell') f.ja = cs.verticalAlign === 'middle' ? 'CENTER' : cs.verticalAlign === 'bottom' ? 'MAX' : 'MIN';   // 칸 안의 세로 정렬
    }
    const over = lay === 'V' ? el.scrollHeight > el.clientHeight + 1 : el.scrollWidth > el.clientWidth + 1;   // 주축으로 넘치는가
    const ctx = { lay, wrap: !!f.wrap, ai: flex ? cs.alignItems : 'stretch', sw: f.sw, sh: f.sh, over, grid: /grid/.test(cs.display) };

    if (control) {                                // 입력 칸: 상자 + 값(또는 예시 문구). 넘치는 글자는 상자에서 잘린다
      f.n = f.n || (tag === 'select' ? 'Select' : tag === 'textarea' ? 'Textarea' : 'Input');
      f.clip = true; f.lay = 'H'; f.aa = tag === 'textarea' ? 'MIN' : 'CENTER';
      const t = controlText(el, cs, r);
      if (t) f.kids.push({ ...t, x: t.ix, y: t.iy, w: t.iw, h: t.ih, sw: 'HUG', sh: 'HUG', ar: 'WH' });
      return f;
    }
    if (leaf) {                                   // 배경·여백이 있는 글자 상자 → 프레임 + 텍스트
      const t = textNode(textNodesOf(el), el, r, '');
      if (t) f.kids.push({ ...t, x: t.ix, y: t.iy, w: t.iw, h: t.ih, ...textSizing(t, { sw: 'FILL', sh: 'HUG', wAuto: true }, cs, ctx) });
      return f;
    }
    // 겹친 배경 층을 한 장으로 굽는 창: 층은 건너뛰고, 구울 자리만 남긴다 (보이는 화면 안쪽만)
    let skip = null;
    if (RASTER.some(s => el.matches(s))) {
      const layers = [...el.children].filter(c => c.classList.contains('lyr'));
      const x0 = Math.max(0, r.left), y0 = Math.max(0, r.top), x1 = Math.min(window.innerWidth, r.right), y1 = Math.min(window.innerHeight, r.bottom);
      if (layers.length && x1 - x0 > 1 && y1 - y0 > 1) {
        const k = String(rasterN++);
        el.setAttribute('data-iso-self', k);
        for (const c of layers) c.setAttribute('data-iso', k);
        rasters.push({ k, x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
        f.kids.push({ t: 'I', n: 'Backdrop', raster: k, x: r2(x0 - r.left), y: r2(y0 - r.top), w: r2(x1 - x0), h: r2(y1 - y0), abs: true, cons: ['STRETCH', 'STRETCH'], sw: 'FIXED', sh: 'FIXED', _i: -1 });
        skip = new Set(layers);
      }
    }
    let idx = 0;
    for (const c of el.childNodes) {
      if (c.nodeType === 1) { if (skip && skip.has(c)) continue; const k = visit(c, r, ctx); if (k) { k._i = idx++; f.kids.push(k); } }
      else if (c.nodeType === 3 && c.data.trim()) {
        const t = textNode([c], el, r, '');
        if (t) {                                 // flex 컨테이너에 바로 놓인 글자: 세로 컨테이너에서는 폭을 채운다
          const fillW = lay === 'V' && /normal|stretch/.test(ctx.ai) && f.sw !== 'HUG';
          f.kids.push({ ...t, x: t.ix, y: t.iy, w: fillW ? r2(r.width - pad[1] - pad[3] - bw[1] - bw[3]) : t.iw, h: t.ih, ...textSizing(t, { sw: fillW ? 'FILL' : 'HUG', wAuto: true }, cs, ctx), _i: idx++ });
        }
      }
    }
    f.kids.sort((a, b) => (a.order || 0) - (b.order || 0) || a._i - b._i);
    for (const k of f.kids) { delete k._i; delete k.order; }
    const flow = f.kids.filter(k => !k.abs);
    // 줄바꿈 행(flex-wrap)인데 실제로는 한 줄에 다 들어간 경우: 줄바꿈을 끈다.
    // (늘어난 칸을 잰 폭으로 고정해 두면 소수점 오차만으로도 피그마에서 줄이 넘어간다. 한 줄이면 늘어나는 칸은 그냥 채우기다)
    if (f.wrap && flow.length && !flow.some(k => k.y > flow[0].y + flow[0].h - 1)) {
      delete f.wrap; delete f.cgap;
      for (const k of flow) if (k._grow && lay === 'H' && k.sw === 'FIXED') { k.sw = 'FILL'; if (k.t === 'T') k.ar = 'H'; }
    }
    // 늘어나는 칸이 여럿인데 비율이나 기준 폭이 다르면(또는 내용 크기에서 출발하면) 피그마의 "채우기"로는 같은 폭이 나오지 않는다 → 잰 크기로 고정한다
    const growers = flow.filter(k => k._grow);
    if (growers.length > 1 && (new Set(growers.map(k => k._grow)).size > 1 || growers.some(k => !k._grow.endsWith('|0')))) {
      for (const k of growers) { if (lay === 'H') { if (k.sw === 'FILL') { k.sw = 'FIXED'; if (k.t === 'T') k.ar = 'H'; } } else if (k.sh === 'FILL') k.sh = 'FIXED'; }
    }
    for (const k of f.kids) delete k._grow;
    // 줄바꿈 행이 실제로 여러 줄로 접혔으면, 접히게 한 폭이 의미가 있다 → 내용 크기 대신 잰 폭으로 고정한다
    if (f.wrap && f.sw === 'HUG' && flow.length > 1) f.sw = 'FIXED';
    // 놓인 자리로 방향 · 간격 · 정렬을 정하는 경우:
    //   grid (칸 하나에 겹쳐 놓고 하나만 보이는 구성, 가로로 흐르는 구성)
    //   flex 가 아닌 상자 안에서 글자와 인라인 조각이 한 줄에 나란히 놓인 구성 (제목 + 깜박이는 점)
    const box = k => (k.t === 'T' ? { x: k.ix, y: k.iy, w: k.iw, h: k.ih } : k);       // 글자는 실제 글자 범위로 본다
    const inRow = flow.length > 1 && flow.every((k, i) => { if (!i) return true; const p = box(flow[i - 1]), c = box(k); return c.x >= p.x + p.w - 0.5 && Math.min(p.y + p.h, c.y + c.h) > Math.max(p.y, c.y); });
    const isGrid = /grid/.test(cs.display);
    if ((isGrid && flow.length) || (!flex && !/^table/.test(cs.display) && inRow)) {
      const cx0 = pad[3] + bw[3], cy0 = pad[0] + bw[0], cw = r.width - cx0 - pad[1] - bw[1], ch = r.height - cy0 - pad[2] - bw[2];
      const horiz = inRow;
      f.lay = horiz ? 'H' : 'V';
      const B = flow.map(box);
      if (flow.length > 1) { const g = horiz ? B[1].x - B[0].x - B[0].w : B[1].y - B[0].y - B[0].h; if (g > 0.5) f.gap = r2(g); else delete f.gap; }
      const a0 = B[0], z0 = B[B.length - 1];
      const before = horiz ? a0.x - cx0 : a0.y - cy0, after = horiz ? cx0 + cw - z0.x - z0.w : cy0 + ch - z0.y - z0.h;
      f.ja = before > 1 && Math.abs(before - after) <= 1.5 ? 'CENTER' : before > 1 && after <= 1 ? 'MAX' : 'MIN';
      const cross = B.map(k => horiz ? [k.y - cy0, cy0 + ch - k.y - k.h] : [k.x - cx0, cx0 + cw - k.x - k.w]);
      const loose = cross.filter(c => c[0] + c[1] > 1);
      f.aa = loose.length && loose.every(c => Math.abs(c[0] - c[1]) <= 2) ? 'CENTER' : loose.length && loose.every(c => c[1] <= 1) ? 'MAX' : 'MIN';
      flow.forEach((k, i) => {                    // 칸을 다 채우지 않는 자식은 채우기가 아니다. 한 줄에 놓인 글자는 자기 폭만 차지한다
        if (horiz && k.t === 'T') { k.x = k.ix; k.w = k.iw; k.sw = 'HUG'; k.ar = 'WH'; }
        if (cross[i][0] + cross[i][1] <= 1) return;
        if (horiz) { if (k.sh === 'FILL') k.sh = k.t === 'T' ? 'HUG' : 'FIXED'; }
        else if (k.sw === 'FILL') { if (k.t === 'T') { if (k.lines.length === 1) { k.sw = 'HUG'; k.ar = 'WH'; } else k.sw = 'FIXED'; } else k.sw = 'FIXED'; }
      });
      // 겹쳐 놓은 칸은 가장 큰 장이 크기를 정한다. 숨은 장을 뺐으므로 남는 자리가 있으면 잰 크기로 고정한다
      if (isGrid) {
        for (const k of flow) if (k.t === 'F' && k.sh === 'HUG') k.sh = 'FIXED';   // 보이는 장도 칸의 높이(가장 큰 장)만큼 늘어나 있다
        const freeMain = before + after > 1, freeCross = loose.length > 0;
        if (horiz) { if (f.sw === 'HUG' && freeMain) f.sw = 'FIXED'; if (f.sh === 'HUG' && freeCross) f.sh = 'FIXED'; }
        else { if (f.sh === 'HUG' && freeMain) f.sh = 'FIXED'; if (f.sw === 'HUG' && freeCross) f.sw = 'FIXED'; }
      }
    }
    if (!flow.length) { if (f.sw === 'HUG') f.sw = 'FIXED'; if (f.sh === 'HUG') f.sh = 'FIXED'; }
    return f;
  }

  // 텍스트의 크기 조절 방식: WH(자동 폭) · H(폭 고정/채움, 높이 자동)
  function textSizing(t, sz, cs, pctx) {
    if (!pctx) return { sw: 'FIXED', sh: 'FIXED', ar: 'H' };
    const multi = t.lines.length > 1;
    if (sz.sw === 'FIXED' && sz.wHard) return { sw: 'FIXED', sh: 'HUG', ar: 'H' };            // 폭이 레이아웃을 정하는 칸
    if (sz.sw === 'FILL' && pctx.lay === 'H') return { sw: 'FILL', sh: 'HUG', ar: 'H' };         // 가로 행에서 남는 폭을 채우는 글
    if (sz.sw === 'FILL' && (multi || t.align !== 'LEFT')) return { sw: 'FILL', sh: 'HUG', ar: 'H' };
    if (sz.sw === 'FIXED' && (multi || t.align !== 'LEFT')) return { sw: 'FIXED', sh: 'HUG', ar: 'H' };
    if (multi) return { sw: 'FIXED', sh: 'HUG', ar: 'H' };                                         // 줄어든 칸 안에서 접힌 글: 접힌 폭 그대로
    return { sw: 'HUG', sh: 'HUG', ar: 'WH' };                                                    // 한 줄 · 왼쪽 정렬 → 자동 폭
  }

  const body = document.body;
  const vw = window.innerWidth, vh = window.innerHeight;
  const root = visit(body, { left: 0, top: 0 }, null);
  // 스크롤한 자리: body 는 문서 맨 위에서 시작하므로, 자식의 좌표를 지금 보이는 화면 기준으로 옮긴다
  const br = body.getBoundingClientRect();
  if (br.left || br.top) for (const k of root.kids) { k.x = r2(k.x + br.left); k.y = r2(k.y + br.top); }
  root.x = 0; root.y = 0; root.w = vw; root.h = vh; root.sw = 'FIXED'; root.sh = 'FIXED'; root.clip = true;
  root.n = body.dataset.n || document.title;
  if (!root.fill) root.fill = { r: 255, g: 255, b: 255, a: 1 };
  root.rasters = rasters;
  return root;
}

// 굽는 동안 한 묶음의 배경 층만 보이게 한다 (브라우저 안에서 실행). k 가 null 이면 되돌린다.
export function isolate(k) {
  let st = document.getElementById('__iso');
  if (!st) { st = document.createElement('style'); st.id = '__iso'; document.head.appendChild(st); }
  st.textContent = k == null ? '' : `body *, body *::before, body *::after { visibility: hidden !important; } [data-iso="${k}"], [data-iso-self="${k}"] { visibility: visible !important; }`;
}
