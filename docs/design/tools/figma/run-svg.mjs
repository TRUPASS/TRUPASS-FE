// 노드 트리 → SVG 파일. --verify 를 주면 SVG 를 다시 브라우저로 그려 원본 화면(preview/<bp>/<키>.png)과 픽셀 비교한다.
// --boards 를 주면 피그마에 올리는 단위인 보드(폭마다 한 장 + 디자인 기준)를 만든다.
// 사용: node tools/figma/run-svg.mjs [--boards] [--verify] [id-prefix ...]
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { toSvg, toBoard } from './to-svg.mjs';
import { chromium, BP } from '../render.mjs';
import { pixelDiff } from './pixel-diff.mjs';
import { LOGO } from '../../src/lib/logo.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const build = join(root, '.figma-build');
const assets = join(root, 'assets');
const args = process.argv.slice(2);
const verify = args.includes('--verify');
const filters = args.filter(a => !a.startsWith('--'));
const out = join(build, 'svg');
const load = (bp, key) => JSON.parse(readFileSync(join(build, 'tree', bp, key + '.json'), 'utf8'));
const jobs = [];
for (const bp of Object.keys(BP)) {
  const dir = join(build, 'tree', bp);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).sort()) {
    const key = f.replace(/\.json$/, '');
    if (filters.length && !filters.some(x => key.startsWith(x))) continue;
    jobs.push({ bp, key });
  }
}
let total = 0;
for (const { bp, key } of jobs) {
  const svg = toSvg(load(bp, key), assets, build);
  mkdirSync(join(out, bp), { recursive: true });
  writeFileSync(join(out, bp, key + '.svg'), svg);
  total += svg.length;
}
console.log(`svg: ${jobs.length} files, ${(total / 1048576).toFixed(1)} MB`);

// 보드: 폭마다 한 장. 첫 줄은 랜딩의 스크롤 자리, 둘째 줄은 로그인부터 내 여행까지. (피그마에 한 번에 올리는 단위)
const BOARD = { ver: 'v5', date: '2026.11 로고 교체', site: 'trupass-preview.vercel.app' };
if (args.includes('--boards')) {
  const dir = join(build, 'boards');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const screens = JSON.parse(readFileSync(join(root, 'dist/screens.json'), 'utf8'));
  for (const bp of Object.keys(BP)) {
    const keys = existsSync(join(build, 'tree', bp)) ? readdirSync(join(build, 'tree', bp)).map(f => f.replace(/\.json$/, '')) : [];
    const of = id => keys.filter(k => k === id || k.startsWith(id + '@')).sort().map(k => load(bp, k));
    const landing = screens.filter(s => s.kind === 'scroll').flatMap(s => of(s.id));
    const flow = screens.filter(s => s.kind !== 'scroll' && s.id !== '00-foundations' && s.bps.includes(bp)).flatMap(s => of(s.id));
    if (!landing.length && !flow.length) continue;
    const name = `Trupass 화면 설계 ${BOARD.ver} · ${BP[bp].name}`;
    const svg = toBoard([{ label: '01 랜딩 — 스크롤을 내리며 지나는 자리', trees: landing }, { label: '02 – 14 로그인부터 내 여행까지', trees: flow }], assets, build, name,
      `${BOARD.date} · 지금 배포된 사이트(${BOARD.site}) 기준. 화면을 낱개 프레임으로 쓰려면 이 보드를 선택하고 그룹 해제(⌘/Ctrl+Shift+G)하세요.`);
    writeFileSync(join(dir, name + '.svg'), svg);
    console.log(`board ${BP[bp].name}: 랜딩 ${landing.length} + 화면 ${flow.length}, ${(svg.length / 1048576).toFixed(2)} MB`);
  }
  const fd = join(build, 'tree/d/00-foundations.json');
  if (existsSync(fd)) { const svg = toSvg(load('d', '00-foundations'), assets, build); writeFileSync(join(dir, `Trupass 디자인 기준 ${BOARD.ver}.svg`), svg); console.log(`board foundations: ${(svg.length / 1048576).toFixed(2)} MB`); }
}

// 로고 보드: 화면에 쓰는 것과 같은 경로(src/lib/logo.mjs)로 색 조합 세 가지, 마크 크기, 파비콘, 두 색을 한 장에 놓는다
function logoBoard(title, sub) {
  const NAVY = '#1a1a5c', SKY = '#2285cf', INK = '#1c1f5a', BLUE = '#2b8fd9', WHITE = '#ffffff';
  const text = (x, y, str, size, wt, fill = '#4f565f') => `<text font-family="Gothic A1" font-size="${size}" font-weight="${wt}" fill="${fill}" xml:space="preserve"><tspan x="${x}" y="${y}">${str}</tspan></text>`;
  const r1 = v => Math.round(v * 10) / 10;
  // 높이 h 로 그린 로고 · 마크 (왼쪽 위가 x, y). word 가 false 면 마크만
  const draw = (x, y, h, a, b, word = true) => {
    const vw = word ? LOGO.w : LOGO.mw;
    return `<svg x="${r1(x)}" y="${r1(y)}" width="${r1(h * vw / LOGO.h)}" height="${h}" viewBox="0 0 ${vw} ${LOGO.h}"><path fill="${a}" d="${LOGO.a}${word ? LOGO.t : ''}"/><path fill="${b}" d="${LOGO.b}"/></svg>`;
  };
  const TW = 480, TH = 220, GAP = 40, PAD = 120;
  const tile = (i, row, fill, label, inner) => {
    const x = PAD + i * (TW + GAP), y = 240 + row * (TH + 110);
    return `<g><rect x="${x}" y="${y}" width="${TW}" height="${TH}" rx="24" fill="${fill}"${fill === WHITE ? ' stroke="#dfe2ec"' : ''}/>${inner(x, y)}${text(x, y + TH + 38, label, 20, 500)}</g>`;
  };
  const lockup = (a, b) => (x, y) => draw(x + (TW - 64 * LOGO.w / LOGO.h) / 2, y + (TH - 64) / 2, 64, a, b);
  const MARKS = [96, 48, 32, 16], mwOf = h => h * LOGO.mw / LOGO.h;
  const marks = (x, y) => { let cx = x + (TW - MARKS.reduce((a, h) => a + mwOf(h), 0) - 32 * (MARKS.length - 1)) / 2; return MARKS.map(h => { const g = draw(cx, y + (TH - h) / 2, h, NAVY, SKY, false); cx += mwOf(h) + 32; return g; }).join(''); };
  const icons = (x, y) => { let cx = x + (TW - 96 - 48 - 32 - 16 - 40 * 3) / 2; return [96, 48, 32, 16].map(sz => { const mw = sz * 0.94, mh = mw * LOGO.h / LOGO.mw; const g = `<rect x="${cx}" y="${r1(y + (TH - sz) / 2)}" width="${sz}" height="${sz}" rx="${r1(sz * 0.18)}" fill="${WHITE}" stroke="#dfe2ec"/>` + draw(cx + (sz - mw) / 2, y + (TH - mh) / 2, r1(mh), NAVY, SKY, false); cx += sz + 40; return g; }).join(''); };
  const chips = (x, y) => [[NAVY, '남색 #1A1A5C'], [SKY, '하늘색 #2285CF']].map(([c, n], i) => `<rect x="${x + 48 + i * 200}" y="${y + 44}" width="168" height="96" rx="16" fill="${c}"/>` + text(x + 48 + i * 200, y + 176, n, 18, 500, INK)).join('');
  const body = tile(0, 0, WHITE, '흰 바탕: 남색 + 하늘색', lockup(NAVY, SKY)) + tile(1, 0, INK, '남색 면: 흰색 + 하늘색', lockup(WHITE, SKY)) + tile(2, 0, BLUE, '사진 · 색 면: 흰색', lockup(WHITE, WHITE))
    + tile(0, 1, WHITE, `마크 (높이 ${MARKS.join(' · ')})`, marks) + tile(1, 1, WHITE, '파비콘 (96 · 48 · 32 · 16)', icons) + tile(2, 1, WHITE, '색', chips);
  const W = PAD * 2 + TW * 3 + GAP * 2, H = 240 + TH * 2 + 110 + 38 + PAD;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#eef0f6"/>${text(PAD, 104, title, 44, 600, INK)}${text(PAD, 152, sub, 22, 400)}${body}</svg>\n`;
}
if (args.includes('--boards')) {
  const name = `Trupass 로고 ${BOARD.ver}`;
  const svg = logoBoard(name, `${BOARD.date} · 팀이 만든 로고를 벡터로 옮긴 것. 화면과 같은 도형이며 파일은 docs/design/assets/logo 에 있다.`);
  writeFileSync(join(build, 'boards', name + '.svg'), svg);
  console.log(`board logo: ${(svg.length / 1024).toFixed(1)} KB`);
}

if (verify) {
  // 의존성 없이 비교한다: 두 PNG를 브라우저 캔버스에 올려 채널 차이가 큰 픽셀을 센다.
  const browser = await chromium.launch();
  const cmp = await browser.newPage();
  mkdirSync(join(build, 'diff'), { recursive: true });
  let worst = 0, sum = 0, n = 0;
  for (const { bp, key } of jobs) {
    const tree = load(bp, key);
    const page = await browser.newPage({ viewport: { width: tree.w, height: tree.h } });
    await page.goto(pathToFileURL(join(out, bp, key + '.svg')).href);
    await page.evaluate(() => document.fonts.ready);
    const shot = await page.screenshot();
    await page.close();
    const refFile = join(root, 'preview', bp, key + '.png');
    if (!existsSync(refFile)) { console.log(`${key} ${bp}: 견줄 렌더가 없다 (npm run render 를 먼저 돌린다)`); continue; }
    const res = await pixelDiff(cmp, readFileSync(refFile), shot);
    if (res.err) { console.log(`${key} ${bp}: ${res.err}`); continue; }
    const pct = res.n / res.total * 100;
    worst = Math.max(worst, pct); sum += pct; n++;
    console.log(`${key} ${bp}: ${pct.toFixed(3)}% differs`);
    writeFileSync(join(build, 'diff', `${bp}-${key}.png`), Buffer.from(res.png, 'base64'));
    writeFileSync(join(build, 'diff', `${bp}-${key}.svg.png`), shot);
  }
  await browser.close();
  if (n) console.log(`verify: ${n} 장, 평균 ${(sum / n).toFixed(3)}%, 최대 ${worst.toFixed(3)}%`);
}
