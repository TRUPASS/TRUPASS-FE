// dist/ 를 만든다: app.css(세 CSS 합본) + screens/*.html + assets 복사.
// 사용: node src/build.mjs
import { mkdirSync, writeFileSync, readFileSync, cpSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SCREENS } from './screens/index.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'screens'), { recursive: true });

const css = ['tokens.css', 'components.css', 'screens.css'].map(f => readFileSync(join(here, f), 'utf8')).join('\n');
writeFileSync(join(dist, 'app.css'), css);
if (existsSync(join(root, 'assets'))) cpSync(join(root, 'assets'), join(dist, 'assets'), { recursive: true });

const ids = new Set();
for (const s of SCREENS) {
  if (ids.has(s.id)) throw new Error('duplicate screen id ' + s.id);
  ids.add(s.id);
  writeFileSync(join(dist, 'screens', s.id + '.html'), s.html());
}
writeFileSync(join(dist, 'screens.json'), JSON.stringify(SCREENS.map(({ id, no, name, kind, note, bps }) => ({ id, no, name, kind, note, bps: bps || ['d', 't', 'm'] })), null, 1));
// 로컬에서 훑어보는 목차. 화면은 반응형이므로 창 폭을 줄여 가며 확인한다.
const rows = SCREENS.map(s => `<a class="it" href="screens/${s.id}.html"><span class="no">${s.no}</span><span class="nm">${s.name}</span><span class="nt">${s.note}</span></a>`).join('\n');
writeFileSync(join(dist, 'index.html'), `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Trupass 화면 목차</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap" rel="stylesheet"><link rel="stylesheet" href="app.css">
<style>.ix{max-width:960px;width:100%;align-self:center;padding:48px 24px;gap:24px}.it{display:flex;gap:16px;padding:14px 0;border-top:1px solid var(--line);align-items:flex-start}.it .no{width:28px;flex:none;font-weight:600;color:var(--brand)}.it .nm{width:260px;flex:none;font-weight:500}.it .nt{flex:1;color:var(--tx-2)}@media(max-width:767px){.it{flex-wrap:wrap}.it .nm{width:auto;flex:1}.it .nt{flex:none;width:100%;padding-left:44px}}</style></head>
<body class="pg-white"><main class="ix"><div class="g8"><h1 class="t-h1">Trupass 화면 목차</h1><p class="t-md c2">데스크톱 1200px 이상 · 태블릿 768–1199px · 모바일 767px 이하. 화면을 열고 창 폭을 바꿔 보세요.</p></div><div>${rows}</div></main></body></html>
`);
console.log(`built ${SCREENS.length} screens → dist/`);
