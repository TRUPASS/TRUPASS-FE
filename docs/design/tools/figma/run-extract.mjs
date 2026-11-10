// 모든 화면을 세 폭으로 열어 노드 트리(JSON)를 뽑는다 → .figma-build/tree/<bp>/<id>.json
// 사용: node src/build.mjs && node tools/figma/run-extract.mjs [id-prefix ...]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, openScreen, BP } from '../render.mjs';
import { inPage } from './extract.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const filters = process.argv.slice(2).filter(a => !a.startsWith('--'));
const screens = JSON.parse(readFileSync(join(root, 'dist/screens.json'), 'utf8')).filter(s => !filters.length || filters.some(f => s.id.startsWith(f)));
const browser = await chromium.launch();
let count = 0;
const stat = n => (n.kids || []).reduce((a, k) => a + stat(k), 1);
for (const s of screens) for (const bp of Object.keys(BP)) {
  if (!s.bps.includes(bp)) continue;
  const { ctx, page, width, height } = await openScreen(browser, s.id, bp, s.kind, 1);
  const tree = await page.evaluate(inPage);
  tree.meta = { id: s.id, no: s.no, name: s.name, bp, width, height };
  mkdirSync(join(root, '.figma-build/tree', bp), { recursive: true });
  writeFileSync(join(root, '.figma-build/tree', bp, s.id + '.json'), JSON.stringify(tree));
  console.log(`${s.id} ${bp} ${width}x${height} nodes=${stat(tree)}`);
  count++;
  await ctx.close();
}
await browser.close();
console.log('extracted', count);
