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

  // ── 1. 글꼴: 라틴 글자 · 숫자는 Outfit, 한글은 Gothic A1 (둘 다 피그마에 들어 있는 Google Fonts) ──
  const WEIGHT = { 200: ['extralight', 'ultralight'], 300: ['light'], 400: ['regular'], 500: ['medium'], 600: ['semibold', 'demibold'], 700: ['bold'] };
  const norm = s => String(s).toLowerCase().replace(/[\s_-]/g, '');
  const avail = await figma.listAvailableFontsAsync();
  const byFamily = fam => avail.filter(f => f.fontName.family === fam);
  /** @type {Record<string, FontName>} */
  const FONT = {};
  for (const [fam, weights] of Object.entries(D.fonts)) {
    let family = fam;
    if (!byFamily(family).length) {
      const alt = ['Noto Sans KR', 'Pretendard', 'Inter'].find(f => byFamily(f).length);
      warn.push(`글꼴 "${fam}" 을(를) 찾지 못해 "${alt || 'Inter'}" 로 대신했습니다. 글자 폭이 달라져 줄바꿈이 어긋날 수 있습니다.`);
      family = alt || 'Inter';
    }
    const styles = byFamily(family).map(f => f.fontName.style);
    for (const wt of /** @type {number[]} */ (weights)) {
      const want = WEIGHT[wt] || ['regular'];
      const hit = styles.find(s => want.includes(norm(s))) || styles.find(s => norm(s) === 'regular') || styles[0] || 'Regular';
      FONT[fam + '|' + wt] = { family, style: hit };
    }
  }
  const uniq = {};
  for (const f of Object.values(FONT)) uniq[f.family + '|' + f.style] = f;
  await Promise.all(Object.values(uniq).map(f => figma.loadFontAsync(f)));
  const fontOf = (fam, wt) => FONT[fam + '|' + wt] || FONT[fam + '|400'] || Object.values(FONT)[0];

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
        st.fontName = fontOf(s.fam, s.wt);
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
  // 배경 사진: 프레임(w × h) 안의 (b.x, b.y) 자리에 b.w × b.h 크기로 놓인 사진을 잘라 보이는 채움으로 옮긴다
  function imagePaint(b, n) {
    if (!IMG[b.img]) return null;
    return { type: 'IMAGE', imageHash: IMG[b.img], scaleMode: 'CROP', imageTransform: [[n.w / b.w, 0, -b.x / b.w], [0, n.h / b.h, -b.y / b.h]] };
  }
  // 선형 그라데이션: 시작점 · 끝점(프레임 안의 픽셀 좌표)을 피그마의 변환 행렬로 옮긴다.
  // 피그마의 행렬은 "프레임(0–1 좌표) → 그라데이션 좌표(가로 0–1 이 진행 방향, 세로 0.5 가 중심선)" 이므로, 그 반대 방향 행렬을 만들어 뒤집는다.
  function linearPaint(g, n) {
    const dx = g.x2 - g.x1, dy = g.y2 - g.y1;
    const a = dx / n.w, c = dy / n.h, b = -dy / n.w, d = dx / n.h;                 // (a, c): 진행 방향, (b, d): 그에 수직인 방향
    const tx = g.x1 / n.w - 0.5 * b, ty = g.y1 / n.h - 0.5 * d;
    const det = a * d - b * c;
    if (!det) return null;
    return {
      type: 'GRADIENT_LINEAR',
      gradientTransform: [[d / det, -b / det, (b * ty - d * tx) / det], [-c / det, a / det, (c * tx - a * ty) / det]],
      gradientStops: g.stops.map(s => ({ position: Math.min(1, Math.max(0, s.p)), color: { r: s.c.r / 255, g: s.c.g / 255, b: s.c.b / 255, a: s.c.a == null ? 1 : s.c.a } })),
    };
  }
  const dim = v => Math.max(0.01, v);
  function place(node, n, parent, isRoot) {
    parent.appendChild(node);
    if (isRoot) return;
    if (n.abs) {
      ok(() => { node.layoutPositioning = 'ABSOLUTE'; }, 'abs');
      node.x = n.x; node.y = n.y;
      ok(() => { node.constraints = { horizontal: n.cons ? n.cons[0] : 'MIN', vertical: n.cons ? n.cons[1] : 'MIN' }; }, 'constraints');
    }
  }
  function corners(node, rad) {
    if (!rad) return;
    if (rad.every(v => v === rad[0])) node.cornerRadius = rad[0];
    else { node.topLeftRadius = rad[0]; node.topRightRadius = rad[1]; node.bottomRightRadius = rad[2]; node.bottomLeftRadius = rad[3]; }
  }
  // 자식을 넣는 순서: 흐름 안의 자식은 문서 순서대로, 절대 위치 자식은 자기보다 아래에 그려질 형제들 뒤에 (tools/figma/compact.mjs 의 orderKids 와 같은 규칙)
  function orderKids(kids) {
    const below = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
    const all = kids.map((k, i) => ({ k, key: [k.zi || 0, i] }));
    const out = all.filter(e => !e.k.abs);
    all.filter(e => e.k.abs).sort((a, b) => (below(a.key, b.key) ? -1 : 1)).forEach(e => {
      let at = 0;
      out.forEach((o, i) => { if (below(o.key, e.key)) at = i + 1; });
      out.splice(at, 0, e);
    });
    return out.map(e => e.k);
  }

  function buildFrame(n, parent, isRoot) {
    const f = figma.createFrame();
    f.name = n.n || 'Frame';
    /** @type {Paint[]} */
    const fills = n.fill ? [solid(n.fill)] : [];
    for (const b of n.bg || []) { const p = ok(() => (b.k === 'img' ? imagePaint(b, n) : linearPaint(b, n)), 'background'); if (p) fills.push(/** @type {Paint} */ (p)); }
    ok(() => { f.fills = fills; }, `fills ${n.n}`);
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
    for (const k of orderKids(n.kids)) build(k, f);
    return f;
  }

  function buildText(n, parent) {
    const t = figma.createText();
    const st = TSTYLE[n.ts];
    t.fontName = fontOf(n.font.fam, n.font.wt);
    t.fontSize = n.font.size;
    t.lineHeight = { unit: 'PIXELS', value: n.font.lh };
    if (n.font.ls) t.letterSpacing = { unit: 'PIXELS', value: n.font.ls };
    t.fills = [solid(n.c)];
    t.textAlignHorizontal = n.align || 'LEFT';
    if (n.ar === 'H') t.textAutoResize = 'HEIGHT';       // 글자를 넣기 전에 정한다
    place(t, n, parent, false);
    if (n.ar === 'H') t.resize(dim(n.w), dim(n.h));
    t.characters = n.chars.replace(/\n/g, ' ');     // 브라우저의 줄바꿈 위치를 그대로 (문단 안 줄바꿈)
    if (n.deco) t.textDecoration = n.deco === 'U' ? 'UNDERLINE' : 'STRIKETHROUGH';
    // 섞인 글: 구간마다 글꼴(라틴 Outfit · 한글 Gothic A1) · 굵기 · 크기 · 색 · 자간을 따로 건다.
    // 자간은 브라우저가 그린 폭에 맞춘 값이라, 고정 폭 글의 줄바꿈이 화면과 같은 자리에서 일어난다.
    for (const r of n.runs || []) {
      ok(() => {
        if (r.fam !== n.font.fam || r.wt !== n.font.wt) t.setRangeFontName(r.s, r.e, fontOf(r.fam, r.wt));
        if (r.size !== n.font.size) t.setRangeFontSize(r.s, r.e, r.size);
        if (r.c && (hexOf(r.c) !== hexOf(n.c) || r.c.a !== n.c.a)) t.setRangeFills(r.s, r.e, [solid(r.c)]);
        if (r.deco !== (n.deco || '')) t.setRangeTextDecoration(r.s, r.e, r.deco === 'U' ? 'UNDERLINE' : r.deco === 'S' ? 'STRIKETHROUGH' : 'NONE');
        if (Math.abs((r.ls || 0) - (n.font.ls || 0)) > 0.001) t.setRangeLetterSpacing(r.s, r.e, { unit: 'PIXELS', value: r.ls || 0 });
      }, 'text run');
    }
    if (n.tsh) ok(() => { t.effects = [{ type: 'DROP_SHADOW', color: { r: n.tsh.c.r / 255, g: n.tsh.c.g / 255, b: n.tsh.c.b / 255, a: n.tsh.c.a }, offset: { x: n.tsh.x, y: n.tsh.y }, radius: n.tsh.blur, spread: 0, visible: true, blendMode: 'NORMAL' }]; }, 'text shadow');
    if (n.op != null) t.opacity = n.op;
    if (!n.abs && n.ar === 'H' && n.sw === 'FILL') {
      ok(() => { t.layoutSizingHorizontal = 'FILL'; }, 'text fill');
      if (t.width < 1) t.resize(dim(n.w), dim(n.h));     // 채움이 0폭으로 무너지면 측정값으로 되돌린다
    }
    if (st) pendingStyles.push([t, st]);               // 한 가지 모양뿐인 글만 스타일 키(ts)를 가진다
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
    // fit: 기본은 채우기(cover). contain 은 맞춤, fill(구운 배경 · canvas)은 상자와 같은 비율이라 채우기로 충분하다.
    r.fills = IMG[n.img] ? [{ type: 'IMAGE', imageHash: IMG[n.img], scaleMode: n.fit === 'contain' ? 'FIT' : 'FILL' }] : [{ type: 'SOLID', color: { r: 0.87, g: 0.88, b: 0.9 } }];
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

  // ── 6. 보드: 보드마다 제목, 줄마다 줄 이름, 화면 위에 이름표 ───
  const GAP = 120, ROW_GAP = 200, BOARD_GAP = 480, LABEL = 56;
  const INK = { r: 28, g: 31, b: 90, a: 1 }, SUB = { r: 79, g: 86, b: 95, a: 1 };
  const caption = (str, size, wt, c, x, y) => {
    const t = figma.createText();
    t.fontName = fontOf(D.label, wt); t.fontSize = size; t.characters = str;
    t.fills = [solid(c)];
    page.appendChild(t); t.x = x; t.y = y;
    return t;
  };
  let y = originY;
  const made = [];
  for (const board of D.boards) {
    caption(board.title, 44, 600, INK, originX, y);
    y += 120;
    for (const row of board.rows) {
      if (row.label) { caption(row.label, 30, 500, INK, originX, y); y += 96; }
      let x = originX, rowH = 0;
      for (const s of row.screens) {
        caption(s.name, 22, 500, SUB, x, y);
        const root = ok(() => buildFrame(Object.assign({}, s.tree, { n: s.name }), page, true), 'screen ' + s.name);
        if (root) { root.x = x; root.y = y + LABEL; made.push(root); stat.screens++; }
        x += s.tree.w + GAP; rowH = Math.max(rowH, s.tree.h);
      }
      y += LABEL + rowH + ROW_GAP;
    }
    y += BOARD_GAP - ROW_GAP;
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
