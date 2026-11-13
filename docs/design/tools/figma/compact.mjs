// 추출한 트리를 피그마 생성기가 읽는 형태로 줄인다: SVG·텍스트 스타일을 표로 빼고, 쓰지 않는 측정값을 버린다.
const r2 = v => Math.round(v * 100) / 100;
const WEIGHT_NAME = { 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold' };

// 자식을 레이어에 넣는 순서. 피그마는 뒤에 넣은 것을 위에 그린다.
//   흐름 안의 자식은 문서 순서를 지킨다(오토레이아웃의 배치 순서이기도 하다).
//   절대 위치 자식은 자기보다 아래에 그려져야 하는 형제들 바로 뒤에 끼운다 (zi: 위치를 잡은 요소 1, z-index 가 있으면 1 + z, 음수면 -1).
export function orderKids(kids) {
  const key = (k, i) => [k.zi || 0, i];
  const below = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
  const out = kids.map((k, i) => ({ k, key: key(k, i) })).filter(e => !e.k.abs);
  kids.map((k, i) => ({ k, key: key(k, i) })).filter(e => e.k.abs).sort((a, b) => (below(a.key, b.key) ? -1 : 1)).forEach(e => {
    let at = 0;
    out.forEach((o, i) => { if (below(o.key, e.key)) at = i + 1; });
    out.splice(at, 0, e);
  });
  return out.map(e => e.k);
}

export function createTables() {
  const svgs = [], svgIdx = new Map();
  const styles = new Map();
  const images = new Set();
  const fonts = new Map();                         // 글꼴 이름 → 쓰인 굵기
  const useFont = (fam, wt) => { if (!fonts.has(fam)) fonts.set(fam, new Set()); fonts.get(fam).add(wt); };
  const svgOf = n => {
    // 돌려 놓은 아이콘은 그림 자체를 돌려서 넣는다 (노드를 돌리면 자리가 어긋난다)
    const inner = n.rot ? `<g transform="rotate(${n.rot} ${r2(n.vb[0] + n.vb[2] / 2)} ${r2(n.vb[1] + n.vb[3] / 2)})">${n.inner}</g>` : n.inner;
    const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${r2(n.w)}" height="${r2(n.h)}" viewBox="${n.vb.join(' ')}" fill="none">${inner}</svg>`;
    if (!svgIdx.has(s)) { svgIdx.set(s, svgs.length); svgs.push(s); }
    return svgIdx.get(s);
  };
  const styleOf = f => {
    const key = `${f.fam}/${f.size}/${f.lh}/${f.wt}/${f.ls || 0}`;
    if (!styles.has(key)) {
      const cat = f.size >= 26 ? 'Display' : f.size >= 20 || (f.size >= 16 && f.wt >= 600) ? 'Heading' : f.size >= 13 ? 'Body' : 'Caption';
      styles.set(key, { key, name: `${cat}/${f.fam} ${f.size}-${f.lh} ${WEIGHT_NAME[f.wt] || f.wt}${f.ls ? ' ' + (f.ls > 0 ? '+' : '') + f.ls : ''}`, fam: f.fam, wt: f.wt, size: f.size, lh: f.lh, ls: f.ls || 0 });
    }
    return key;
  };
  function compact(n) {
    const o = { t: n.t, n: n.n || undefined, x: r2(n.x), y: r2(n.y), w: r2(n.w), h: r2(n.h) };
    if (n.abs) o.abs = 1;
    if (n.cons) o.cons = n.cons;
    if (n.op != null) o.op = n.op;
    if (n.zi) o.zi = n.zi;
    if (n.t === 'F') {
      Object.assign(o, { lay: n.lay, sw: n.sw, sh: n.sh, ja: n.ja, aa: n.aa });
      for (const k of ['gap', 'cgap', 'wrap', 'pad', 'fill', 'bg', 'stroke', 'rad', 'fx', 'clip', 'minH', 'maxW']) if (n[k] != null && n[k] !== false) o[k] = n[k];
      for (const b of n.bg || []) if (b.k === 'img') images.add(b.img);
      o.kids = n.kids.map(compact);
    } else if (n.t === 'T') {
      const font = { fam: n.font.fam, wt: n.font.wt, size: n.font.size, lh: n.font.lh, ls: n.font.ls || 0 };
      if (n.font.f0 && n.font.f0 !== font.fam) font.f0 = n.font.f0;      // 화면의 첫 글꼴(줄의 높이와 기준선을 정한다). 모의 배치(sim)가 쓴다
      useFont(font.fam, font.wt);
      Object.assign(o, { chars: n.chars, font, c: n.c, align: n.align, sw: n.sw, ar: n.ar });
      if (n.deco) o.deco = n.deco;
      if (n.tsh) o.tsh = n.tsh;
      // 한 가지 모양뿐인 글은 텍스트 스타일에 잇는다. 섞인 글은 구간마다 글꼴 · 굵기 · 색 · 자간을 따로 적는다.
      if (n.uni) o.ts = styleOf({ fam: font.fam, wt: font.wt, size: font.size, lh: font.lh, ls: font.ls });
      else { o.runs = (n.runs || []).map(r => ({ s: r.s, e: r.e, fam: r.fam, wt: r.wt, size: r.size, c: r.c, deco: r.deco, ls: r.ls || 0 })); for (const r of o.runs) useFont(r.fam, r.wt); }
    } else if (n.t === 'S') {
      o.svg = svgOf(n);
    } else if (n.t === 'I') {
      o.img = n.img; images.add(n.img);
      if (n.fit && n.fit !== 'cover') o.fit = n.fit;
      if (n.rad) o.rad = n.rad;
    }
    return o;
  }
  return { compact, svgs, styles, images, fonts };
}
