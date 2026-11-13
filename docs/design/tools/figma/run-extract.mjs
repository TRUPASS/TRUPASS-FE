// 모든 화면을 세 폭으로 열어 노드 트리(JSON)를 뽑는다 → .figma-build/tree/<bp>/<키>.json
// 스크롤 화면(랜딩)은 정해 둔 자리마다 한 장씩 뽑는다: 키는 <id>@<번호>.
// 겹친 배경 층을 굽거나 canvas 를 옮긴 그림은 .figma-build/raster/<bp>/ 에 둔다.
// 사용: node src/build.mjs && node tools/figma/run-extract.mjs [id-prefix ...]
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, openScreen, gotoStop, BP } from '../render.mjs';
import { inPage, isolate } from './extract.mjs';
import { coverage } from './font-cover.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const build = join(root, '.figma-build');
const filters = process.argv.slice(2).filter(a => !a.startsWith('--'));
const screens = JSON.parse(readFileSync(join(root, 'dist/screens.json'), 'utf8')).filter(s => !filters.length || filters.some(f => s.id.startsWith(f)));
// 마스크로 겹쳐 놓은 배경 층(하늘 · 구름 바다 · 구름층 · 안개)은 층마다 옮기지 않고 그 자리의 모습 한 장으로 굽는다
const RASTER = ['.lp-hero .win'];
const SCALE = 2;                                   // 굽는 그림과 canvas 의 선명도 (좌표는 CSS 픽셀 그대로다)
const pad2 = n => String(n).padStart(2, '0');
const cover = coverage('Outfit');
console.log('첫 글꼴(Outfit)의 글자 범위:', cover.from);

if (!filters.length) { rmSync(join(build, 'tree'), { recursive: true, force: true }); rmSync(join(build, 'raster'), { recursive: true, force: true }); }

// 트리를 다듬는다: 구운 그림과 canvas 를 파일로 옮기고, SVG 로 된 그림(항공사 로고)은 벡터로 바꾸고, 화면 밖 노드는 덜어 낸다
function tidy(tree, bp, key, baked, scrolled) {
  const W = tree.w, H = tree.h;
  let cN = 0;
  const walk = (n, ox, oy) => {
    const x = ox + n.x, y = oy + n.y;
    if (n.t === 'I' && n.raster != null) { Object.assign(n, baked[n.raster]); delete n.raster; }
    if (n.t === 'I' && n.data) {
      const file = `raster/${bp}/${key}-canvas${cN++}.png`;
      writeFileSync(join(build, file), Buffer.from(n.data.split(',')[1], 'base64'));
      n.img = '@' + file; delete n.data;
    }
    if (n.t === 'I' && /\.svg$/i.test(n.img || '')) {
      const src = readFileSync(join(root, 'assets', n.img), 'utf8');
      const vb = /viewBox="([^"]+)"/.exec(src)[1].split(/[\s,]+/).map(Number);
      const s = Math.min(n.w / vb[2], n.h / vb[3]), w = vb[2] * s, h = vb[3] * s;      // object-fit: contain
      Object.assign(n, { t: 'S', inner: src.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, ''), vb, x: n.x + (n.w - w) / 2, y: n.y + (n.h - h) / 2, w, h });
      delete n.img; delete n.iw; delete n.ih; delete n.fit; delete n.rad;
    }
    if (n.kids) n.kids = n.kids.filter(k => walk(k, x, y));
    const inside = x < W && y < H && x + n.w > 0 && y + n.h > 0;
    return inside || (n.kids && n.kids.length > 0);
  };
  tree.kids = tree.kids.filter(k => walk(k, 0, 0));
  delete tree.rasters;
  // 스크롤한 자리의 화면: 화면보다 큰 바깥 틀(main · 구간 · 붙잡아 두는 상자)은 흐름으로 다시 쌓을 수 없다
  // (앞선 구간은 화면 밖이라 덜어 냈고, sticky 는 오토레이아웃에 없다). 그런 틀의 자식은 잰 자리에 절대 위치로 놓는다.
  // 화면 안에 다 들어오는 틀부터는 원래대로 오토레이아웃이다.
  if (scrolled) {
    const pin = (n, x, y) => {
      for (const k of n.kids || []) {
        const kx = x + k.x, ky = y + k.y;
        if (!k.abs) { k.abs = true; k.sw = 'FIXED'; if (k.t !== 'T') k.sh = 'FIXED'; }
        if (k.t === 'F' && (kx < -0.5 || ky < -0.5 || kx + k.w > W + 0.5 || ky + k.h > H + 0.5)) pin(k, kx, ky);
      }
    };
    pin(tree, 0, 0);
  }
}

const browser = await chromium.launch();
let count = 0;
const stat = n => (n.kids || []).reduce((a, k) => a + stat(k), 1);
const canvases = (n, out = []) => { if (n.t === 'I' && n.data) out.push(n); for (const k of n.kids || []) canvases(k, out); return out; };
const opts = { cover: cover.ranges, raster: RASTER };
for (const s of screens) for (const bp of Object.keys(BP)) {
  if (!s.bps.includes(bp)) continue;
  // 좌표는 1배율 화면에서 잰다(한눈에 보기 렌더와 같은 조건). 굽는 그림과 canvas 만 2배율 화면에서 가져온다.
  const { ctx, page, width, height } = await openScreen(browser, s.id, bp, s.kind, 1);
  let hi = null;
  mkdirSync(join(build, 'tree', bp), { recursive: true });
  mkdirSync(join(build, 'raster', bp), { recursive: true });
  const stops = s.kind === 'scroll' ? s.stops : [null];
  for (const [i, stop] of stops.entries()) {
    if (stop) await gotoStop(page, stop[1], stop[2]);
    const key = stop ? `${s.id}@${pad2(i + 1)}` : s.id;
    const tree = await page.evaluate(inPage, opts);
    const baked = {};
    const cvs = canvases(tree);
    if (tree.rasters.length || cvs.length) {
      if (!hi) hi = await openScreen(browser, s.id, bp, s.kind, SCALE);
      if (stop) await gotoStop(hi.page, stop[1], stop[2]);
      if (cvs.length) await hi.page.waitForTimeout(400);
      const big = await hi.page.evaluate(inPage, opts);
      for (const ra of big.rasters) {
        await hi.page.evaluate(isolate, ra.k);
        const file = `raster/${bp}/${key}-${ra.k}.jpg`;
        writeFileSync(join(build, file), await hi.page.screenshot({ clip: { x: ra.x, y: ra.y, width: ra.w, height: ra.h }, type: 'jpeg', quality: 86 }));
        await hi.page.evaluate(isolate, null);
        baked[ra.k] = { img: '@' + file, iw: Math.round(ra.w * SCALE), ih: Math.round(ra.h * SCALE), fit: 'fill' };
      }
      canvases(big).forEach((c, k) => { if (cvs[k]) { cvs[k].data = c.data; cvs[k].iw = c.iw; cvs[k].ih = c.ih; } });
    }
    tidy(tree, bp, key, baked, !!stop);
    tree.meta = { id: s.id, key, no: s.no, name: s.name, label: stop ? `${s.no}-${i + 1} 랜딩 · ${stop[0]}` : `${s.no} ${s.name}`, stop: stop ? stop[0] : null, bp, width, height };
    writeFileSync(join(build, 'tree', bp, key + '.json'), JSON.stringify(tree));
    console.log(`${key} ${bp} ${width}x${height} nodes=${stat(tree)}${Object.keys(baked).length ? ' 구운 배경 ' + Object.keys(baked).length : ''}${cvs.length ? ' canvas ' + cvs.length : ''}`);
    count++;
  }
  await ctx.close();
  if (hi) await hi.ctx.close();
}
await browser.close();
console.log('extracted', count);
