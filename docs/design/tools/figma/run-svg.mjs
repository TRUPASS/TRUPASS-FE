// 노드 트리 → SVG 파일. --verify 를 주면 SVG 를 다시 브라우저로 그려 원본 화면과 픽셀 비교한다.
// 사용: node tools/figma/run-svg.mjs [--verify] [id-prefix ...]
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { toSvg, toBoard } from './to-svg.mjs';
import { chromium, BP } from '../render.mjs';
import { pixelDiff } from './pixel-diff.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const verify = args.includes('--verify');
const filters = args.filter(a => !a.startsWith('--'));
const out = join(root, '.figma-build/svg');
const jobs = [];
for (const bp of Object.keys(BP)) {
  const dir = join(root, '.figma-build/tree', bp);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).sort()) {
    const id = f.replace(/\.json$/, '');
    if (filters.length && !filters.some(x => id.startsWith(x))) continue;
    jobs.push({ bp, id });
  }
}
let total = 0;
for (const { bp, id } of jobs) {
  const tree = JSON.parse(readFileSync(join(root, '.figma-build/tree', bp, id + '.json'), 'utf8'));
  const svg = toSvg(tree, join(root, 'assets'));
  mkdirSync(join(out, bp), { recursive: true });
  writeFileSync(join(out, bp, id + '.svg'), svg);
  total += svg.length;
}
console.log(`svg: ${jobs.length} files, ${(total / 1048576).toFixed(1)} MB`);

// 보드: 폭별로 화면을 한 줄로 늘어놓은 SVG (피그마에 한 번에 올리는 단위)
if (args.includes('--boards')) {
  const NAMES = { d: 'Desktop 1440', t: 'Tablet 834', m: 'Mobile 390' };
  const order = JSON.parse(readFileSync(join(root, 'dist/screens.json'), 'utf8')).map(s => s.id);
  mkdirSync(join(root, '.figma-build/boards'), { recursive: true });
  for (const bp of Object.keys(BP)) {
    const trees = order.filter(id => id !== '00-foundations' && existsSync(join(root, '.figma-build/tree', bp, id + '.json'))).map(id => JSON.parse(readFileSync(join(root, '.figma-build/tree', bp, id + '.json'), 'utf8')));
    if (!trees.length) continue;
    const svg = toBoard(trees, join(root, 'assets'), `Trupass 리디자인 v2 · ${NAMES[bp]}`, '2026.11 2차 · 칸 분할 검색 → 로그인 → 가입 → 이용 안내 → 통합 검색 → 항공권 · 숙소 → 장소 → 결제 → 완료. 화면을 낱개 프레임으로 쓰려면 이 보드를 선택하고 그룹 해제(⌘/Ctrl+Shift+G)하세요.');
    writeFileSync(join(root, '.figma-build/boards', `Trupass 리디자인 v2 · ${NAMES[bp]}.svg`), svg);
    console.log(`board ${NAMES[bp]}: ${trees.length} screens, ${(svg.length / 1048576).toFixed(2)} MB`);
  }
  const fd = join(root, '.figma-build/tree/d/00-foundations.json');
  if (existsSync(fd)) { const svg = toSvg(JSON.parse(readFileSync(fd, 'utf8')), join(root, 'assets')); writeFileSync(join(root, '.figma-build/boards', 'Trupass 디자인 기준 v2.svg'), svg); console.log(`board foundations: ${(svg.length / 1048576).toFixed(2)} MB`); }
}

if (verify) {
  // 의존성 없이 비교한다: 두 PNG를 브라우저 캔버스에 올려 채널 차이가 큰 픽셀을 센다.
  const browser = await chromium.launch();
  const cmp = await browser.newPage();
  mkdirSync(join(root, '.figma-build/diff'), { recursive: true });
  for (const { bp, id } of jobs) {
    const tree = JSON.parse(readFileSync(join(root, '.figma-build/tree', bp, id + '.json'), 'utf8'));
    const page = await browser.newPage({ viewport: { width: tree.w, height: tree.h } });
    await page.goto(pathToFileURL(join(out, bp, id + '.svg')).href);
    await page.evaluate(() => document.fonts.ready);
    const shot = await page.screenshot();
    await page.close();
    const ref = readFileSync(join(root, 'preview', bp, id + '.png'));
    const res = await pixelDiff(cmp, ref, shot);
    if (res.err) { console.log(`${id} ${bp}: ${res.err}`); continue; }
    console.log(`${id} ${bp}: ${(res.n / res.total * 100).toFixed(3)}% differs`);
    writeFileSync(join(root, '.figma-build/diff', `${bp}-${id}.png`), Buffer.from(res.png, 'base64'));
    writeFileSync(join(root, '.figma-build/diff', `${bp}-${id}.svg.png`), shot);
  }
  await browser.close();
}
