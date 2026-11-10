// dist/ 를 만든다: app.css(세 CSS 합본) + screens/*.html + js + assets.
// dist/ 는 그대로 정적 사이트다. dist/index.html 이 랜딩(screens/01-landing.html)으로 보낸다.
// 사용: node src/build.mjs
import { mkdirSync, writeFileSync, readFileSync, cpSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SCREENS } from './screens/index.mjs';
import { DESC } from './lib/ui.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'screens'), { recursive: true });

const css = ['tokens.css', 'components.css', 'screens.css'].map(f => readFileSync(join(here, f), 'utf8')).join('\n');
writeFileSync(join(dist, 'app.css'), css);
cpSync(join(here, 'js'), join(dist, 'js'), { recursive: true });
// 화면이 쓰는 자료만 옮긴다
for (const d of ['bg', 'brands', 'geo', 'map', 'photos', 'tutorial', 'vendor', 'CREDITS.md']) {
  if (existsSync(join(root, 'assets', d))) cpSync(join(root, 'assets', d), join(dist, 'assets', d), { recursive: true });
}

const ids = new Set();
for (const s of SCREENS) {
  if (ids.has(s.id)) throw new Error('duplicate screen id ' + s.id);
  ids.add(s.id);
  writeFileSync(join(dist, 'screens', s.id + '.html'), s.html());
}
writeFileSync(join(dist, 'screens.json'), JSON.stringify(SCREENS.map(({ id, no, name, kind, note, bps, stops }) => ({ id, no, name, kind, note, bps: bps || ['d', 't', 'm'], ...(stops ? { stops } : {}) })), null, 1));

const head = title => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<meta name="description" content="${DESC}"><meta name="robots" content="noindex, nofollow"><link href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;500;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="app.css">`;
// 첫 주소는 랜딩으로 보낸다
writeFileSync(join(dist, 'index.html'), `${head('Trupass')}<meta http-equiv="refresh" content="0; url=screens/01-landing.html"></head>
<body><main style="padding:48px 32px;gap:12px"><p class="t-md c2">랜딩으로 이동합니다.</p><a class="lnk" href="screens/01-landing.html">screens/01-landing.html</a><a class="lnk" href="screens.html">화면 목차</a></main></body></html>
`);
// 화면 목차 (설계 검토용). 화면은 반응형이므로 창 폭을 줄여 가며 확인한다.
const rows = SCREENS.map(s => `<a class="it" href="screens/${s.id}.html"><span class="no num">${s.no}</span><span class="nm">${s.name}</span><span class="nt">${s.note}</span></a>`).join('\n');
writeFileSync(join(dist, 'screens.html'), `${head('Trupass 화면 목차')}
<style>.ix{max-width:1000px;width:100%;align-self:center;padding:56px 24px;gap:28px}.it{display:flex;gap:18px;padding:16px 0;border-top:1px solid var(--line);align-items:flex-start}.it .no{width:28px;flex:none;color:var(--sky-ink)}.it .nm{width:260px;flex:none;font-weight:500}.it .nt{flex:1;color:var(--tx-2);font-size:13px;line-height:20px}@media(max-width:767px){.it{flex-wrap:wrap}.it .nm{width:auto;flex:1}.it .nt{flex:none;width:100%;padding-left:46px}}</style></head>
<body><main class="ix"><div class="g8"><h1 class="t-display">Trupass 화면 목차</h1><p class="t-md c2">데스크톱 1200px 이상 · 태블릿 768–1199px · 모바일 767px 이하. 화면을 열고 창 폭을 바꿔 보세요. 01 랜딩부터 버튼과 엔터로 끝까지 이어집니다.</p></div><div>${rows}</div></main></body></html>
`);
console.log(`built ${SCREENS.length} screens → dist/`);
