// 피그마 생성기가 읽는 트리를 "오토레이아웃 규칙만으로" 다시 그려 원본 화면과 비교한다.
// 피그마를 직접 열어 볼 수 없는 환경에서 사이징 추론(FIXED/HUG/FILL, 간격, 정렬, 절대 위치)을 검증하는 용도다.
//   FIXED → 측정값 고정,  HUG → 내용 크기,  FILL → 주축 flex:1 / 교차축 stretch,  자식은 줄어들지 않음(flex-shrink:0)
// 사용: node tools/figma/sim.mjs [id-prefix ...]
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium, BP } from '../render.mjs';
import { createTables, orderKids } from './compact.mjs';
import { pixelDiff } from './pixel-diff.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const build = join(root, '.figma-build');
// 이미지 키: 화면이 쓰는 자료(assets) 또는 구운 그림(@ 로 시작 → .figma-build)
const imgUrl = k => pathToFileURL(k[0] === '@' ? join(build, k.slice(1)) : join(root, 'assets', k)).href;
const filters = process.argv.slice(2).filter(a => !a.startsWith('--'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const col = c => `rgba(${c.r},${c.g},${c.b},${c.a ?? 1})`;
const J = { MIN: 'flex-start', CENTER: 'center', MAX: 'flex-end', SPACE_BETWEEN: 'space-between', BASELINE: 'baseline' };

function html(tree, T) {
  // 피그마의 절대 위치는 부모 프레임의 바깥 모서리 기준이고, CSS 는 테두리 안쪽 기준이다. 테두리 두께만큼 보정한다.
  const absAt = (n, p) => `left:${n.x - (p.stroke ? p.stroke.w[3] : 0)}px;top:${n.y - (p.stroke ? p.stroke.w[0] : 0)}px;`;
  const sizeCss = (n, p) => {
    if (!p) return `width:${n.w}px;height:${n.h}px;`;
    if (n.abs) return `position:absolute;${absAt(n, p)}width:${n.w}px;height:${n.h}px;`;
    const main = p.lay === 'H' ? ['sw', 'width', n.w] : ['sh', 'height', n.h], cross = p.lay === 'H' ? ['sh', 'height', n.h] : ['sw', 'width', n.w];
    let s = 'flex-shrink:0;';
    const m = n[main[0]] || 'FIXED', c = n[cross[0]] || 'FIXED';
    s += m === 'FILL' ? `flex:1 1 0;min-${main[1]}:0;` : m === 'FIXED' ? `${main[1]}:${main[2]}px;` : '';
    s += c === 'FILL' ? 'align-self:stretch;' : c === 'FIXED' ? `${cross[1]}:${cross[2]}px;` : '';
    return s;
  };
  const node = (n, p) => {
    const op = n.op != null ? `opacity:${n.op};` : '';
    if (n.t === 'T') {
      const f = n.font;
      // 화면에서는 글 한 덩어리가 첫 글꼴(Outfit)의 치수로 줄 상자를 잡고, 거기에 없는 글자만 다른 글꼴로 그려진다.
      // 그 모양을 따라 한다: 바깥 상자는 첫 글꼴로 줄 높이를 잡고, 구간은 줄 높이에 끼어들지 않게(line-height: 0) 글꼴만 바꾼다.
      const span = (r, text) => `<span style="font-family:'${r.fam}';font-weight:${r.wt};font-size:${r.size}px;color:${col(r.c)};letter-spacing:${r.ls || 0}px;line-height:0;text-decoration:${r.deco === 'U' ? 'underline' : r.deco === 'S' ? 'line-through' : 'none'}">${esc(text)}</span>`;
      let inner = '';
      const runs = (n.runs || []).slice().sort((a, b) => a.s - b.s);
      let i = 0;
      for (const r of runs) { inner += esc(n.chars.slice(i, r.s)); inner += span(r, n.chars.slice(r.s, r.e)); i = r.e; }
      inner += runs.length ? esc(n.chars.slice(i)) : span({ fam: f.fam, wt: f.wt, size: f.size, c: n.c, ls: f.ls, deco: n.deco }, n.chars);
      let size;
      if (n.abs) size = `position:absolute;${absAt(n, p)}`;
      else if (n.ar === 'H') size = n.sw === 'FILL' ? (p.lay === 'H' ? 'flex:1 1 0;min-width:0;' : 'align-self:stretch;') : `width:${n.w}px;flex-shrink:0;`;
      else size = 'flex:0 0 auto;width:max-content;';
      const tsh = n.tsh ? `text-shadow:${n.tsh.x}px ${n.tsh.y}px ${n.tsh.blur}px ${col(n.tsh.c)};` : '';
      return `<div style="${size}${op}${tsh}white-space:pre;font:${f.wt} ${f.size}px/${f.lh}px '${f.f0 || f.fam}';letter-spacing:${f.ls}px;color:${col(n.c)};text-align:${n.align.toLowerCase()};text-decoration:${n.deco === 'U' ? 'underline' : n.deco === 'S' ? 'line-through' : 'none'};text-underline-offset:3px">${inner}</div>`;
    }
    if (n.t === 'S') return `<div style="${sizeCss(n, p)}${op}display:flex">${T.svgs[n.svg]}</div>`;
    if (n.t === 'I') return `<img src="${imgUrl(n.img)}" style="${sizeCss(n, p)}${op}object-fit:${n.fit === 'contain' ? 'contain' : n.fit === 'fill' ? 'fill' : 'cover'};display:block;${n.rad ? `border-radius:${n.rad.join('px ')}px;` : ''}">`;
    let s = `box-sizing:border-box;${n.abs ? '' : 'position:relative;'}display:flex;flex-direction:${n.lay === 'H' ? 'row' : 'column'};justify-content:${J[n.ja || 'MIN']};align-items:${J[n.aa || 'MIN']};`;
    if (n.gap) s += n.lay === 'H' ? `column-gap:${n.gap}px;` : `row-gap:${n.gap}px;`;
    if (n.wrap) s += `flex-wrap:wrap;row-gap:${n.cgap || 0}px;align-content:flex-start;`;
    if (n.pad) s += `padding:${n.pad.join('px ')}px;`;
    if (n.fill) s += `background-color:${col(n.fill)};`;
    if (n.bg) {                                  // 배경 층: CSS 는 위에 놓이는 것부터 적는다
      const L = n.bg.slice().reverse().map(b => b.k === 'img'
        ? [`url('${imgUrl(b.img)}')`, `${b.w}px ${b.h}px`, `${b.x}px ${b.y}px`]      // 작은따옴표: style="…" 속성 안에 들어간다
        : [`linear-gradient(${Math.atan2(b.x2 - b.x1, -(b.y2 - b.y1)) * 180 / Math.PI}deg, ${b.stops.map(t => `${col(t.c)} ${t.p * 100}%`).join(', ')})`, '100% 100%', '0 0']);
      s += `background-image:${L.map(l => l[0]).join(',')};background-size:${L.map(l => l[1]).join(',')};background-position:${L.map(l => l[2]).join(',')};background-repeat:no-repeat;`;
    }
    if (n.stroke) s += `border-style:solid;border-color:${col(n.stroke.c)};border-width:${n.stroke.w.join('px ')}px;`;
    if (n.rad) s += `border-radius:${n.rad.join('px ')}px;`;
    if (n.fx) s += `box-shadow:${n.fx.map(x => `${x.inset ? 'inset ' : ''}${x.x}px ${x.y}px ${x.blur}px ${x.spread}px ${col(x.c)}`).join(',')};`;
    if (n.clip) s += 'overflow:hidden;';
    if (n.minH) s += `min-height:${n.minH}px;`;
    if (n.maxW) s += `max-width:${n.maxW}px;`;
    return `<div style="${sizeCss(n, p)}${op}${s}">${orderKids(n.kids).map(k => node(k, n)).join('')}</div>`;
  };
  return `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}body{-webkit-font-smoothing:antialiased}svg{display:block;flex:none}</style></head><body>${node(tree, null)}</body></html>`;
}

const browser = await chromium.launch();
const cmp = await browser.newPage();
mkdirSync(join(root, '.figma-build/sim'), { recursive: true });
let worst = 0;
for (const bp of Object.keys(BP)) {
  const dir = join(root, '.figma-build/tree', bp);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).sort()) {
    const id = f.replace(/\.json$/, '');
    if (filters.length && !filters.some(x => id.startsWith(x))) continue;
    const T = createTables();
    const tree = T.compact(JSON.parse(readFileSync(join(dir, f), 'utf8')));
    const file = join(root, '.figma-build/sim', `${bp}-${id}.html`);
    writeFileSync(file, html(tree, T));
    const page = await browser.newPage({ viewport: { width: tree.w, height: tree.h } });
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);
    const shot = await page.screenshot();
    await page.close();
    const res = await pixelDiff(cmp, readFileSync(join(root, 'preview', bp, id + '.png')), shot);
    if (res.err) { console.log(`${id} ${bp}: ${res.err}`); worst = 100; continue; }
    worst = Math.max(worst, res.pct);
    console.log(`${id} ${bp}: ${res.pct.toFixed(3)}% differs`);
    writeFileSync(join(root, '.figma-build/sim', `${bp}-${id}.diff.png`), Buffer.from(res.png, 'base64'));
    writeFileSync(join(root, '.figma-build/sim', `${bp}-${id}.sim.png`), shot);
  }
}
await browser.close();
console.log('worst', worst.toFixed(3) + '%');
