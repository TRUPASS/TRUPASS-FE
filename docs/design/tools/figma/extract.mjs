// 렌더된 화면(DOM)을 피그마용 노드 트리로 뽑는다.
//   F 프레임(flex → 오토레이아웃) · T 텍스트 · S 벡터(svg) · I 이미지
// 이 파일의 inPage() 는 브라우저 안에서 실행된다(Playwright page.evaluate). 바깥 변수를 참조하면 안 된다.
//
// 사이징 추론 규칙 (CSS → 피그마)
//   flex-grow > 0                → 주축 FILL
//   width/height 가 auto + stretch → 교차축 FILL,  auto + stretch 아님 → HUG,  그 외(px·%) → FIXED
//   부모가 그 축에서 HUG 이면 자식은 FILL 이 될 수 없다 → 측정값 FIXED 로 낮춘다
//   텍스트: 한 줄·왼쪽 정렬이면 자동 폭, 여러 줄이면 폭 고정 + 높이 자동 (줄바꿈은 브라우저 결과를 그대로 옮긴다)

export function inPage() {
  const px = v => parseFloat(v) || 0;
  const r2 = v => Math.round(v * 100) / 100;
  const rgba = v => {
    const m = /rgba?\(([^)]+)\)/.exec(v || '');
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    const a = p.length > 3 ? p[3] : 1;
    return a === 0 ? null : { r: p[0], g: p[1], b: p[2], a: r2(a) };
  };
  const INLINE = new Set(['inline', 'none', 'contents']);
  const cv = document.createElement('canvas').getContext('2d');
  const ascCache = {};
  const ascent = (wt, size, fam) => {
    const k = `${wt} ${size}px ${fam}`;
    if (!(k in ascCache)) { cv.font = k; ascCache[k] = cv.measureText('가Hg').fontBoundingBoxAscent; }
    return ascCache[k];
  };

  // ── 텍스트: 글자 단위로 줄과 위치를 잰다 ──
  // nodes: 이 텍스트를 이루는 DOM 텍스트 노드들(인라인 자식 포함, 문서 순서)
  function measureText(nodes) {
    const range = document.createRange();
    const lines = [];
    let cur = null;
    for (const tn of nodes) {
      const el = tn.parentElement, cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const style = { wt: +cs.fontWeight, c: rgba(cs.color), deco: cs.textDecorationLine.includes('line-through') ? 'S' : cs.textDecorationLine.includes('underline') ? 'U' : '', size: px(cs.fontSize) };
      const sk = JSON.stringify(style);
      const s = tn.data;
      for (let i = 0; i < s.length; i++) {
        range.setStart(tn, i); range.setEnd(tn, i + 1);
        const rects = range.getClientRects();
        if (!rects.length) continue;
        const r = rects[rects.length - 1];
        const ws = /\s/.test(s[i]);
        if (ws && r.width < 0.01) continue;                       // 접힌 공백 · 줄 끝 공백
        if (!cur || r.top >= cur.bottom - 2 || (r.left < cur.right - 2 && r.top > cur.top + 2)) {
          cur = { top: r.top, bottom: r.bottom, left: r.left, right: r.right, segs: [] };
          lines.push(cur);
        }
        cur.top = Math.min(cur.top, r.top); cur.bottom = Math.max(cur.bottom, r.bottom);
        cur.left = Math.min(cur.left, r.left); cur.right = Math.max(cur.right, r.right);
        let seg = cur.segs[cur.segs.length - 1];
        if (!seg || seg.sk !== sk) { seg = { sk, style, text: '', left: r.left, right: r.right, top: r.top }; cur.segs.push(seg); }
        seg.text += ws ? ' ' : s[i];
        seg.right = Math.max(seg.right, r.right);
      }
    }
    for (const l of lines) {                                        // 줄 앞뒤 공백 정리
      while (l.segs.length && !l.segs[0].text.trim()) l.segs.shift();
      while (l.segs.length && !l.segs[l.segs.length - 1].text.trim()) l.segs.pop();
      if (l.segs.length) { l.segs[0].text = l.segs[0].text.replace(/^\s+/, ''); const z = l.segs[l.segs.length - 1]; z.text = z.text.replace(/\s+$/, ''); }
    }
    return lines.filter(l => l.segs.length);
  }

  function textNode(nodes, boxEl, pRect, name) {
    const cs = getComputedStyle(boxEl);
    const lines = measureText(nodes);
    if (!lines.length) return null;
    const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    const base = { wt: +cs.fontWeight, c: rgba(cs.color), deco: cs.textDecorationLine.includes('line-through') ? 'S' : cs.textDecorationLine.includes('underline') ? 'U' : '', size: px(cs.fontSize) };
    const lh = cs.lineHeight === 'normal' ? Math.round(base.size * 1.5) : px(cs.lineHeight);
    const ls = cs.letterSpacing === 'normal' ? 0 : px(cs.letterSpacing);
    // 문자열과 스타일 구간
    let chars = '';
    const runs = [];
    const outLines = [];
    lines.forEach((l, li) => {
      if (li) chars += '\n';
      const segs = [];
      for (const sg of l.segs) {
        const s0 = chars.length; chars += sg.text;
        const st = sg.style;
        if (st.wt !== base.wt || JSON.stringify(st.c) !== JSON.stringify(base.c) || st.deco !== base.deco || st.size !== base.size) runs.push({ s: s0, e: chars.length, wt: st.wt, c: st.c, deco: st.deco, size: st.size });
        segs.push({ t: sg.text, x: r2(sg.left - pRect.left), wt: st.wt, c: st.c, deco: st.deco, size: st.size, w: r2(sg.right - sg.left) });
      }
      const maxSize = Math.max(...l.segs.map(s => s.style.size));
      const big = l.segs.find(s => s.style.size === maxSize);
      outLines.push({ y: r2(big.top + ascent(big.style.wt, maxSize, fam) - pRect.top), x: r2(l.left - pRect.left), w: r2(l.right - l.left), segs });
    });
    const left = Math.min(...lines.map(l => l.left)), right = Math.max(...lines.map(l => l.right));
    const top = lines[0].top, bottom = lines[lines.length - 1].bottom;
    const ta = cs.textAlign;
    return {
      t: 'T', n: name || '', chars, lines: outLines, runs,
      font: { fam, wt: base.wt, size: base.size, lh, ls: r2(ls) }, c: base.c, deco: base.deco,
      align: ta === 'center' ? 'CENTER' : ta === 'right' || ta === 'end' ? 'RIGHT' : 'LEFT',
      // 글자 묶음의 실제 범위 (박스가 따로 없을 때 쓴다)
      ix: r2(left - pRect.left), iy: r2((top + bottom) / 2 - lh * lines.length / 2 - pRect.top), iw: r2(right - left), ih: lh * lines.length,
      nowrap: cs.whiteSpace === 'nowrap',
    };
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
      const c = rgba(part); const nums = part.replace(/rgba?\([^)]*\)/, '').trim().split(/\s+/).map(px);
      if (c) out.push({ x: nums[0] || 0, y: nums[1] || 0, blur: nums[2] || 0, spread: nums[3] || 0, c, inset: /inset/.test(part) });
    }
    return out.length ? out : null;
  };

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
    return { ...base, t: 'S', inner: clone.innerHTML.trim(), vb };
  }

  // 반환: sw/sh 와, 폭이 FIXED 인 이유(wHard: 명시 폭·줄바꿈 행의 늘어난 칸 → 레이아웃에 의미가 있는 폭)
  function sizing(el, cs, pctx, abs, kind) {
    if (!pctx || abs) return { sw: 'FIXED', sh: 'FIXED', wHard: true };
    if (kind === 'S' || kind === 'I') return { sw: 'FIXED', sh: 'FIXED', wHard: true };
    const map = el.computedStyleMap();
    const kw = p => { const v = map.get(p); return v ? v.toString() : 'auto'; };
    const wv = kw('width'), hv = kw('height');
    const grow = parseFloat(cs.flexGrow) > 0;
    const sa = cs.alignSelf === 'auto' || cs.alignSelf === 'normal' ? pctx.ai : cs.alignSelf;
    const stretch = sa === 'normal' || sa === 'stretch';
    const o = { wAuto: wv === 'auto', hAuto: hv === 'auto', wHard: false };
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

  function visit(el, pRect, pctx) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return null;
    const r = el.getBoundingClientRect();
    if (r.width < 0.5 || r.height < 0.5) return null;
    const tag = el.tagName.toLowerCase();
    const abs = cs.position === 'absolute' || cs.position === 'fixed';
    const base = { n: el.dataset.n || '', x: r2(r.left - pRect.left), y: r2(r.top - pRect.top), w: r2(r.width), h: r2(r.height) };
    if (abs) base.abs = true;
    if (+cs.opacity < 1) base.op = +cs.opacity;
    if (pctx && +cs.order) base.order = +cs.order;

    if (tag === 'svg') return { ...svgNode(el, base), ...sizing(el, cs, pctx, abs, 'S') };
    if (tag === 'img') {
      const u = new URL(el.currentSrc || el.src);
      return { ...base, t: 'I', img: u.pathname.replace(/^.*\/assets\//, ''), iw: el.naturalWidth, ih: el.naturalHeight, rad: radii(cs, r.width, r.height), ...sizing(el, cs, pctx, abs, 'I') };
    }

    const bw = [px(cs.borderTopWidth), px(cs.borderRightWidth), px(cs.borderBottomWidth), px(cs.borderLeftWidth)];
    const pad = [px(cs.paddingTop), px(cs.paddingRight), px(cs.paddingBottom), px(cs.paddingLeft)];
    const fill = rgba(cs.backgroundColor);
    const fx = shadows(cs);
    const hasBox = !!fill || bw.some(Boolean) || pad.some(Boolean) || !!fx;
    const leaf = isTextLeaf(el, cs);
    const sz = sizing(el, cs, pctx, abs, leaf && !hasBox ? 'T' : 'F');

    if (leaf && !hasBox) {
      const t = textNode(textNodesOf(el), el, pRect, base.n);
      if (!t) return null;
      return { ...base, ...t, ...textSizing(t, sz, cs, pctx), box: true };
    }

    const flex = /flex/.test(cs.display);
    const lay = flex && cs.flexDirection.startsWith('row') ? 'H' : 'V';
    const f = { ...base, t: 'F', lay, ...sz, kids: [] };
    if (pad.some(Boolean)) f.pad = pad;
    if (fill) f.fill = fill;
    if (bw.some(Boolean)) {
      const i = bw.findIndex(Boolean);
      f.stroke = { c: rgba([cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor][i]), w: bw };
      if (!f.stroke.c) delete f.stroke;
    }
    const rad = radii(cs, r.width, r.height); if (rad) f.rad = rad;
    if (fx) f.fx = fx;
    if (cs.overflow === 'hidden' || cs.overflowX === 'hidden') f.clip = true;
    if (flex) {
      const g = lay === 'H' ? px(cs.columnGap) : px(cs.rowGap); if (g) f.gap = g;
      if (cs.flexWrap === 'wrap') { f.wrap = true; const cg = lay === 'H' ? px(cs.rowGap) : px(cs.columnGap); if (cg) f.cgap = cg; }
      const jc = cs.justifyContent, ai = cs.alignItems;
      f.ja = jc === 'center' ? 'CENTER' : jc === 'flex-end' || jc === 'end' ? 'MAX' : jc === 'space-between' ? 'SPACE_BETWEEN' : 'MIN';
      f.aa = ai === 'center' ? 'CENTER' : ai === 'flex-end' || ai === 'end' ? 'MAX' : ai === 'baseline' ? 'BASELINE' : 'MIN';
    } else { f.ja = 'MIN'; f.aa = 'MIN'; }
    const over = lay === 'V' ? el.scrollHeight > el.clientHeight + 1 : el.scrollWidth > el.clientWidth + 1;   // 주축으로 넘치는가
    const ctx = { lay, wrap: !!f.wrap, ai: flex ? cs.alignItems : 'stretch', sw: f.sw, sh: f.sh, over };

    if (leaf) {                                   // 배경·여백이 있는 글자 상자 → 프레임 + 텍스트
      const t = textNode(textNodesOf(el), el, r, '');
      if (t) f.kids.push({ ...t, x: t.ix, y: t.iy, w: t.iw, h: t.ih, ...textSizing(t, { sw: 'FILL', sh: 'HUG', wAuto: true }, cs, ctx) });
      return f;
    }
    let idx = 0;
    for (const c of el.childNodes) {
      if (c.nodeType === 1) { const k = visit(c, r, ctx); if (k) { k._i = idx++; f.kids.push(k); } }
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
    if (!f.kids.filter(k => !k.abs).length) { if (f.sw === 'HUG') f.sw = 'FIXED'; if (f.sh === 'HUG') f.sh = 'FIXED'; }
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
    return { sw: 'HUG', sh: 'HUG', ar: 'WH' };                                                    // 한 줄 · 왼쪽 정렬 → 자동 폭
  }

  const body = document.body;
  const vw = window.innerWidth, vh = window.innerHeight;
  const root = visit(body, { left: 0, top: 0 }, null);
  root.x = 0; root.y = 0; root.w = vw; root.h = vh; root.sw = 'FIXED'; root.sh = 'FIXED'; root.clip = true;
  root.n = body.dataset.n || document.title;
  if (!root.fill) root.fill = { r: 255, g: 255, b: 255, a: 1 };
  return root;
}
