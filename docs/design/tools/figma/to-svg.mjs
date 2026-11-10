// 노드 트리 → SVG. 피그마가 "편집 가능한 벡터"로 읽어 들이는 형태로 쓴다.
//   프레임 = <g id="레이어 이름"> + 배경 <rect>,  글자 = 줄 단위 <text>(살아 있는 텍스트),
//   아이콘 = <path>,  사진·지도 = 이미지 채움(<pattern>) 사각형
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
export function svgBuilder(assetDir) {
  const defs = [];
  const used = new Map();
  const uid = name => {
    const base = (name || 'Frame').replace(/["<>&]/g, '').trim() || 'Frame';
    const n = (used.get(base) || 0) + 1; used.set(base, n);
    return n === 1 ? base : `${base}_${n}`;
  };
  const images = new Map();
  const imageId = key => {
    if (!images.has(key)) {
      const id = `image${images.size}`;
      const b64 = readFileSync(join(assetDir, key)).toString('base64');
      images.set(key, id);
      defs.push({ kind: 'image', id, key, b64 });
    }
    return images.get(key);
  };
  let fN = 0, pN = 0, cN = 0;
  let W = 0, H = 0, OX = 0, OY = 0;

  // 잘라내는 부모의 둥근 모서리를 자식 배경에 물려준다 (clipPath 없이 모서리 삐져나옴을 막는다)
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

  const tattr = (t, s) => `font-family="${escA(t.font.fam)}" font-size="${s.size}" font-weight="${s.wt}" letter-spacing="${t.font.ls ? +(t.font.ls / s.size).toFixed(4) + 'em' : '0em'}" ${paint(s.c)}${s.deco === 'U' ? ' text-decoration="underline"' : s.deco === 'S' ? ' text-decoration="line-through"' : ''}`;
  function text(t, ox, oy) {
    const segs = t.lines.flatMap(l => l.segs);
    const key = s => `${s.wt}|${s.size}|${s.deco}|${hex(s.c)}|${s.c.a}`;
    if (segs.every(s => key(s) === key(segs[0]))) {       // 한 가지 스타일: 줄마다 tspan
      return `<text ${tattr(t, segs[0])} xml:space="preserve" style="white-space: pre">${t.lines.map(l => l.segs.map(s => `<tspan x="${n2(ox + s.x)}" y="${n2(oy + l.y)}">${esc(s.t)}</tspan>`).join('')).join('')}</text>`;
    }
    const parts = [];                                      // 굵기·색이 섞인 글: 구간마다 text
    for (const l of t.lines) for (const s of l.segs) parts.push(`<text ${tattr(t, s)} xml:space="preserve" style="white-space: pre"><tspan x="${n2(ox + s.x)}" y="${n2(oy + l.y)}">${esc(s.t)}</tspan></text>`);
    return `<g id="${escA(uid(t.chars.replace(/\n/g, ' ').slice(0, 40)))}">${parts.join('')}</g>`;
  }

  function node(n, ox, oy, clip) {
    const x = ox + n.x, y = oy + n.y;
    if (x - OX > W || y - OY > H || x - OX + n.w < 0 || y - OY + n.h < 0) return '';   // 화면 밖
    const op = n.op != null ? ` opacity="${n.op}"` : '';
    if (n.t === 'T') return op ? `<g${op}>${text(n, ox, oy)}</g>` : text(n, ox, oy);
    if (n.t === 'S') {
      const sx = n.w / n.vb[2], sy = n.h / n.vb[3];
      return `<g id="${escA(uid(n.n || 'vector'))}" transform="translate(${n2(x - n.vb[0] * sx)} ${n2(y - n.vb[1] * sy)}) scale(${+sx.toFixed(5)} ${+sy.toFixed(5)})"${op}>${n.inner}</g>`;
    }
    if (n.t === 'I') {
      const img = imageId(n.img), pid = `pattern${pN++}`;
      const s = Math.max(n.w / n.iw, n.h / n.ih);
      const tx = (n.w - n.iw * s) / 2, ty = (n.h - n.ih * s) / 2;
      defs.push({ kind: 'raw', s: `<pattern id="${pid}" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#${img}" transform="matrix(${+(s / n.w).toFixed(7)} 0 0 ${+(s / n.h).toFixed(7)} ${+(tx / n.w).toFixed(5)} ${+(ty / n.h).toFixed(5)})"/></pattern>`, img: { id: img, w: n.iw, h: n.ih } });
      return shape(x, y, n.w, n.h, inherit(x, y, n.w, n.h, n.rad, clip), `id="${escA(uid(n.n || 'Image'))}" fill="url(#${pid})"${op}`);
    }
    // 프레임
    const parts = [];
    const sw = n.stroke ? n.stroke.w : [0, 0, 0, 0];
    const uniStroke = n.stroke && sw.every(v => v === sw[0]);
    const r = inherit(x, y, n.w, n.h, n.rad, clip);
    for (const s of n.fx || []) {
      if (s.inset) continue;
      if (s.blur === 0 && s.spread > 0) parts.push(shape(x - s.spread, y - s.spread, n.w + 2 * s.spread, n.h + 2 * s.spread, r.map(v => v + s.spread), `${paint(s.c)}`));
    }
    const blurFx = (n.fx || []).find(s => !s.inset && s.blur > 0);
    const filt = blurFx ? ` filter="url(#${dropShadow(blurFx)})"` : '';
    if (uniStroke) {
      const w = sw[0];
      parts.push(shape(x + w / 2, y + w / 2, n.w - w, n.h - w, r.map(v => Math.max(0, v - w / 2)), `${n.fill ? paint(n.fill) : 'fill="none"'} ${paint(n.stroke.c, 'stroke')} stroke-width="${w}"${filt}`));
    } else {
      if (n.fill) parts.push(shape(x, y, n.w, n.h, r, `${paint(n.fill)}${filt}`));
      if (n.stroke) {
        const c = paint(n.stroke.c);
        if (sw[0]) parts.push(`<rect x="${n2(x)}" y="${n2(y)}" width="${n2(n.w)}" height="${sw[0]}" ${c}/>`);
        if (sw[2]) parts.push(`<rect x="${n2(x)}" y="${n2(y + n.h - sw[2])}" width="${n2(n.w)}" height="${sw[2]}" ${c}/>`);
        if (sw[3]) parts.push(`<rect x="${n2(x)}" y="${n2(y)}" width="${sw[3]}" height="${n2(n.h)}" ${c}/>`);
        if (sw[1]) parts.push(`<rect x="${n2(x + n.w - sw[1])}" y="${n2(y)}" width="${sw[1]}" height="${n2(n.h)}" ${c}/>`);
      }
    }
    let c2 = clip;
    if (n.clip) c2 = { x: x + sw[3], y: y + sw[0], w: n.w - sw[1] - sw[3], h: n.h - sw[0] - sw[2], r: r.map(v => Math.max(0, v - Math.max(...sw))) };
    for (const k of n.kids) parts.push(node(k, x, y, c2));
    const body = parts.filter(Boolean).join('');
    if (!body) return '';
    return `<g id="${escA(uid(n.n || 'Frame'))}"${op}>${body}</g>`;
  }

  // 화면 하나를 (ox, oy) 위치에 놓는다. 화면 = 잘라내는 프레임(<g clip-path>) — 피그마가 프레임으로 되읽는다.
  function add(tree, ox = 0, oy = 0, name) {
    W = tree.w; H = tree.h;
    const cid = `clip${cN++}`;
    defs.push({ kind: 'raw', s: `<clipPath id="${cid}"><rect width="${tree.w}" height="${tree.h}" fill="white" transform="translate(${ox} ${oy})"/></clipPath>` });
    const inner = (tree.fill ? `<rect width="${tree.w}" height="${tree.h}" transform="translate(${ox} ${oy})" ${paint(tree.fill)}/>` : '') + tree.kids.map(k => nodeAt(k, ox, oy)).join('');
    return `<g id="${escA(uid(name || tree.n))}" clip-path="url(#${cid})">${inner}</g>`;
  }
  // node() 의 화면 밖 판정은 화면 원점 기준이라, 보드 위치만큼 옮겨서 계산한다
  function nodeAt(k, ox, oy) { OX = ox; OY = oy; return node(k, ox, oy, null); }
  function label(x, y, str, size = 20, wt = 500, c = { r: 79, g: 86, b: 95, a: 1 }) {
    return `<text font-family="IBM Plex Sans KR" font-size="${size}" font-weight="${wt}" letter-spacing="0em" ${paint(c)} xml:space="preserve" style="white-space: pre"><tspan x="${x}" y="${y}">${esc(str)}</tspan></text>`;
  }
  function finish(w, h, body, bg) {
    const seen = new Set();
    const defsStr = defs.filter(d => d.kind === 'raw').map(d => d.s).join('') + defs.filter(d => d.kind === 'raw' && d.img && !seen.has(d.img.id) && seen.add(d.img.id)).map(d => {
      const im = defs.find(x => x.kind === 'image' && x.id === d.img.id);
      return `<image id="${im.id}" width="${d.img.w}" height="${d.img.h}" preserveAspectRatio="none" xlink:href="data:image/jpeg;base64,${im.b64}"/>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">${bg ? `<rect width="${w}" height="${h}" ${paint(bg)}/>` : ''}${body}<defs>${defsStr}</defs></svg>`;
  }
  return { add, label, finish };
}

// 화면 하나짜리 SVG
export function toSvg(tree, assetDir) {
  const b = svgBuilder(assetDir);
  return b.finish(tree.w, tree.h, b.add(tree, 0, 0));
}

// 여러 화면을 가로로 늘어놓은 보드. 화면마다 위에 이름표를 단다.
export function toBoard(trees, assetDir, title, sub) {
  const b = svgBuilder(assetDir);
  const PAD = 120, GAP = 120, TOP = 260;
  let x = PAD, body = '', maxH = 0;
  for (const t of trees) {
    body += b.label(x, TOP - 28, `${t.meta.no} ${t.meta.name}`, 22, 500);
    body += b.add(t, x, TOP, `${t.meta.no} ${t.meta.name}`);
    x += t.w + GAP; maxH = Math.max(maxH, t.h);
  }
  const w = x - GAP + PAD, h = TOP + maxH + PAD;
  const head = b.label(PAD, 104, title, 44, 600, { r: 18, g: 22, b: 29, a: 1 }) + b.label(PAD, 150, sub, 22, 400);
  return b.finish(w, h, head + body, { r: 234, g: 237, b: 241, a: 1 });
}
