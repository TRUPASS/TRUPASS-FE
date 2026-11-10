// Trupass 피그마 생성기 (런타임).
// TRUPASS_DATA(화면 노드 트리 + 토큰 + 이미지)를 읽어 오토레이아웃 프레임·텍스트 스타일·색 변수로 짓는다.
// 피그마 플러그인(개발용 가져오기)과 브라우저 콘솔(figma 전역) 양쪽에서 같은 파일로 돈다.
// 이 파일은 손으로 쓴 원본이고, figma/plugin/code.js 는 데이터를 붙여 만든 생성물이다.
/* global figma, TRUPASS_DATA */
// @ts-check

async function TRUPASS_BUILD() {
  /** @type {any} */
  const D = TRUPASS_DATA;
  /** @type {string[]} */
  const warn = [];
  const stat = { frames: 0, texts: 0, vectors: 0, images: 0, screens: 0 };
  const ok = (fn, label) => { try { return fn(); } catch (e) { warn.push(label + ': ' + (e && e.message ? e.message : e)); return undefined; } };

  // ── 1. 글꼴 ────────────────────────────────────────────────
  const WEIGHT = { 400: ['regular'], 500: ['medium'], 600: ['semibold', 'demibold'], 700: ['bold'] };
  const norm = s => String(s).toLowerCase().replace(/[\s_-]/g, '');
  const avail = await figma.listAvailableFontsAsync();
  const byFamily = fam => avail.filter(f => f.fontName.family === fam);
  let family = D.font;
  if (!byFamily(family).length) {
    const alt = ['Noto Sans KR', 'Pretendard', 'Inter'].find(f => byFamily(f).length);
    warn.push(`글꼴 "${D.font}" 을(를) 찾지 못해 "${alt || 'Inter'}" 로 대신했습니다. 글자 폭이 달라져 줄바꿈이 어긋날 수 있습니다.`);
    family = alt || 'Inter';
  }
  const styles = byFamily(family).map(f => f.fontName.style);
  /** @type {Record<number, FontName>} */
  const FONT = {};
  for (const wt of D.weights) {
    const want = WEIGHT[wt] || ['regular'];
    const hit = styles.find(s => want.includes(norm(s))) || styles.find(s => norm(s) === 'regular') || styles[0] || 'Regular';
    FONT[wt] = { family, style: hit };
  }
  await Promise.all(Object.values(FONT).map(f => figma.loadFontAsync(f)));
  const fontOf = wt => FONT[wt] || FONT[400] || Object.values(FONT)[0];

  // ── 2. 놓을 자리: 새 페이지를 만들 수 있으면 만들고, 안 되면(무료 플랜 3페이지 제한 등) 현재 페이지 오른쪽에 놓는다 ──
  let page = figma.currentPage;
  let originX = 0, originY = 0;
  try {
    const p = figma.createPage();
    p.name = D.pageName;
    await figma.setCurrentPageAsync(p);
    page = p;
  } catch (e) {
    let maxX = 0, minY = 0, any = false;
    for (const c of page.children) { if ('width' in c) { maxX = any ? Math.max(maxX, c.x + c.width) : c.x + c.width; minY = any ? Math.min(minY, c.y) : c.y; any = true; } }
    originX = any ? Math.ceil(maxX + 800) : 0; originY = any ? minY : 0;
    warn.push('새 페이지를 만들 수 없어 현재 페이지의 오른쪽 빈 자리에 놓았습니다.');
  }

  // ── 3. 색 변수 (실패해도 화면은 짓는다) ─────────────────────
  /** @type {Record<string, Variable>} */
  const VAR = {};
  await (async () => {
    try {
      const cols = await figma.variables.getLocalVariableCollectionsAsync();
      const coll = cols.find(c => c.name === D.collection) || figma.variables.createVariableCollection(D.collection);
      const mode = coll.modes[0].modeId;
      ok(() => coll.renameMode(mode, 'Light'), 'mode name');
      const existing = await figma.variables.getLocalVariablesAsync('COLOR');
      for (const [name, hex] of Object.entries(D.tokens)) {
        let v = existing.find(x => x.variableCollectionId === coll.id && x.name === name);
        if (!v) v = figma.variables.createVariable(name, coll, 'COLOR');
        v.setValueForMode(mode, rgb(hex));
        ok(() => { v.scopes = ['ALL_FILLS', 'STROKE_COLOR', 'EFFECT_COLOR']; }, 'scopes');
        VAR[String(hex).toLowerCase()] = v;
      }
    } catch (e) { warn.push('색 변수 생성 건너뜀: ' + (e && e.message)); }
  })();

  // ── 4. 텍스트 스타일 ───────────────────────────────────────
  /** @type {Record<string, TextStyle>} */
  const TSTYLE = {};
  await (async () => {
    try {
      const local = await figma.getLocalTextStylesAsync();
      for (const s of D.textStyles) {
        let st = local.find(x => x.name === s.name);
        if (!st) { st = figma.createTextStyle(); st.name = s.name; }
        st.fontName = fontOf(s.wt);
        st.fontSize = s.size;
        st.lineHeight = { unit: 'PIXELS', value: s.lh };
        st.letterSpacing = { unit: 'PIXELS', value: s.ls || 0 };
        TSTYLE[s.key] = st;
      }
    } catch (e) { warn.push('텍스트 스타일 생성 건너뜀: ' + (e && e.message)); }
  })();

  // ── 5. 이미지 ──────────────────────────────────────────────
  /** @type {Record<string, string>} */
  const IMG = {};
  for (const [key, b64] of Object.entries(D.images)) {
    ok(() => { IMG[key] = figma.createImage(figma.base64Decode(/** @type {string} */ (b64))).hash; }, 'image ' + key);
  }

  // ── 그리기 도우미 ──────────────────────────────────────────
  function rgb(hex) {
    const h = String(hex).replace('#', '');
    return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 };
  }
  const hexOf = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  /** @returns {SolidPaint} */
  function solid(c) {
    /** @type {SolidPaint} */
    let p = { type: 'SOLID', color: { r: c.r / 255, g: c.g / 255, b: c.b / 255 }, opacity: c.a == null ? 1 : c.a };
    const v = VAR[hexOf(c)];
    if (v) { const b = ok(() => figma.variables.setBoundVariableForPaint(p, 'color', v), 'bind'); if (b) p = b; }
    return p;
  }
  const dim = v => Math.max(0.01, v);
  function place(node, n, parent, isRoot) {
    parent.appendChild(node);
    if (isRoot) return;
    if (n.abs) {
      ok(() => { node.layoutPositioning = 'ABSOLUTE'; }, 'abs');
      node.x = n.x; node.y = n.y;
      ok(() => { node.constraints = { horizontal: 'MIN', vertical: 'MIN' }; }, 'constraints');
    }
  }
  function corners(node, rad) {
    if (!rad) return;
    if (rad.every(v => v === rad[0])) node.cornerRadius = rad[0];
    else { node.topLeftRadius = rad[0]; node.topRightRadius = rad[1]; node.bottomRightRadius = rad[2]; node.bottomLeftRadius = rad[3]; }
  }

  function buildFrame(n, parent, isRoot) {
    const f = figma.createFrame();
    f.name = n.n || 'Frame';
    f.fills = n.fill ? [solid(n.fill)] : [];
    f.clipsContent = !!n.clip;
    f.layoutMode = n.lay === 'H' ? 'HORIZONTAL' : 'VERTICAL';
    f.itemSpacing = n.gap || 0;
    if (n.wrap && n.lay === 'H') { f.layoutWrap = 'WRAP'; if (n.cgap) ok(() => { f.counterAxisSpacing = n.cgap; }, 'wrap gap'); }
    const p = n.pad || [0, 0, 0, 0];
    f.paddingTop = p[0]; f.paddingRight = p[1]; f.paddingBottom = p[2]; f.paddingLeft = p[3];
    f.primaryAxisAlignItems = n.ja || 'MIN';
    f.counterAxisAlignItems = n.aa === 'BASELINE' && n.lay !== 'H' ? 'MIN' : (n.aa || 'MIN');
    if (n.stroke) {
      f.strokes = [solid(n.stroke.c)];
      f.strokeAlign = 'INSIDE';
      const w = n.stroke.w;
      if (w.every(v => v === w[0])) f.strokeWeight = w[0];
      else { f.strokeWeight = Math.max(w[0], w[1], w[2], w[3]); ok(() => { f.strokeTopWeight = w[0]; f.strokeRightWeight = w[1]; f.strokeBottomWeight = w[2]; f.strokeLeftWeight = w[3]; }, 'side strokes'); }
      ok(() => { f.strokesIncludedInLayout = true; }, 'stroke layout');   // CSS 테두리처럼 선 두께가 레이아웃에 들어간다
    }
    corners(f, n.rad);
    if (n.fx) {
      /** @type {Effect[]} */
      const fx = n.fx.map(s => ({ type: s.inset ? 'INNER_SHADOW' : 'DROP_SHADOW', color: { r: s.c.r / 255, g: s.c.g / 255, b: s.c.b / 255, a: s.c.a }, offset: { x: s.x, y: s.y }, radius: s.blur, spread: s.spread, visible: true, blendMode: 'NORMAL' }));
      ok(() => { f.effects = fx; }, 'effects');
      if (n.fx.some(s => s.spread)) f.clipsContent = true;   // 퍼짐 값은 내용 자르기를 켠 프레임에서만 그려진다
    }
    if (n.op != null) f.opacity = n.op;
    f.resize(dim(n.w), dim(n.h));                        // 먼저 측정값으로 크기를 잡고 (FIXED)
    place(f, n, parent, isRoot);                         // 부모에 붙인 뒤에 HUG / FILL 을 건다
    if (!n.abs && !isRoot) {
      ok(() => { f.layoutSizingHorizontal = n.sw; }, `sizing-w ${n.n}`);
      ok(() => { f.layoutSizingVertical = n.sh; }, `sizing-h ${n.n}`);
      if (n.minH) ok(() => { f.minHeight = n.minH; }, 'minHeight');
      if (n.maxW) ok(() => { f.maxWidth = n.maxW; }, 'maxWidth');
    } else {
      f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED';
    }
    stat.frames++;
    for (const k of n.kids) build(k, f);
    return f;
  }

  function buildText(n, parent) {
    const t = figma.createText();
    const st = TSTYLE[n.ts];
    t.fontName = fontOf(n.font.wt);
    t.fontSize = n.font.size;
    t.lineHeight = { unit: 'PIXELS', value: n.font.lh };
    if (n.font.ls) t.letterSpacing = { unit: 'PIXELS', value: n.font.ls };
    t.fills = [solid(n.c)];
    t.textAlignHorizontal = n.align || 'LEFT';
    if (n.ar === 'H') t.textAutoResize = 'HEIGHT';       // 글자를 넣기 전에 정한다
    place(t, n, parent, false);
    if (n.ar === 'H') t.resize(dim(n.w), dim(n.h));
    t.characters = n.chars.replace(/\n/g, ' ');     // 브라우저의 줄바꿈 위치를 그대로 (문단 안 줄바꿈)
    if (n.deco) t.textDecoration = n.deco === 'U' ? 'UNDERLINE' : 'STRIKETHROUGH';
    for (const r of n.runs || []) {
      ok(() => {
        if (r.wt !== n.font.wt) t.setRangeFontName(r.s, r.e, fontOf(r.wt));
        if (r.size !== n.font.size) t.setRangeFontSize(r.s, r.e, r.size);
        if (r.c && hexOf(r.c) !== hexOf(n.c)) t.setRangeFills(r.s, r.e, [solid(r.c)]);
        if (r.deco !== (n.deco || '')) t.setRangeTextDecoration(r.s, r.e, r.deco === 'U' ? 'UNDERLINE' : r.deco === 'S' ? 'STRIKETHROUGH' : 'NONE');
      }, 'text run');
    }
    if (n.op != null) t.opacity = n.op;
    if (!n.abs && n.ar === 'H' && n.sw === 'FILL') {
      ok(() => { t.layoutSizingHorizontal = 'FILL'; }, 'text fill');
      if (t.width < 1) t.resize(dim(n.w), dim(n.h));     // 채움이 0폭으로 무너지면 측정값으로 되돌린다
    }
    if (st && !(n.runs && n.runs.length)) pendingStyles.push([t, st]);
    stat.texts++;
    return t;
  }

  function buildSvg(n, parent) {
    const v = figma.createNodeFromSvg(D.svgs[n.svg]);
    v.name = n.n || 'vector';
    if (Math.abs(v.width - n.w) > 0.5 || Math.abs(v.height - n.h) > 0.5) ok(() => v.resize(dim(n.w), dim(n.h)), 'svg resize');
    if (n.op != null) v.opacity = n.op;
    place(v, n, parent, false);
    stat.vectors++;
    return v;
  }

  function buildImage(n, parent) {
    const r = figma.createRectangle();
    r.name = n.n || 'Image';
    r.resize(dim(n.w), dim(n.h));
    r.fills = IMG[n.img] ? [{ type: 'IMAGE', imageHash: IMG[n.img], scaleMode: 'FILL' }] : [{ type: 'SOLID', color: { r: 0.87, g: 0.88, b: 0.9 } }];
    corners(r, n.rad);
    if (n.op != null) r.opacity = n.op;
    place(r, n, parent, false);
    stat.images++;
    return r;
  }

  /** @type {[TextNode, TextStyle][]} */
  const pendingStyles = [];
  function build(n, parent) {
    return ok(() => n.t === 'F' ? buildFrame(n, parent, false) : n.t === 'T' ? buildText(n, parent) : n.t === 'S' ? buildSvg(n, parent) : buildImage(n, parent), `${n.t} "${n.n || (n.chars || '').slice(0, 16)}"`);
  }

  // ── 6. 보드: 폭별 한 줄, 화면 위에 이름표 ───────────────────
  const GAP = 120, ROW_GAP = 480, LABEL = 56;
  let y = originY;
  const made = [];
  for (const board of D.boards) {
    const title = figma.createText();
    title.fontName = fontOf(600); title.fontSize = 44; title.characters = board.title;
    title.fills = [solid({ r: 18, g: 22, b: 29, a: 1 })];
    page.appendChild(title); title.x = originX; title.y = y;
    y += 120;
    let x = originX, rowH = 0;
    for (const s of board.screens) {
      const label = figma.createText();
      label.fontName = fontOf(500); label.fontSize = 22; label.characters = s.name;
      label.fills = [solid({ r: 79, g: 86, b: 95, a: 1 })];
      page.appendChild(label); label.x = x; label.y = y;
      const root = ok(() => buildFrame(Object.assign({}, s.tree, { n: s.name }), page, true), 'screen ' + s.name);
      if (root) { root.x = x; root.y = y + LABEL; made.push(root); stat.screens++; }
      x += s.tree.w + GAP; rowH = Math.max(rowH, s.tree.h);
    }
    y += LABEL + rowH + ROW_GAP;
  }

  // 텍스트 스타일 연결 (한꺼번에)
  await Promise.all(pendingStyles.map(([t, st]) => t.setTextStyleIdAsync(st.id).catch(() => undefined)));

  ok(() => { figma.viewport.scrollAndZoomIntoView(made.slice(0, 6)); }, 'viewport');
  const msg = `Trupass: 화면 ${stat.screens}개 생성 (프레임 ${stat.frames} · 텍스트 ${stat.texts} · 벡터 ${stat.vectors} · 이미지 ${stat.images})` + (warn.length ? ` · 알림 ${warn.length}건` : '');
  if (warn.length) console.log('[Trupass] 알림\n- ' + Array.from(new Set(warn)).slice(0, 40).join('\n- '));
  console.log('[Trupass] ' + msg);
  ok(() => { figma.notify(msg, { timeout: 8000 }); }, 'notify');
  return { msg, warn, stat };
}

TRUPASS_BUILD().then(
  r => { try { figma.closePlugin(r.msg); } catch (e) { /* 콘솔에서 실행한 경우 */ } },
  e => { console.error('[Trupass] 실패', e); try { figma.closePlugin('Trupass 생성 실패: ' + (e && e.message ? e.message : e)); } catch (x) { /* 콘솔 */ } },
);
