// 노드 트리 → SVG. 피그마가 "편집 가능한 벡터"로 읽어 들이는 형태로 쓴다.
//   프레임 = <g id="레이어 이름"> + 배경 <rect>,  글자 = 줄 단위 <text>(살아 있는 텍스트),
//   아이콘 = <path>,  사진·지도 = 이미지 채움(<pattern>) 사각형,  덧씌움 = 선형 그라데이션 채움
//   넘치는 내용을 자르는 프레임 = <g clip-path>
// 오토레이아웃은 담기지 않는다(절대 좌표). 오토레이아웃 버전은 plugin/code.js 가 만든다.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escA = s => esc(s).replace(/"/g, '&quot;');
const n2 = v => +(+v).toFixed(2);
const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const paint = (c, attr = 'fill') => `${attr}="${hex(c)}"${c.a < 1 ? ` ${attr}-opacity="${c.a}"` : ''}`;

// 모서리별 반경이 다른 둥근 사각형
const rrect = (x, y, w, h, [tl, tr, br, bl]) =>
  `M${n2(x + tl)} ${n2(y)}H${n2(x + w - tr)}${tr ? `A${tr} ${tr} 0 0 1 ${n2(x + w)} ${n2(y + tr)}` : ''}V${n2(y + h - br)}${br ? `A${br} ${br} 0 0 1 ${n2(x + w - br)} ${n2(y + h)}` : ''}H${n2(x + bl)}${bl ? `A${bl} ${bl} 0 0 1 ${n2(x)} ${n2(y + h - bl)}` : ''}V${n2(y + tl)}${tl ? `A${tl} ${tl} 0 0 1 ${n2(x + tl)} ${n2(y)}` : ''}Z`;

// 여러 화면을 한 SVG(보드)에 담을 수 있게, defs·레이어 이름·이미지를 공유하는 빌더로 만든다.
// assetDir: 화면이 쓰는 자료 폴더(assets).  buildDir: 구운 그림(@ 로 시작하는 키)이 있는 폴더(.figma-build).
export function svgBuilder(assetDir, buildDir = '') {
  const defs = [];
  const used = new Map();
  const uid = name => {
    const base = (name || 'Frame').replace(/["<>&]/g, '').trim() || 'Frame';
    const n = (used.get(base) || 0) + 1; used.set(base, n);
    return n === 1 ? base : `${base}_${n}`;
  };
  const images = new Map();
  const imageId = (key, w, h) => {
    if (!images.has(key)) {
      const id = `image${images.size}`;
      const b64 = readFileSync(key[0] === '@' ? join(buildDir, key.slice(1)) : join(assetDir, key)).toString('base64');
      const mime = /\.png$/i.test(key) ? 'image/png' : /\.webp$/i.test(key) ? 'image/webp' : 'image/jpeg';
      images.set(key, id);
      defs.push({ kind: 'image', id, s: `<image id="${id}" width="${w}" height="${h}" preserveAspectRatio="none" xlink:href="data:${mime};base64,${b64}"/>` });
    }
    return images.get(key);
  };
  let fN = 0, pN = 0, cN = 0, gN = 0;
  let W = 0, H = 0, OX = 0, OY = 0;

  // 잘라내는 부모의 둥근 모서리를 자식 배경에 물려준다 (모서리가 맞닿은 자식은 clipPath 없이도 삐져나오지 않는다)
  const inherit = (x, y, w, h, rad, clip) => {
    const r = rad ? [...rad] : [0, 0, 0, 0];
    if (clip) {
      const near = (a, b) => Math.abs(a - b) < 1;
      if (near(x, clip.x) && near(y, clip.y)) r[0] = Math.max(r[0], clip.r[0]);
      if (near(x + w, clip.x + clip.w) && near(y, clip.y)) r[1] = Math.max(r[1], clip.r[1]);
      if (near(x + w, clip.x + clip.w) && near(y + h, clip.y + clip.h)) r[2] = Math.max(r[2], clip.r[2]);
      if (near(x, clip.x) && near(y + h, clip.y + clip.h)) r[3] = Math.max(r[3], clip.r[3]);
    }
    return r;
  };
  const shape = (x, y, w, h, r, attrs) => {
    const uni = r.every(v => v === r[0]);
    return uni ? `<rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}"${r[0] ? ` rx="${n2(Math.min(r[0], w / 2, h / 2))}"` : ''} ${attrs}/>` : `<path d="${rrect(x, y, w, h, r.map(v => Math.min(v, w / 2, h / 2)))}" ${attrs}/>`;
  };
  const dropShadow = s => {
    const id = `shadow${fN++}`;
    defs.push({ kind: 'raw', s: `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dx="${s.x}" dy="${s.y}"/><feGaussianBlur stdDeviation="${n2(s.blur / 2)}"/><feColorMatrix type="matrix" values="0 0 0 0 ${n2(s.c.r / 255)} 0 0 0 0 ${n2(s.c.g / 255)} 0 0 0 0 ${n2(s.c.b / 255)} 0 0 0 ${s.c.a} 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/></filter>` });
    return id;
  };
  // 상자(bw × bh) 안의 (dx, dy) 자리에 dw × dh 크기로 놓이는 사진 채움
  const imgFill = (key, iw, ih, bw, bh, dx, dy, dw, dh) => {
    const img = imageId(key, iw, ih), pid = `pattern${pN++}`;
    defs.push({ kind: 'raw', s: `<pattern id="${pid}" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#${img}" transform="matrix(${+(dw / iw / bw).toFixed(7)} 0 0 ${+(dh / ih / bh).toFixed(7)} ${+(dx / bw).toFixed(5)} ${+(dy / bh).toFixed(5)})"/></pattern>` });
    return `url(#${pid})`;
  };
  const linFill = (g, x, y) => {
    const id = `paint${gN++}_linear`;
    defs.push({ kind: 'raw', s: `<linearGradient id="${id}" x1="${n2(x + g.x1)}" y1="${n2(y + g.y1)}" x2="${n2(x + g.x2)}" y2="${n2(y + g.y2)}" gradientUnits="userSpaceOnUse">${g.stops.map(s => `<stop${s.p ? ` offset="${s.p}"` : ''} stop-color="${hex(s.c)}"${s.c.a < 1 ? ` stop-opacity="${s.c.a}"` : ''}/>`).join('')}</linearGradient>` });
    return `url(#${id})`;
  };

  // 자간: 구간마다 잰 값(s.ls, 브라우저가 그린 폭에 맞춘 값)을 em 으로 적는다
  const lsEm = (t, s) => { const v = s.ls != null ? s.ls : t.font.ls || 0; return v ? +(v / s.size).toFixed(4) + 'em' : '0em'; };
  const tattr = (t, s) => `font-family="${escA(s.fam || t.font.fam)}" font-size="${s.size}" font-weight="${s.wt}" letter-spacing="${lsEm(t, s)}" ${paint(s.c)}${s.deco === 'U' ? ' text-decoration="underline"' : s.deco === 'S' ? ' text-decoration="line-through"' : ''}`;
  function text(t, ox, oy) {
    const segs = t.lines.flatMap(l => l.segs);
    const key = s => `${s.fam}|${s.wt}|${s.size}|${s.deco}|${hex(s.c)}|${s.c.a}`;
    let out;
    if (segs.every(s => key(s) === key(segs[0]))) {       // 한 가지 스타일: 줄마다 tspan (줄마다 자간이 다르면 tspan 에 따로 적는다)
      const ls0 = lsEm(t, segs[0]);
      out = `<text ${tattr(t, segs[0])} xml:space="preserve" style="white-space: pre">${t.lines.map(l => l.segs.map(s => `<tspan x="${n2(ox + s.x)}" y="${n2(oy + l.y)}"${lsEm(t, s) !== ls0 ? ` letter-spacing="${lsEm(t, s)}"` : ''}>${esc(s.t)}</tspan>`).join('')).join('')}</text>`;
    } else {
      const parts = [];                                    // 글꼴·굵기·색이 섞인 글: 구간마다 text
      for (const l of t.lines) for (const s of l.segs) parts.push(`<text ${tattr(t, s)} xml:space="preserve" style="white-space: pre"><tspan x="${n2(ox + s.x)}" y="${n2(oy + l.y)}">${esc(s.t)}</tspan></text>`);
      out = `<g id="${escA(uid(t.chars.replace(/\n/g, ' ').slice(0, 40)))}">${parts.join('')}</g>`;
    }
    return t.tsh ? `<g filter="url(#${dropShadow(t.tsh)})">${out}</g>` : out;
  }

  // 겹치는 순서: zi(위치를 잡은 요소 · z-index)가 작은 것부터, 같으면 문서 순서대로
  const paintOrder = kids => kids.map((k, i) => [k.zi || 0, i, k]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(e => e[2]);
  const isect = (a, b) => { const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y); return { x, y, w: Math.min(a.x + a.w, b.x + b.w) - x, h: Math.min(a.y + a.h, b.y + b.h) - y }; };
  // n 의 자손 가운데 상자 밖으로 나가는 것이 있는가 (있을 때만 clipPath 를 건다)
  const spills = (n, x, y, box) => {
    for (const k of n.kids || []) {
      const kx = x + k.x, ky = y + k.y;
      if (kx < box.x - 0.5 || ky < box.y - 0.5 || kx + k.w > box.x + box.w + 0.5 || ky + k.h > box.y + box.h + 0.5) return true;
      if (k.t === 'F' && !k.clip && spills(k, kx, ky, box)) return true;
    }
    return false;
  };

  // clip: 모서리를 물려줄 가장 가까운 자르는 조상의 상자.  cb: 자르는 조상들이 남긴, 실제로 보이는 범위(화면 좌표)
  function node(n0, ox, oy, clip, cb) {
    const x0 = ox + n0.x, y0 = oy + n0.y;
    if (x0 > cb.x + cb.w || y0 > cb.y + cb.h || x0 + n0.w < cb.x || y0 + n0.h < cb.y) return '';   // 보이는 범위 밖
    // 상자(프레임 · 사진)는 브라우저가 칠하는 방식대로 화소 격자에 맞춘다: 왼쪽 위와 오른쪽 아래를 각각 반올림한다.
    // 자식의 자리는 맞추기 전의 좌표에서 이어 계산한다(반올림이 쌓이지 않게). 글자와 아이콘은 그대로 둔다.
    let n = n0, x = x0, y = y0;
    if (n0.t === 'F' || n0.t === 'I') { x = Math.round(x0); y = Math.round(y0); n = { ...n0, w: Math.round(x0 + n0.w) - x, h: Math.round(y0 + n0.h) - y }; }
    const op = n.op != null ? ` opacity="${n.op}"` : '';
    if (n.t === 'T') return op ? `<g${op}>${text(n, ox, oy)}</g>` : text(n, ox, oy);
    if (n.t === 'S') {
      const sx = n.w / n.vb[2], sy = n.h / n.vb[3];
      const g = `<g id="${escA(uid(n.n || 'vector'))}" transform="translate(${n2(x - n.vb[0] * sx)} ${n2(y - n.vb[1] * sy)}) scale(${+sx.toFixed(5)} ${+sy.toFixed(5)})"${op}>${n.inner}</g>`;
      return n.rot ? `<g transform="rotate(${n.rot} ${n2(x + n.w / 2)} ${n2(y + n.h / 2)})">${g}</g>` : g;
    }
    if (n.t === 'I') {
      let dw = n.w, dh = n.h;
      if (n.fit !== 'fill') { const s = (n.fit === 'contain' ? Math.min : Math.max)(n.w / n.iw, n.h / n.ih); dw = n.iw * s; dh = n.ih * s; }
      const fill = imgFill(n.img, n.iw, n.ih, n.w, n.h, (n.w - dw) / 2, (n.h - dh) / 2, dw, dh);
      return shape(x, y, n.w, n.h, inherit(x, y, n.w, n.h, n.rad, clip), `id="${escA(uid(n.n || 'Image'))}" fill="${fill}"${op}`);
    }
    // 프레임
    const parts = [];
    const sw = n.stroke ? n.stroke.w : [0, 0, 0, 0];
    const uniStroke = n.stroke && sw.every(v => v === sw[0]);
    const r = inherit(x, y, n.w, n.h, n.rad, clip);
    const outer = (n.fx || []).filter(s => !s.inset);
    // 번지지 않는 테두리 그림자(겹친 띠): CSS 는 앞에 적은 것을 위에 그리므로 뒤에서부터 그린다
    for (const s of outer.slice().reverse()) if (s.blur === 0 && s.spread > 0) parts.push(shape(x - s.spread + s.x, y - s.spread + s.y, n.w + 2 * s.spread, n.h + 2 * s.spread, r.map(v => v + s.spread), `${paint(s.c)}`));
    const blurFx = outer.find(s => s.blur > 0);
    let filt = blurFx ? ` filter="url(#${dropShadow(blurFx)})"` : '';
    const strokeOnTop = n.bg && n.stroke;                  // 배경 층이 있으면 선은 그 위에 따로 그린다
    if (uniStroke && !strokeOnTop) {
      const w = sw[0];
      parts.push(shape(x + w / 2, y + w / 2, n.w - w, n.h - w, r.map(v => Math.max(0, v - w / 2)), `${n.fill ? paint(n.fill) : 'fill="none"'} ${paint(n.stroke.c, 'stroke')} stroke-width="${w}"${filt}`));
      filt = '';
    } else if (n.fill) { parts.push(shape(x, y, n.w, n.h, r, `${paint(n.fill)}${filt}`)); filt = ''; }
    for (const b of n.bg || []) {                          // 배경 층: 아래 것부터
      const fill = b.k === 'img' ? imgFill(b.img, b.iw, b.ih, n.w, n.h, b.x, b.y, b.w, b.h) : linFill(b, x, y);
      parts.push(shape(x, y, n.w, n.h, r, `fill="${fill}"${filt}`)); filt = '';
    }
    if (n.stroke && (!uniStroke || strokeOnTop)) {
      if (uniStroke) { const w = sw[0]; parts.push(shape(x + w / 2, y + w / 2, n.w - w, n.h - w, r.map(v => Math.max(0, v - w / 2)), `fill="none" ${paint(n.stroke.c, 'stroke')} stroke-width="${w}"`)); }
      else {
        const c = paint(n.stroke.c);
        if (sw[0]) parts.push(`<rect x="${n2(x)}" y="${n2(y)}" width="${n2(n.w)}" height="${sw[0]}" ${c}/>`);
        if (sw[2]) parts.push(`<rect x="${n2(x)}" y="${n2(y + n.h - sw[2])}" width="${n2(n.w)}" height="${sw[2]}" ${c}/>`);
        if (sw[3]) parts.push(`<rect x="${n2(x)}" y="${n2(y)}" width="${sw[3]}" height="${n2(n.h)}" ${c}/>`);
        if (sw[1]) parts.push(`<rect x="${n2(x + n.w - sw[1])}" y="${n2(y)}" width="${sw[1]}" height="${n2(n.h)}" ${c}/>`);
      }
    }
    // 안쪽 테두리 그림자(inset 0 0 0 1px): 안쪽 선으로 그린다
    for (const s of (n.fx || []).filter(s => s.inset && s.blur === 0 && s.spread > 0)) {
      const w = s.spread;
      parts.push(shape(x + w / 2, y + w / 2, n.w - w, n.h - w, r.map(v => Math.max(0, v - w / 2)), `fill="none" ${paint(s.c, 'stroke')} stroke-width="${w}"`));
    }
    let c2 = clip, cb2 = cb, kids = '';
    const inner = { x: x + sw[3], y: y + sw[0], w: n.w - sw[1] - sw[3], h: n.h - sw[0] - sw[2] };
    if (n.clip) { c2 = { ...inner, r: r.map(v => Math.max(0, v - Math.max(...sw))) }; cb2 = isect(cb, inner); }
    for (const k of paintOrder(n.kids)) kids += node(k, x0, y0, c2, cb2);
    if (kids && n.clip && spills(n, x0, y0, inner)) {       // 넘치는 내용이 있으면 실제로 자른다
      const cid = `clip${cN++}`;
      defs.push({ kind: 'raw', s: `<clipPath id="${cid}">${shape(inner.x, inner.y, inner.w, inner.h, c2.r, 'fill="white"')}</clipPath>` });
      kids = `<g clip-path="url(#${cid})">${kids}</g>`;
    }
    const body = parts.filter(Boolean).join('') + kids;
    if (!body) return '';
    return `<g id="${escA(uid(n.n || 'Frame'))}"${op}>${body}</g>`;
  }

  // 화면 하나를 (ox, oy) 위치에 놓는다. 화면 = 잘라내는 프레임(<g clip-path>) — 피그마가 프레임으로 되읽는다.
  function add(tree, ox = 0, oy = 0, name) {
    W = tree.w; H = tree.h; OX = ox; OY = oy;
    const cid = `clip${cN++}`;
    defs.push({ kind: 'raw', s: `<clipPath id="${cid}"><rect width="${tree.w}" height="${tree.h}" fill="white" transform="translate(${ox} ${oy})"/></clipPath>` });
    const cb = { x: OX, y: OY, w: W, h: H };
    const inner = (tree.fill ? `<rect width="${tree.w}" height="${tree.h}" transform="translate(${ox} ${oy})" ${paint(tree.fill)}/>` : '') + paintOrder(tree.kids).map(k => node(k, ox, oy, null, cb)).join('');
    return `<g id="${escA(uid(name || tree.n))}" clip-path="url(#${cid})">${inner}</g>`;
  }
  function label(x, y, str, size = 20, wt = 500, c = { r: 79, g: 86, b: 95, a: 1 }) {
    return `<text font-family="Gothic A1" font-size="${size}" font-weight="${wt}" letter-spacing="0em" ${paint(c)} xml:space="preserve" style="white-space: pre"><tspan x="${x}" y="${y}">${esc(str)}</tspan></text>`;
  }
  function finish(w, h, body, bg) {
    const defsStr = defs.filter(d => d.kind === 'raw').map(d => d.s).join('') + defs.filter(d => d.kind === 'image').map(d => d.s).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">${bg ? `<rect width="${w}" height="${h}" ${paint(bg)}/>` : ''}${body}<defs>${defsStr}</defs></svg>`;
  }
  return { add, label, finish };
}

// 화면 하나짜리 SVG
export function toSvg(tree, assetDir, buildDir) {
  const b = svgBuilder(assetDir, buildDir);
  return b.finish(tree.w, tree.h, b.add(tree, 0, 0));
}

// 보드: 줄마다 화면을 가로로 늘어놓는다. 줄 위에 줄 이름, 화면 위에 화면 이름을 단다.
// rows: [{ label, trees: [...] }]  (tree.meta.label 이 화면 이름이다)
export function toBoard(rows, assetDir, buildDir, title, sub) {
  const b = svgBuilder(assetDir, buildDir);
  const PAD = 120, GAP = 120, TOP = 240, ROW_LABEL = 96, ROW_GAP = 200;
  let y = TOP, body = '', maxW = 0;
  for (const row of rows) {
    if (!row.trees.length) continue;
    body += b.label(PAD, y + 34, row.label, 30, 500, { r: 28, g: 31, b: 90, a: 1 });
    y += ROW_LABEL;
    let x = PAD, maxH = 0;
    for (const t of row.trees) {
      body += b.label(x, y - 18, t.meta.label, 22, 500);
      body += b.add(t, x, y, t.meta.label);
      x += t.w + GAP; maxH = Math.max(maxH, t.h);
    }
    maxW = Math.max(maxW, x - GAP + PAD);
    y += maxH + ROW_GAP;
  }
  const w = maxW, h = y - ROW_GAP + PAD;
  const head = b.label(PAD, 104, title, 44, 600, { r: 28, g: 31, b: 90, a: 1 }) + b.label(PAD, 152, sub, 22, 400);
  return b.finish(w, h, head + body, { r: 238, g: 240, b: 246, a: 1 });
}
