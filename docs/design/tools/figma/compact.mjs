// 추출한 트리를 피그마 생성기가 읽는 형태로 줄인다: SVG·텍스트 스타일을 표로 빼고, 쓰지 않는 측정값을 버린다.
const r2 = v => Math.round(v * 100) / 100;
const WEIGHT_NAME = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold' };

export function createTables() {
  const svgs = [], svgIdx = new Map();
  const styles = new Map();
  const images = new Set();
  const weights = new Set([400, 500, 600]);
  const svgOf = n => {
    const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${r2(n.w)}" height="${r2(n.h)}" viewBox="${n.vb.join(' ')}" fill="none">${n.inner}</svg>`;
    if (!svgIdx.has(s)) { svgIdx.set(s, svgs.length); svgs.push(s); }
    return svgIdx.get(s);
  };
  const styleOf = f => {
    const key = `${f.size}/${f.lh}/${f.wt}/${f.ls || 0}`;
    if (!styles.has(key)) {
      const cat = f.size >= 26 ? 'Display' : f.size >= 20 || (f.size >= 16 && f.wt >= 600) ? 'Heading' : f.size >= 13 ? 'Body' : 'Caption';
      styles.set(key, { key, name: `${cat}/${f.size}-${f.lh} ${WEIGHT_NAME[f.wt] || f.wt}`, wt: f.wt, size: f.size, lh: f.lh, ls: f.ls || 0 });
    }
    return key;
  };
  function compact(n) {
    const o = { t: n.t, n: n.n || undefined, x: r2(n.x), y: r2(n.y), w: r2(n.w), h: r2(n.h) };
    if (n.abs) o.abs = 1;
    if (n.cons) o.cons = n.cons;
    if (n.op != null) o.op = n.op;
    if (n.t === 'F') {
      Object.assign(o, { lay: n.lay, sw: n.sw, sh: n.sh, ja: n.ja, aa: n.aa });
      for (const k of ['gap', 'cgap', 'wrap', 'pad', 'fill', 'stroke', 'rad', 'fx', 'clip', 'minH', 'maxW']) if (n[k] != null && n[k] !== false) o[k] = n[k];
      o.kids = n.kids.map(compact);
    } else if (n.t === 'T') {
      weights.add(n.font.wt); for (const r of n.runs || []) weights.add(r.wt);
      Object.assign(o, { chars: n.chars, font: { wt: n.font.wt, size: n.font.size, lh: n.font.lh, ls: n.font.ls || 0 }, c: n.c, align: n.align, sw: n.sw, ar: n.ar, ts: styleOf(n.font) });
      if (n.deco) o.deco = n.deco;
      if (n.runs && n.runs.length) o.runs = n.runs;
    } else if (n.t === 'S') {
      o.svg = svgOf(n);
    } else if (n.t === 'I') {
      o.img = n.img; images.add(n.img);
      if (n.rad) o.rad = n.rad;
    }
    return o;
  }
  return { compact, svgs, styles, images, weights };
}
