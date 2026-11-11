// 노드 트리 → SVG 파일. --verify 를 주면 SVG 를 다시 브라우저로 그려 원본 화면(preview/<bp>/<키>.png)과 픽셀 비교한다.
// --boards 를 주면 피그마에 올리는 단위인 보드(폭마다 한 장 + 디자인 기준)를 만든다.
// 사용: node tools/figma/run-svg.mjs [--boards] [--verify] [id-prefix ...]
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { toSvg, toBoard } from './to-svg.mjs';
import { chromium, BP } from '../render.mjs';
import { pixelDiff } from './pixel-diff.mjs';

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
const BOARD = { ver: 'v4', date: '2026.11 4차', site: 'trupass-preview.vercel.app' };
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
