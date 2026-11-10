/* Trupass 정적 사이트의 움직임과 화면 사이의 연결. 의존하는 라이브러리 없음.
   - 스크립트가 없어도 내용은 모두 보인다(연출과 숨김은 CSS 의 .js 범위에만 있다). 이 파일은 연출과 계산을 더한다.
   - 스크롤 구간([data-sec])마다 진행도 --p(0→1)를 넣는다. 화면의 움직임은 CSS 가 --p 로 계산한다.
   - 랜딩에서 적은 문장 세 개는 sessionStorage 에 담아 다음 화면으로 넘긴다.
   - 고르는 자리는 실제 라디오 · 체크박스다. 여기서는 그 상태를 읽어 합계와 표시를 맞춘다.
   - 주소 끝에 #still 을 붙이면(정지 화면 캡처용) 자동 이동과 부드러운 따라가기를 끈다. */
(function () {
  'use strict';
  var doc = document, body = doc.body;
  var still = location.hash === '#still';
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var $ = function (s, el) { return (el || doc).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var ease = function (t) { return t * t * (3 - 2 * t); };
  var flag = function (el, name, on) { if (on) el.setAttribute(name, 'true'); else el.removeAttribute(name); };

  /* ── 문장 세 개 보관 ── */
  var KEY = 'tp.prompts';
  var store = {
    get: function () { try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } },
    put: function (k, v) { var o = store.get(); o[k] = v; try { sessionStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} },
  };
  // 앞 화면에서 적은 문장이 있으면 그 문장으로 바꿔 보여 준다 (없으면 시안의 예시 문장 그대로).
  var saved = store.get(), any = Object.keys(saved).some(function (k) { return !!saved[k]; });
  if (any) $$('[data-prompt]').forEach(function (el) { var v = saved[el.dataset.prompt]; el.textContent = v || '적지 않았습니다'; el.classList.toggle('is-empty', !v); });
  // 적어 둔 문장 없이 들어온 경우(예: 랜딩에서 바로 [로그인]) 예시 문장임을 알린다. 정지 화면 캡처에서는 바꾸지 않는다.
  else if (!still) $$('[data-when-empty]').forEach(function (el) { el.textContent = el.dataset.whenEmpty; });

  /* ── 스크롤 구간 ── */
  var secs = $$('[data-sec]').map(function (el) { return { el: el, k: el.dataset.sec, p: -1 }; });
  var sec = function (k) { return secs.filter(function (x) { return x.k === k; })[0]; };
  var vh = window.innerHeight, raf = 0;
  var GROW = 0.16;                       // 서비스 구간: 앞 16% 는 창이 커지는 동안
  var HOLD = 0.34;                       // 각 질문에서 머무는 자리(구간 안 0–1)
  var FX = {
    stats: function (s, p) {
      $$('[data-count]', s.el).forEach(function (el) {
        var i = +el.dataset.i, n = +el.dataset.count, t = ease(clamp((p - 0.1 - i * 0.07) / 0.5, 0, 1));
        var v = String(Math.round(n * t)); if (el.textContent !== v) el.textContent = v;
      });
    },
    svc: function (s, p) {
      var g = clamp(p / GROW, 0, 1), ge = ease(g), q = clamp((p - GROW) / (1 - GROW), 0, 1) * 3;
      var st = Math.min(2, Math.floor(q)), f = q - st, sl = st < 2 ? clamp((f - 0.74) / 0.26, 0, 1) : 0;
      var s1 = st === 0 ? sl : 1, s2 = st === 1 ? sl : st === 2 ? 1 : 0;
      var st2 = s.el.style;
      st2.setProperty('--g', ge.toFixed(4)); st2.setProperty('--s1', ease(s1).toFixed(4)); st2.setProperty('--s2', ease(s2).toFixed(4)); st2.setProperty('--bar', (q / 3).toFixed(4));
      var on = String(Math.min(2, st + (sl > 0.5 ? 1 : 0)));
      if (s.el.dataset.on !== on) s.el.dataset.on = on;
      s.el.classList.toggle('live', g > 0.9);          // 창이 다 커졌다 → 입력 칸을 누를 수 있다
      s.el.classList.toggle('mq-gone', ge > 0.59);     // 흐르는 글자가 다 사라졌다 → 멈춤 단추도 치운다
    },
  };
  function measure() {
    vh = window.innerHeight;
    secs.forEach(function (s) { var r = s.el.getBoundingClientRect(); s.top = r.top + window.scrollY; s.h = r.height; });
  }
  function goal(s) { var span = s.h - vh; return span > 0 ? clamp((window.scrollY - s.top) / span, 0, 1) : (window.scrollY >= s.top ? 1 : 0); }
  function frame() {
    var moving = false;
    secs.forEach(function (s) {
      var t = goal(s), p = (reduce || still || s.p < 0) ? t : s.p + (t - s.p) * 0.16;
      if (Math.abs(t - p) < 0.0004) p = t; else moving = true;
      if (p !== s.p) { s.p = p; s.el.style.setProperty('--p', p.toFixed(4)); if (FX[s.k]) FX[s.k](s, p); }
    });
    raf = moving ? requestAnimationFrame(frame) : 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  if (secs.length) {
    measure(); frame();
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', function () { measure(); kick(); });
    window.addEventListener('load', function () { measure(); kick(); });
  }
  function scrollTo(y, instant) { window.scrollTo({ top: Math.max(0, y), behavior: instant || reduce || still ? 'auto' : 'smooth' }); }
  // 서비스 구간의 i 번째 질문으로 간다. focus 면 그 질문이 보이는 대로 입력 칸에 커서를 둔다.
  function toStage(i, focus, instant) {
    var s = sec('svc'); if (!s) return;
    measure();
    scrollTo(s.top + (GROW + ((i + HOLD) / 3) * (1 - GROW)) * (s.h - vh), instant);
    if (!focus) return;
    var t0 = Date.now();
    (function wait() {
      var el = $('[data-stage-ui="' + i + '"] input'); if (!el) return;
      if ((s.el.dataset.on === String(i) && s.el.classList.contains('live')) || Date.now() - t0 > 2600) el.focus({ preventScroll: true });
      else setTimeout(wait, 60);
    })();
  }
  function go(next) {
    if (!next) return;
    if (next.indexOf('stage:') === 0) toStage(+next.slice(6), true);
    else if (next.indexOf('focus:') === 0) { var f = $('[data-ask="' + next.slice(6) + '"] input'); if (f) f.focus(); }
    else if (next.charAt(0) === '#') { var el = $(next); if (el) scrollTo(el.getBoundingClientRect().top + window.scrollY); }
    else leaveTo(next);
  }
  // 키보드로 문장 칸에 들어오면(아직 창이 커지기 전이라 보이지 않을 수 있다) 그 질문 자리로 스크롤해 보여 준다.
  $$('[data-stage-ui]').forEach(function (pane) {
    pane.addEventListener('focusin', function () {
      var s = sec('svc'), i = pane.dataset.stageUi;
      if (s && !(s.el.classList.contains('live') && s.el.dataset.on === i)) toStage(+i, false);
    });
  });
  // 다른 화면에서 [문장 다시 적기]로 돌아왔을 때(#search)는 첫 질문 자리에서 시작한다.
  if (location.hash === '#search' && sec('svc')) window.addEventListener('load', function () { toStage(0, true, true); });

  /* ── 화면을 넘길 때의 구름 장막 ──
     로그인 · 회원 정보 입력 화면으로 갈 때는 구름이 화면을 덮은 뒤 넘어간다. 도착한 화면은 구름이 걷히며 열린다(CSS, body.veil-in). */
  var VEIL = /(?:^|\/)(02-login|03-signup)\.html(?:[?#].*)?$/;
  function leaveTo(url) {
    if (reduce || still || !VEIL.test(url) || !$('.veil')) { location.href = url; return; }
    doc.documentElement.classList.add('leaving');
    setTimeout(function () { location.href = url; }, 640);
  }
  doc.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || a.target === '_blank' || !VEIL.test(a.getAttribute('href'))) return;
    e.preventDefault(); leaveTo(a.getAttribute('href'));
  });
  // 뒤로 가기로 돌아왔을 때 장막이 덮인 채 남지 않게 한다
  window.addEventListener('pageshow', function (e) { if (e.persisted) doc.documentElement.classList.remove('leaving'); });
  $$('[data-goto]').forEach(function (el) { el.addEventListener('click', function (e) { e.preventDefault(); go(el.dataset.goto); }); });
  // 정지 화면 캡처용: 이름으로 구간 위치를 계산해 준다 (tools/render.mjs 가 부른다)
  window.__tpStop = function (k, f) {
    measure();
    if (k === 'end') return doc.documentElement.scrollHeight - vh;
    if (k.charAt(0) === '#') { var el = $(k); return el ? el.getBoundingClientRect().top + window.scrollY : 0; }
    var s = sec(k);
    return s ? s.top + f * Math.max(0, s.h - vh) : 0;
  };

  /* ── 문장 입력 ── */
  $$('[data-ask]').forEach(function (form) {
    var k = form.dataset.ask, input = $('input', form);
    if (saved[k]) input.value = saved[k];
    input.addEventListener('input', function () { store.put(k, input.value.trim()); });
    form.addEventListener('submit', function (e) { e.preventDefault(); store.put(k, input.value.trim()); go(form.dataset.next); });
  });
  $$('[data-eg]').forEach(function (chip) {
    if (!chip.dataset.eg) return;                    // 값이 없는 예시는 수정 요청 독의 것 (아래에서 처리)
    chip.addEventListener('click', function () {
      var input = $('[data-ask="' + chip.dataset.eg + '"] input'); if (!input) return;
      input.value = chip.textContent; store.put(chip.dataset.eg, input.value); input.focus({ preventScroll: true });
    });
  });

  /* ── 흐르는 글자 멈춤 단추 ── */
  $$('[data-mq]').forEach(function (b) {
    if (reduce) { b.hidden = true; return; }         // 움직임을 끈 환경에서는 글자가 흐르지 않는다
    b.addEventListener('click', function () {
      var s = b.closest('[data-sec]'), on = !s.classList.contains('mq-paused');
      s.classList.toggle('mq-paused', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  });

  /* ── 좌우로 넘기는 상자 (이용 방법) ── */
  $$('[data-car]').forEach(function (car) {
    var slides = $$('[data-slide]', car), dots = $$('[data-dot]', car), prev = $('[data-car-prev]', car), next = $('[data-car-next]', car);
    var n = slides.length, i = 0;
    function show(j) {
      i = clamp(j, 0, n - 1);
      slides.forEach(function (s, k) { s.classList.toggle('on', k === i); s.classList.toggle('was', k < i); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); if (k === i) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
      // 끝에서는 꺼진 모양만 보인다(disabled 로 막으면 키보드 초점이 사라지므로 aria-disabled 를 쓴다)
      if (prev) flag(prev, 'aria-disabled', i === 0);
      if (next) flag(next, 'aria-disabled', i === n - 1);
      if (i === n - 1) car.classList.add('done');     // 끝까지 읽었다 → 아래로 스크롤을 권한다
    }
    if (prev) prev.addEventListener('click', function () { show(i - 1); });
    if (next) next.addEventListener('click', function () { show(i + 1); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { show(k); }); });
    doc.addEventListener('keydown', function (e) {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''))) return;
      var r = car.getBoundingClientRect(); if (r.bottom < vh * 0.4 || r.top > vh * 0.6) return;
      if (e.key === 'ArrowLeft') show(i - 1); else if (e.key === 'ArrowRight') show(i + 1);
    });
    var x0 = null;
    car.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 44) show(i + (dx < 0 ? 1 : -1)); }, { passive: true });
    show(+(car.dataset.car || 0));
  });

  /* ── 가입 폼: 약관 전체 동의 · 최대 개수 · 글자 수 ── */
  var all = $('[data-toggle="all"] input'), terms = $$('[data-toggle="term"] input');
  if (all) {
    var syncAll = function () { all.checked = terms.every(function (t) { return t.checked; }); };
    all.addEventListener('change', function () { terms.forEach(function (t) { t.checked = all.checked; }); });
    terms.forEach(function (t) { t.addEventListener('change', syncAll); });
    syncAll();
  }
  // data-max: 정한 개수만큼 고르면 나머지 칸을 잠근다 (하나를 풀면 다시 열린다)
  $$('[data-max]').forEach(function (g) {
    var boxes = $$('input[type="checkbox"]', g), max = +g.dataset.max;
    var lim = function () { var n = boxes.filter(function (b) { return b.checked; }).length; boxes.forEach(function (b) { b.disabled = !b.checked && n >= max; }); };
    g.addEventListener('change', lim); lim();
  });
  // data-len: 입력 칸 옆의 "적은 글자 수 / 최대"
  $$('.inp [data-len]').forEach(function (out) {
    var input = $('input', out.closest('.inp')); if (!input) return;
    var f = function () { out.textContent = input.value.length + ' / ' + input.getAttribute('maxlength'); };
    input.addEventListener('input', f); f();
  });

  /* ── 검색 결과: 항공권과 숙소 고르기, 합계 ──
     항공권은 라디오 한 묶음(name=flight), 숙소는 항공권마다 한 묶음(name=stay-F1 …), 추가 선택은 체크박스다.
     고른 항공권의 숙소 하나만 체크된 상태로 맞추고, 추가 선택은 고른 항공권에서만 켤 수 있다. */
  var dataEl = $('#tp-data');
  if (dataEl) (function () {
    var D = JSON.parse(dataEl.textContent), won = function (n) { return n.toLocaleString('ko-KR') + '원'; };
    var sel = { f: D.sel.f, h: D.sel.h, bag: !!D.sel.bag, meal: false };
    var rows = $$('[data-flight]');
    function sync() {
      rows.forEach(function (c) {
        var fid = c.dataset.flight, on = fid === sel.f, h = D.stays[fid][sel.h];
        c.classList.toggle('on', on);
        var fr = $('input[name="flight"]', c); if (fr) fr.checked = on;
        $$('[data-stay] input', c).forEach(function (r) { r.checked = on && r.value === sel.h; });
        $$('[data-addon]', c).forEach(function (a) {
          var k = a.dataset.addon, box = $('input', a);
          box.disabled = !on; box.checked = on && !!sel[k];
          if (k === 'meal') a.hidden = !(on && h && h.nomeal);     // 조식 추가는 조식이 빠진 숙소를 골랐을 때만
        });
        var line = $('[data-stay-line]', c);
        if (line) line.textContent = on && h ? '고른 숙소 ' + h.t : line.dataset.offer;
      });
    }
    function sum() {
      var f = D.flights[sel.f], h = D.stays[sel.f][sel.h];
      var lines = [['항공권', f.t, f.s, f.p]];
      if (sel.bag) lines.push(['수하물', D.bag.t, D.bag.s, D.bag.p]);
      lines.push(['숙소', h.t, h.s, h.p]);
      if (sel.meal && h.nomeal) lines.push(['조식', D.meal.t, D.meal.s, D.meal.p]);
      var total = lines.reduce(function (a, l) { return a + l[3]; }, 0), left = D.budget - total;
      var gap = left >= 0 ? won(left) + ' 여유' : won(-left) + ' 초과';
      $$('[data-sum="lines"]').forEach(function (el) {
        el.innerHTML = lines.map(function (l, i) { return '<div class="sl' + (i ? '' : ' first') + '"><span class="k">' + l[0] + '</span><div class="grow g2"><span class="t-sm w5">' + l[1] + '</span><span class="t-xs c3">' + l[2] + '</span></div><span class="t-sm num w5 fn">' + won(l[3]) + '</span></div>'; }).join('');
      });
      $$('[data-sum="total"]').forEach(function (el) { el.textContent = won(total); });
      $$('[data-sum="left"]').forEach(function (el) { el.textContent = gap; el.classList.toggle('cok', left >= 0); el.classList.toggle('cbad', left < 0); });
      $$('[data-sum="say"]').forEach(function (el) { el.textContent = '합계 ' + won(total) + ', 예산 대비 ' + gap; });   // 스크린리더에 바뀐 합계를 알린다
    }
    function pickFlight(fid) {
      var row = rows.filter(function (c) { return c.dataset.flight === fid; })[0], d = row && $('details', row);
      if (d) d.open = true;                              // 고른 항공권의 숙소를 펼친다
      if (sel.f === fid) return;
      sel.f = fid; if (!D.stays[fid][sel.h]) sel.h = Object.keys(D.stays[fid])[0]; sel.meal = false;
      sync(); sum();
    }
    function pickStay(fid, hid) {
      if (sel.f === fid && sel.h === hid) return;
      sel.f = fid; sel.h = hid; sel.meal = false; sync(); sum();
    }
    rows.forEach(function (c) {
      var fid = c.dataset.flight, fr = $('input[name="flight"]', c);
      if (fr) { fr.addEventListener('change', function () { if (fr.checked) pickFlight(fid); }); fr.addEventListener('click', function () { pickFlight(fid); }); }
      // 줄의 빈 자리를 눌러도 그 항공권을 고른다 (라디오 이름표를 누른 경우는 위에서 처리)
      $$('[data-pick]', c).forEach(function (p) { p.addEventListener('click', function (e) { if (!e.target.closest('label')) pickFlight(fid); }); });
      $$('[data-stay] input', c).forEach(function (r) {
        var f = function () { if (r.checked) pickStay(fid, r.value); };
        r.addEventListener('change', f); r.addEventListener('click', f);
      });
      $$('[data-addon] input', c).forEach(function (box) {
        box.addEventListener('change', function () { if (sel.f !== fid) return; sel[box.closest('[data-addon]').dataset.addon] = box.checked; sync(); sum(); });
      });
    });
    sync();
  })();

  /* ── 수정 요청 독: 올리면(.up) 입력 상자가 보이고, 비운 채 4초 두면 내려간다 ──
     머리줄(button)을 누르면 올라오고 입력 칸에 커서가 간다. 마우스를 올려도 올라온다. 글자가 있거나 초점이 안에 있으면 내려가지 않는다. */
  $$('[data-dock]').forEach(function (dock) {
    var x = $('.pbox-x', dock), head = $('.dock-h', dock), cnt = $('[data-len]', dock), send = $('[data-n="Submit"]', dock);
    if (!x || !head) return;
    var max = +x.getAttribute('maxlength') || 300, timer = 0, hover = false, pinned = false;
    var has = function () { return x.value.trim().length > 0; };
    var isUp = function () { return dock.classList.contains('up'); };
    function sync() {
      if (cnt) cnt.textContent = x.value.length + ' / ' + max;
      if (send) { send.classList.toggle('pri', has()); flag(send, 'aria-disabled', !has()); }
    }
    function set(up) {
      dock.classList.toggle('up', up); dock.classList.toggle('lift', up); dock.classList.toggle('drop', !up);
      head.setAttribute('aria-expanded', up ? 'true' : 'false'); if (!up) pinned = false;
    }
    function up() { clearTimeout(timer); if (!isUp()) set(true); }
    function down(force) { if (!isUp()) return; if (force !== true && (has() || hover || dock.contains(doc.activeElement))) return; set(false); }
    function arm() { clearTimeout(timer); timer = setTimeout(down, 4000); }
    // 마우스로 가리킬 때만 따라 올라온다 (터치는 누른 것으로만 판단한다)
    dock.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hover = true; up(); } });
    dock.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hover = false; arm(); } });
    dock.addEventListener('focusout', function (e) { if (!dock.contains(e.relatedTarget)) arm(); });
    head.addEventListener('click', function () {
      if (isUp() && pinned && !has()) { hover = false; down(true); }
      else { up(); pinned = true; x.focus(); }
    });
    x.addEventListener('focus', function () { pinned = true; up(); });
    x.addEventListener('input', sync);
    x.addEventListener('keydown', function (e) {
      if (e.isComposing || e.keyCode === 229) return;       // 한글 조합 중의 엔터는 넘기지 않는다
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (has() && send) send.click(); }
      else if (e.key === 'Escape' && !has()) { down(true); head.focus(); }
    });
    $$('[data-eg]', dock).forEach(function (b) { b.addEventListener('click', function () { up(); pinned = true; x.value = b.textContent.slice(0, max); sync(); x.focus(); }); });
    if (send) send.addEventListener('click', function (e) { if (!has()) e.preventDefault(); });
    head.setAttribute('aria-expanded', isUp() ? 'true' : 'false');   // 마크업은 스크립트가 없을 때의 모습(펼침)이라 여기서 실제 상태로 맞춘다
    sync();
  });

  /* ── 검색 중: 장면이 바뀌면 그 문구를 스크린리더에 알린다 (장면은 globe.js 가 body[data-stage] 로 바꾼다) ── */
  var say = $('[data-say]');
  if (say && window.MutationObserver) {
    new MutationObserver(function () { var h = $('.srch-t[data-st="' + body.dataset.stage + '"] .srch-h'); if (h) say.textContent = h.textContent; })
      .observe(body, { attributes: true, attributeFilter: ['data-stage'] });
  }

  /* ── 잠시 뒤 다음 화면으로 (결제 진행 등). 정지 화면 캡처에서는 넘어가지 않는다 ── */
  if (body.dataset.auto && !still) setTimeout(function () { location.href = body.dataset.auto; }, +(body.dataset.autoMs || 4000));
})();
