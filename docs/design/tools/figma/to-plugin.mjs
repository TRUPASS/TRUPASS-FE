// 노드 트리 + 토큰 + 이미지 → 피그마 플러그인 (figma/plugin/code.js, manifest.json)
// 사용: node tools/figma/to-plugin.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTables } from './compact.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const order = JSON.parse(readFileSync(join(root, 'dist/screens.json'), 'utf8'));
const T = createTables();
const load = (bp, id) => JSON.parse(readFileSync(join(root, '.figma-build/tree', bp, id + '.json'), 'utf8'));

const BOARDS = [['d', 'Desktop 1440'], ['t', 'Tablet 834'], ['m', 'Mobile 390']];
const boards = [];
if (existsSync(join(root, '.figma-build/tree/d/00-foundations.json'))) boards.push({ title: 'Trupass 디자인 기준', screens: [{ name: '00 디자인 기준', tree: T.compact(load('d', '00-foundations')) }] });
for (const [bp, name] of BOARDS) {
  const screens = order.filter(s => s.id !== '00-foundations' && s.bps.includes(bp)).map(s => ({ name: `${s.no} ${s.name}`, tree: T.compact(load(bp, s.id)) }));
  boards.push({ title: `Trupass 리디자인 · ${name}`, screens });
}

// 색 토큰: tokens.css 의 램프를 변수 이름으로 옮긴다
const GROUP = { n: 'neutral', b: 'brand', g: 'success', y: 'warning', r: 'danger' };
const css = readFileSync(join(root, 'src/tokens.css'), 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/--([a-z])-(\d+):\s*(#[0-9a-f]{6})/g)].map(m => [`${GROUP[m[1]]}/${m[2]}`, m[3]]));

const images = Object.fromEntries([...T.images].sort().map(k => [k, readFileSync(join(root, 'assets', k)).toString('base64')]));
const DATA = {
  font: 'IBM Plex Sans KR', weights: [...T.weights].sort(), pageName: 'Trupass 리디자인 (오토레이아웃)', collection: 'Trupass / Color',
  tokens, textStyles: [...T.styles.values()].sort((a, b) => b.size - a.size || a.wt - b.wt), svgs: T.svgs, images, boards,
};

const out = join(root, 'figma/plugin');
mkdirSync(out, { recursive: true });
const runtime = readFileSync(join(here, 'plugin-runtime.js'), 'utf8').replace('// @ts-check\n', '');
const json = JSON.stringify(DATA);
writeFileSync(join(out, 'code.js'), `// 생성 파일 — tools/figma/to-plugin.mjs 가 만든다. 직접 고치지 않는다.\n// 실행: 피그마 데스크톱 앱 > Plugins > Development > Import plugin from manifest… 로 manifest.json 을 고른 뒤 실행한다.\nconst TRUPASS_DATA = ${json};\n\n${runtime}`);
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ name: 'Trupass 화면 생성', id: 'trupass-screen-builder-local', api: '1.0.0', main: 'code.js', editorType: ['figma'], documentAccess: 'dynamic-page', networkAccess: { allowedDomains: ['none'] } }, null, 2) + '\n');
const nodes = n => (n.kids || []).reduce((a, k) => a + nodes(k), 1);
const total = boards.reduce((a, b) => a + b.screens.reduce((x, s) => x + nodes(s.tree), 0), 0);
console.log(`plugin: ${boards.reduce((a, b) => a + b.screens.length, 0)} screens, ${total} nodes, ${T.svgs.length} svgs, ${DATA.textStyles.length} text styles, ${Object.keys(images).length} images, code.js ${(json.length / 1048576).toFixed(2)} MB`);
console.log(DATA.textStyles.map(s => s.name).join(' | '));
