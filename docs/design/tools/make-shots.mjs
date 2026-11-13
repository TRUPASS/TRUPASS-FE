// 랜딩의 이용 방법 상자에 넣는 그림 다섯 장을 실제 화면에서 잘라 만든다 (assets/tutorial/step1–5.jpg).
// 화면을 고치면 다시 돌려 그림을 맞춘다. 사용: node src/build.mjs && node tools/make-shots.mjs && node src/build.mjs
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, openScreen } from './render.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// [화면 id, 종류, 잘라낼 영역 x, y, w, 찍기 전에 할 일] — 높이는 1280:760 비율로 정한다
const openStays = () => { document.querySelector('[data-flight="F1"] details').open = true; };
const SHOTS = [
  ['05-home', 'viewport', 150, 84, 1140],                 // 1 문장 세 개로 적는다
  ['06-searching', 'viewport', 200, 92, 1040],            // 2 항공편과 숙소를 한 번에 찾는다
  ['07-result', 'page', 96, 452, 1248, openStays],        // 3 항공권마다 숙소 3곳을 고른다 (첫 항공권의 숙소를 펼친 모습)
  ['09-places', 'page', 96, 176, 1248],                   // 4 숙소 위치와 주변 장소를 확인한다
  ['11-checkout', 'page', 96, 176, 1248],                 // 5 정해 둔 한도 안에서 결제한다
];
const browser = await chromium.launch();
mkdirSync(join(root, 'assets/tutorial'), { recursive: true });
for (const [i, [id, kind, x, y, w, prep]] of SHOTS.entries()) {
  const { ctx, page, width } = await openScreen(browser, id, 'd', kind, 2);
  if (prep) {
    await page.evaluate(prep);
    await page.setViewportSize({ width, height: await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight)) });
    await page.waitForTimeout(150);
  }
  const h = Math.round(w * 760 / 1280);
  const buf = await page.screenshot({ clip: { x, y, width: w, height: h }, type: 'png' });
  // 1280x760 JPEG 로 맞춘다 (브라우저 캔버스로 리사이즈)
  const p2 = await ctx.newPage();
  const jpg = await p2.evaluate(async b64 => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = 1280; c.height = 760;
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, 1280, 760);
    return c.toDataURL('image/jpeg', 0.84).split(',')[1];
  }, buf.toString('base64'));
  writeFileSync(join(root, `assets/tutorial/step${i + 1}.jpg`), Buffer.from(jpg, 'base64'));
  console.log(`step${i + 1}.jpg ← ${id}`);
  await ctx.close();
}
await browser.close();
