// dist/screens/*.html 을 1440 / 834 / 390 폭으로 찍어 preview/<bp>/<id>.png 로 저장한다.
// 스크롤로 넘기는 화면(kind: scroll)은 정해 둔 자리(stops)마다 한 장씩 찍어 <id>@<번호>.png 로 저장한다.
// 움직임은 끈 채(#still + 움직임 줄이기)로 찍으므로 결과가 늘 같다.
// 사용: node tools/render.mjs [id-prefix ...] [--bp=d,t,m] [--scale=1]
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

export const BP = { d: { w: 1440, h: 900, name: 'Desktop 1440' }, t: { w: 834, h: 1112, name: 'Tablet 834' }, m: { w: 390, h: 844, name: 'Mobile 390' } };
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const { chromium } = createRequire(import.meta.url)('playwright');

export async function openScreen(browser, id, bp, kind, scale = 1) {
  const { w, h } = BP[bp];
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  // 웹폰트 요청은 막고 로컬에 설치한 Outfit · Gothic A1 로 그린다 (결과를 고정하기 위해)
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto(pathToFileURL(join(root, 'dist/screens', id + '.html')).href + '#still');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  let height = h;
  if (kind !== 'viewport' && kind !== 'scroll') {
    height = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
    if (height !== h) { await page.setViewportSize({ width: w, height }); height = await page.evaluate(() => Math.ceil(Math.max(document.documentElement.scrollHeight, window.innerHeight))); await page.setViewportSize({ width: w, height }); }
  }
  return { ctx, page, width: w, height };
}

// 스크롤 화면의 한 자리로 간다. k 는 구간 이름(data-sec) · '#id' · 'end', f 는 구간 안의 위치(0–1).
export async function gotoStop(page, k, f) {
  const y = await page.evaluate(([k, f]) => window.__tpStop(k, f), [k, f]);
  await page.evaluate(y => window.scrollTo(0, y), y);
  await page.waitForTimeout(200);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const bps = (args.find(a => a.startsWith('--bp=')) || '--bp=d,t,m').slice(5).split(',');
  const scale = Number((args.find(a => a.startsWith('--scale=')) || '--scale=1').slice(8));
  const filters = args.filter(a => !a.startsWith('--'));
  const screens = JSON.parse(readFileSync(join(root, 'dist/screens.json'), 'utf8')).filter(s => !filters.length || filters.some(f => s.id.startsWith(f)));
  const browser = await chromium.launch();
  for (const s of screens) for (const bp of bps) {
    if (!s.bps.includes(bp)) continue;
    const { ctx, page, width, height } = await openScreen(browser, s.id, bp, s.kind, scale);
    mkdirSync(join(root, 'preview', bp), { recursive: true });
    if (s.kind === 'scroll') {
      for (const [i, [name, k, f]] of s.stops.entries()) {
        await gotoStop(page, k, f);
        await page.screenshot({ path: join(root, 'preview', bp, `${s.id}@${String(i + 1).padStart(2, '0')}.png`) });
      }
    } else await page.screenshot({ path: join(root, 'preview', bp, s.id + '.png') });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(`${s.id} ${bp} ${width}x${height}${over > 0 ? '  ⚠ 가로 넘침 ' + over + 'px' : ''}`);
    await ctx.close();
  }
  await browser.close();
}
