// 이용 안내(04)에 넣는 캡처 이미지를 실제 화면에서 잘라 만든다.
// 사용: node src/build.mjs && node tools/make-shots.mjs && node src/build.mjs
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { chromium, openScreen } from './render.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// [화면 id, 잘라낼 영역 x, y, w] — 높이는 1280:760 비율로 정한다
const SHOTS = [
  ['05-home', 'viewport', 96, 72, 980],
  ['07-result', 'page', 104, 64, 1232],
  ['08-revise', 'page', 440, 250, 900],
  ['11-checkout', 'page', 104, 64, 1232],
];
const browser = await chromium.launch();
mkdirSync(join(root, 'assets/tutorial'), { recursive: true });
for (const [i, [id, kind, x, y, w]] of SHOTS.entries()) {
  const { ctx, page } = await openScreen(browser, id, 'd', kind, 2);
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
  const { writeFileSync } = await import('node:fs');
  writeFileSync(join(root, `assets/tutorial/step${i + 1}.jpg`), Buffer.from(jpg, 'base64'));
  console.log(`step${i + 1}.jpg ← ${id}`);
  await ctx.close();
}
await browser.close();
