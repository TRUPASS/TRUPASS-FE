// 노드 트리 + 토큰 + 이미지 → 피그마 플러그인 (figma/plugin/code.js, manifest.json)
// 사용: node tools/figma/to-plugin.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTables } from './compact.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const build = join(root, '.figma-build');
const VER = 'v4';
const order = JSON.parse(readFileSync(join(root, 'dist/screens.json'), 'utf8'));
const T = createTables();
const load = (bp, key) => JSON.parse(readFileSync(join(build, 'tree', bp, key + '.json'), 'utf8'));
const screen = (bp, key) => { const t = load(bp, key); return { name: t.meta.label, tree: T.compact(t) }; };

// 보드: 디자인 기준 한 장 + 폭마다 한 장. 폭 보드의 첫 줄은 랜딩의 스크롤 자리, 둘째 줄은 로그인부터 내 여행까지다.
const BOARDS = [['d', 'Desktop 1440'], ['t', 'Tablet 834'], ['m', 'Mobile 390']];
const boards = [];
if (existsSync(join(build, 'tree/d/00-foundations.json'))) boards.push({ title: `Trupass 디자인 기준 ${VER}`, rows: [{ label: '', screens: [screen('d', '00-foundations')] }] });
for (const [bp, name] of BOARDS) {
  const dir = join(build, 'tree', bp);
  if (!existsSync(dir)) continue;
  const keys = readdirSync(dir).map(f => f.replace(/\.json$/, ''));
  const of = id => keys.filter(k => k === id || k.startsWith(id + '@')).sort().map(k => screen(bp, k));
  const landing = order.filter(s => s.kind === 'scroll').flatMap(s => of(s.id));
  const flow = order.filter(s => s.kind !== 'scroll' && s.id !== '00-foundations' && s.bps.includes(bp)).flatMap(s => of(s.id));
  boards.push({ title: `Trupass 화면 설계 ${VER} · ${name}`, rows: [{ label: '01 랜딩 — 스크롤을 내리며 지나는 자리', screens: landing }, { label: '02 – 14 로그인부터 내 여행까지', screens: flow }].filter(r => r.screens.length) });
}

// 색 토큰: tokens.css 의 램프를 변수 이름으로 옮긴다
const GROUP = { n: 'neutral', b: 'sky', g: 'success', y: 'warning', r: 'danger' };
const css = readFileSync(join(root, 'src/tokens.css'), 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/--([a-z])-(\d+):\s*(#[0-9a-f]{6})/g)].filter(m => GROUP[m[1]]).map(m => [`${GROUP[m[1]]}/${m[2]}`, m[3]]));

// 이미지: 화면이 쓰는 자료(assets)와, 구운 배경 · canvas 그림(@ 로 시작하는 키 → .figma-build)
const images = Object.fromEntries([...T.images].sort().map(k => [k, readFileSync(k[0] === '@' ? join(build, k.slice(1)) : join(root, 'assets', k)).toString('base64')]));
// 보드 제목과 이름표는 한글 글꼴(Gothic A1)의 500 · 600 으로 쓴다
const fonts = Object.fromEntries([...T.fonts].map(([f, w]) => [f, [...w]]));
fonts['Gothic A1'] = [...new Set([...(fonts['Gothic A1'] || []), 400, 500, 600])].sort();
for (const f of Object.keys(fonts)) fonts[f].sort();
const DATA = {
  fonts, label: 'Gothic A1', pageName: `Trupass 화면 설계 ${VER} (오토레이아웃)`, collection: 'Trupass / Color',
  tokens, textStyles: [...T.styles.values()].sort((a, b) => b.size - a.size || a.wt - b.wt), svgs: T.svgs, images, boards,
};

const out = join(root, 'figma/plugin');
mkdirSync(out, { recursive: true });
const runtime = readFileSync(join(here, 'plugin-runtime.js'), 'utf8').replace('// @ts-check\n', '');
const json = JSON.stringify(DATA);
writeFileSync(join(out, 'code.js'), `// 생성 파일 — tools/figma/to-plugin.mjs 가 만든다. 직접 고치지 않는다.\n// 실행: 피그마 데스크톱 앱 > Plugins > Development > Import plugin from manifest… 로 manifest.json 을 고른 뒤 실행한다.\n// (var 로 둔 이유: 브라우저 콘솔에 두 번 붙여 넣어도 재선언 오류가 나지 않게)\nvar TRUPASS_DATA = ${json};\n\n${runtime}`);
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ name: 'Trupass 화면 생성', id: 'trupass-screen-builder-local', api: '1.0.0', main: 'code.js', editorType: ['figma'], documentAccess: 'dynamic-page', networkAccess: { allowedDomains: ['none'] } }, null, 2) + '\n');
const nodes = n => (n.kids || []).reduce((a, k) => a + nodes(k), 1);
const screens = boards.flatMap(b => b.rows.flatMap(r => r.screens));
console.log(`plugin: ${screens.length} screens, ${screens.reduce((a, s) => a + nodes(s.tree), 0)} nodes, ${T.svgs.length} svgs, ${DATA.textStyles.length} text styles, ${Object.keys(images).length} images (${(Object.values(images).reduce((a, b) => a + b.length, 0) / 1048576).toFixed(2)} MB), code.js ${(json.length / 1048576).toFixed(2)} MB`);
console.log('fonts:', Object.entries(fonts).map(([f, w]) => `${f} ${w.join('/')}`).join(' · '));
