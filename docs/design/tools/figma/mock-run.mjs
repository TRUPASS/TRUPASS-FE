// figma/plugin/code.js 를 모의 Figma 런타임에서 끝까지 실행해 본다.
// 실제 피그마가 거부하는 호출 순서(글꼴을 싣기 전 글자 입력, 오토레이아웃 밖에서의 FILL/HUG,
// 0–1 범위를 벗어난 색 등)를 여기서 예외로 잡는다. 화면 모양까지 검증하지는 않는다(그건 sim.mjs).
// 사용: node tools/figma/mock-run.mjs [--no-page]   (--no-page: 새 페이지 생성이 막힌 상황을 흉내 낸다)
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const noPage = process.argv.includes('--no-page');
const loaded = new Set();
const fkey = f => `${f.family}|${f.style}`;
let idc = 0;
const fail = m => { throw new Error(m); };
const isAuto = n => n && n.type === 'FRAME' && n.layoutMode !== 'NONE';
const checkPaints = (ps, what) => {
  if (!Array.isArray(ps)) fail(`${what} must be an array`);
  for (const p of ps) {
    if (p.type === 'SOLID') {
      for (const k of ['r', 'g', 'b']) if (!(p.color[k] >= 0 && p.color[k] <= 1)) fail(`${what}: color.${k} out of 0–1`);
      if ('a' in p.color) fail(`${what}: color must not carry "a"`);
      if (p.opacity != null && !(p.opacity >= 0 && p.opacity <= 1)) fail(`${what}: opacity out of range`);
    } else if (p.type === 'IMAGE') { if (typeof p.imageHash !== 'string') fail(`${what}: imageHash missing`); }
    else fail(`${what}: unknown paint type ${p.type}`);
  }
};

class Base {
  constructor(type) { this.type = type; this.id = `M:${++idc}`; this.name = type; this.parent = null; this.x = 0; this.y = 0; this._w = 100; this._h = 100; this.opacity = 1; this._lp = 'AUTO'; this._sw = 'FIXED'; this._sh = 'FIXED'; }
  get width() { return this._w; } set width(_) { fail('no setter for property width'); }
  get height() { return this._h; } set height(_) { fail('no setter for property height'); }
  resize(w, h) { if (!(w >= 0.01) || !(h >= 0.01)) fail(`resize: invalid size ${w}x${h}`); this._w = w; this._h = h; this._sw = 'FIXED'; this._sh = 'FIXED'; }
  get layoutPositioning() { return this._lp; }
  set layoutPositioning(v) { if (v === 'ABSOLUTE' && !isAuto(this.parent)) fail('layoutPositioning ABSOLUTE needs an auto-layout parent'); this._lp = v; }
  _sizing(axis, v) {
    if (!['FIXED', 'HUG', 'FILL'].includes(v)) fail(`layoutSizing: bad value ${v}`);
    if (v === 'FILL') { if (!isAuto(this.parent)) fail('FILL can only be set on children of auto-layout frames'); if (this._lp === 'ABSOLUTE') fail('FILL is incompatible with absolute positioning'); }
    if (v === 'HUG' && !(isAuto(this) || this.type === 'TEXT')) fail('HUG needs an auto-layout frame or a text node');
    this[axis] = v;
  }
  get layoutSizingHorizontal() { return this._sw; } set layoutSizingHorizontal(v) { this._sizing('_sw', v); }
  get layoutSizingVertical() { return this._sh; } set layoutSizingVertical(v) { this._sizing('_sh', v); }
  set minHeight(v) { if (!(v > 0)) fail('minHeight must be positive'); if (!isAuto(this) && !isAuto(this.parent)) fail('minHeight needs auto layout'); this._minH = v; }
  set maxWidth(v) { if (!(v > 0)) fail('maxWidth must be positive'); if (!isAuto(this) && !isAuto(this.parent)) fail('maxWidth needs auto layout'); this._maxW = v; }
  set constraints(v) { for (const k of ['horizontal', 'vertical']) if (!['MIN', 'CENTER', 'MAX', 'STRETCH', 'SCALE'].includes(v[k])) fail(`constraints.${k}: bad value ${v[k]}`); if (this._lp !== 'ABSOLUTE' && isAuto(this.parent)) fail('constraints need absolute positioning inside auto layout'); this._c = v; }
}
class Container extends Base {
  constructor(type) { super(type); this.children = []; }
  appendChild(c) { if (c.parent) c.parent.children = c.parent.children.filter(x => x !== c); c.parent = this; this.children.push(c); }
}
class Frame extends Container {
  constructor() { super('FRAME'); this.layoutMode = 'NONE'; this._fills = []; this._strokes = []; this.clipsContent = true; this._wrap = 'NO_WRAP'; }
  set fills(v) { checkPaints(v, 'fills'); this._fills = v; } get fills() { return this._fills; }
  set strokes(v) { checkPaints(v, 'strokes'); this._strokes = v; } get strokes() { return this._strokes; }
  set layoutWrap(v) { if (v === 'WRAP' && this.layoutMode !== 'HORIZONTAL') fail('WRAP needs HORIZONTAL auto layout'); this._wrap = v; } get layoutWrap() { return this._wrap; }
  set counterAxisSpacing(v) { if (this._wrap !== 'WRAP') fail('counterAxisSpacing needs layoutWrap WRAP'); if (!(v >= 0)) fail('counterAxisSpacing must be positive'); this._cas = v; }
  set primaryAxisAlignItems(v) { if (!['MIN', 'CENTER', 'MAX', 'SPACE_BETWEEN'].includes(v)) fail('bad primaryAxisAlignItems ' + v); this._ja = v; }
  set counterAxisAlignItems(v) { if (!['MIN', 'CENTER', 'MAX', 'BASELINE'].includes(v)) fail('bad counterAxisAlignItems ' + v); if (v === 'BASELINE' && this.layoutMode !== 'HORIZONTAL') fail('BASELINE needs HORIZONTAL'); this._aa = v; }
  set effects(v) { for (const e of v) { if (!['DROP_SHADOW', 'INNER_SHADOW'].includes(e.type)) fail('bad effect'); for (const k of ['r', 'g', 'b', 'a']) if (!(e.color[k] >= 0 && e.color[k] <= 1)) fail('effect color out of range'); if (!(e.radius >= 0)) fail('effect radius'); } this._fx = v; }
  set strokesIncludedInLayout(v) { if (this.layoutMode === 'NONE') fail('strokesIncludedInLayout needs auto layout'); }
  set primaryAxisSizingMode(v) { if (!['FIXED', 'AUTO'].includes(v)) fail('bad primaryAxisSizingMode'); }
  set counterAxisSizingMode(v) { if (!['FIXED', 'AUTO'].includes(v)) fail('bad counterAxisSizingMode'); }
}
class Text extends Base {
  constructor() { super('TEXT'); this._font = { family: 'Inter', style: 'Regular' }; this._chars = ''; this.textAutoResize = 'WIDTH_AND_HEIGHT'; this._fills = []; }
  set fontName(f) { if (!loaded.has(fkey(f))) fail(`font not loaded: ${fkey(f)}`); this._font = f; } get fontName() { return this._font; }
  set characters(s) { if (!loaded.has(fkey(this._font))) fail(`Cannot write to node with unloaded font "${fkey(this._font)}"`); if (typeof s !== 'string') fail('characters must be a string'); this._chars = s; this._w = Math.max(1, s.length * 6); }
  get characters() { return this._chars; }
  set fills(v) { checkPaints(v, 'text fills'); this._fills = v; } get fills() { return this._fills; }
  set lineHeight(v) { if (typeof v !== 'object' || !v.unit) fail('lineHeight must be {unit, value}'); }
  set letterSpacing(v) { if (typeof v !== 'object' || !v.unit) fail('letterSpacing must be {unit, value}'); }
  set textAlignHorizontal(v) { if (!['LEFT', 'CENTER', 'RIGHT', 'JUSTIFIED'].includes(v)) fail('bad textAlignHorizontal ' + v); }
  set textDecoration(v) { if (!['NONE', 'UNDERLINE', 'STRIKETHROUGH'].includes(v)) fail('bad textDecoration'); }
  _range(s, e) { if (!(s >= 0 && e > s && e <= this._chars.length)) fail(`text range ${s}–${e} outside 0–${this._chars.length}`); }
  setRangeFontName(s, e, f) { this._range(s, e); if (!loaded.has(fkey(f))) fail('range font not loaded'); }
  setRangeFontSize(s, e, v) { this._range(s, e); if (!(v >= 1)) fail('range size'); }
  setRangeFills(s, e, v) { this._range(s, e); checkPaints(v, 'range fills'); }
  setRangeTextDecoration(s, e, v) { this._range(s, e); }
  async setTextStyleIdAsync(id) { if (typeof id !== 'string') fail('style id'); this._style = id; }
}
class Rect extends Base {
  constructor() { super('RECTANGLE'); this._fills = []; }
  set fills(v) { checkPaints(v, 'rect fills'); this._fills = v; } get fills() { return this._fills; }
}
class Page extends Container { constructor() { super('PAGE'); } }

const page0 = new Page(); page0.name = 'Page 1';
const existing = new Frame(); existing.resize(1200, 800); existing.x = 300; existing.y = -50; page0.appendChild(existing);
let current = page0, notified = null, closed = null;
const varStore = [], collStore = [], styleStore = [];
const figma = {
  get currentPage() { return current; },
  set currentPage(_) { fail('Setting figma.currentPage is not supported'); },
  async setCurrentPageAsync(p) { current = p; },
  createPage() { if (noPage) fail('The Starter plan only allows 3 pages'); return new Page(); },
  createFrame: () => new Frame(), createText: () => new Text(), createRectangle: () => new Rect(),
  createNodeFromSvg(svg) {
    if (!/^<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(svg) || !svg.endsWith('</svg>')) fail('bad svg');
    const open = (svg.match(/<[a-z][^>]*[^/]>/gi) || []).length, close = (svg.match(/<\/[a-z]+>/gi) || []).length;
    if (open !== close) fail(`unbalanced svg tags (${open} vs ${close})`);
    const f = new Frame(); const m = /width="([\d.]+)" height="([\d.]+)"/.exec(svg); if (!m) fail('svg without width/height'); f.resize(+m[1], +m[2]); return f;
  },
  async listAvailableFontsAsync() { return ['Thin', 'ExtraLight', 'Light', 'Regular', 'Text', 'Medium', 'SemiBold', 'Bold'].map(style => ({ fontName: { family: 'IBM Plex Sans KR', style } })).concat([{ fontName: { family: 'Inter', style: 'Regular' } }]); },
  async loadFontAsync(f) { loaded.add(fkey(f)); },
  base64Decode: s => new Uint8Array(Buffer.from(s, 'base64')),
  createImage(bytes) { if (!(bytes instanceof Uint8Array) || bytes.length < 100) fail('createImage: bad bytes'); if (!(bytes[0] === 0xff && bytes[1] === 0xd8) && !(bytes[0] === 0x89 && bytes[1] === 0x50)) fail('createImage: not JPEG/PNG'); return { hash: 'h' + bytes.length }; },
  createTextStyle() { const s = { id: 'S:' + (++idc), name: '', set fontName(f) { if (!loaded.has(fkey(f))) fail('style font not loaded'); } }; styleStore.push(s); return s; },
  async getLocalTextStylesAsync() { return styleStore; },
  variables: {
    async getLocalVariableCollectionsAsync() { return collStore; },
    async getLocalVariablesAsync() { return varStore; },
    createVariableCollection(name) { const c = { id: 'VC:' + (++idc), name, modes: [{ modeId: 'm1', name: 'Mode 1' }], renameMode() {} }; collStore.push(c); return c; },
    createVariable(name, coll, type) { if (type !== 'COLOR') fail('var type'); const v = { id: 'V:' + (++idc), name, variableCollectionId: coll.id, setValueForMode(m, val) { for (const k of ['r', 'g', 'b']) if (!(val[k] >= 0 && val[k] <= 1)) fail('variable color out of range'); }, scopes: [] }; varStore.push(v); return v; },
    setBoundVariableForPaint(p, field, v) { if (p.type !== 'SOLID' || field !== 'color') fail('bind only SOLID.color'); return { ...p, boundVariables: { color: { type: 'VARIABLE_ALIAS', id: v.id } } }; },
  },
  viewport: { scrollAndZoomIntoView() {} },
  notify(m) { notified = m; },
  closePlugin(m) { closed = m; },
};

const code = readFileSync(join(root, 'figma/plugin/code.js'), 'utf8');
const logs = [];
const ctx = vm.createContext({ figma, console: { log: (...a) => logs.push(a.join(' ')), error: (...a) => logs.push('ERROR ' + a.map(x => x && x.stack || x).join(' ')) }, Uint8Array, Promise, Math, JSON, Object, Array, Set, String, Number, parseInt });
vm.runInContext(code, ctx, { filename: 'code.js' });
await new Promise(r => setTimeout(r, 1500));
const count = n => (n.children || []).reduce((a, c) => a + count(c), 1);
console.log(logs.join('\n'));
console.log('closePlugin:', closed);
console.log('page:', current.name, '| top-level nodes:', current.children.length, '| total nodes:', count(current) - 1, '| variables:', varStore.length, '| text styles:', styleStore.length);
if (noPage) { const xs = current.children.filter(c => c !== existing).map(c => c.x); console.log('placed right of existing content (existing right edge 1500): min x =', Math.min(...xs)); }
const notices = (logs.find(l => l.includes('알림\n')) || '').split('\n- ').slice(1);
const expected = noPage ? notices.filter(n => !n.startsWith('새 페이지를 만들 수 없어')) : notices;
if (!closed || /실패/.test(closed) || logs.some(l => l.startsWith('ERROR')) || expected.length) { console.log('MOCK RUN: 문제 있음', expected); process.exit(1); }
console.log('MOCK RUN: 통과');
