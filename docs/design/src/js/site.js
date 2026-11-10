/* Trupass 정적 사이트의 움직임과 화면 사이의 연결. 의존하는 라이브러리 없음.
   - 스크롤 구간([data-sec])마다 진행도 --p(0→1)를 넣는다. 화면의 움직임은 CSS 가 --p 로 계산한다.
   - 랜딩에서 적은 문장 세 개는 sessionStorage 에 담아 다음 화면으로 넘긴다.
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
      var g = clamp(p / GROW, 0, 1), q = clamp((p - GROW) / (1 - GROW), 0, 1) * 3;
      var st = Math.min(2, Math.floor(q)), f = q - st, sl = st < 2 ? clamp((f - 0.74) / 0.26, 0, 1) : 0;
      var s1 = st === 0 ? sl : 1, s2 = st === 1 ? sl : st === 2 ? 1 : 0;
      var st2 = s.el.style;
      st2.setProperty('--g', ease(g).toFixed(4)); st2.setProperty('--s1', ease(s1).toFixed(4)); st2.setProperty('--s2', ease(s2).toFixed(4)); st2.setProperty('--bar', (q / 3).toFixed(4));
      var on = String(Math.min(2, st + (sl > 0.5 ? 1 : 0)));
      if (s.el.dataset.on !== on) s.el.dataset.on = on;
      s.el.classList.toggle('live', g > 0.9);
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
  function scrollTo(y) { window.scrollTo({ top: Math.max(0, y), behavior: reduce || still ? 'auto' : 'smooth' }); }
  // 서비스 구간의 i 번째 질문으로 간다. focus 면 도착한 뒤 입력 칸에 커서를 둔다.
  function toStage(i, focus) {
    var s = secs.filter(function (x) { return x.k === 'svc'; })[0]; if (!s) return;
    measure();
    scrollTo(s.top + (GROW + ((i + HOLD) / 3) * (1 - GROW)) * (s.h - vh));
    if (focus) setTimeout(function () { var el = $('[data-stage-ui="' + i + '"] input'); if (el) el.focus({ preventScroll: true }); }, reduce || still ? 0 : 950);
  }
  function go(next) {
    if (!next) return;
    if (next.indexOf('stage:') === 0) toStage(+next.slice(6), true);
    else if (next.indexOf('focus:') === 0) { var f = $('[data-ask="' + next.slice(6) + '"] input'); if (f) f.focus(); }
    else if (next.charAt(0) === '#') { var el = $(next); if (el) scrollTo(el.getBoundingClientRect().top + window.scrollY); }
    else leaveTo(next);
  }

  /* ── 화면을 넘길 때의 구름 장막 ──
     로그인 · 회원 정보 입력 화면으로 갈 때는 구름이 화면을 덮은 뒤 넘어간다. 도착한 화면은 구름이 걷히며 열린다(CSS, body.veil-in). */
  var VEIL = /(?:^|\/)(02-login|02-join|03-signup)\.html(?:[?#].*)?$/;
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
    var s = secs.filter(function (x) { return x.k === k; })[0];
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
    chip.addEventListener('click', function () {
      var input = $('[data-ask="' + chip.dataset.eg + '"] input'); if (!input) return;
      input.value = chip.textContent; store.put(chip.dataset.eg, input.value); input.focus({ preventScroll: true });
    });
  });

  /* ── 좌우로 넘기는 상자 (이용 방법) ── */
  $$('[data-car]').forEach(function (car) {
    var slides = $$('[data-slide]', car), dots = $$('[data-dot]', car), prev = $('[data-car-prev]', car), next = $('[data-car-next]', car), count = $('[data-car-count]', car);
    var n = slides.length, i = 0, pad = function (v) { return (v < 10 ? '0' : '') + v; };
    function show(j) {
      i = clamp(j, 0, n - 1);
      slides.forEach(function (s, k) { s.classList.toggle('on', k === i); s.classList.toggle('was', k < i); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
      if (prev) prev.classList.toggle('off', i === 0);
      if (next) next.classList.toggle('off', i === n - 1);
      if (count) count.textContent = pad(i + 1) + ' / ' + pad(n);
      if (i === n - 1) car.classList.add('done');     // 끝까지 읽었다 → 아래로 스크롤을 권한다
    }
    if (prev) prev.addEventListener('click', function () { show(i - 1); });
    if (next) next.addEventListener('click', function () { show(i + 1); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { show(k); }); });
    doc.addEventListener('keydown', function (e) {
      if (/^(INPUT|TEXTAREA)$/.test((e.target.tagName || '')) || e.target.isContentEditable) return;
      var r = car.getBoundingClientRect(); if (r.bottom < vh * 0.4 || r.top > vh * 0.6) return;
      if (e.key === 'ArrowLeft') show(i - 1); else if (e.key === 'ArrowRight') show(i + 1);
    });
    var x0 = null;
    car.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 44) show(i + (dx < 0 ? 1 : -1)); }, { passive: true });
    show(+(car.dataset.car || 0));
  });

  /* ── 로그인 · 회원가입 전환 ── */
  $$('[data-tabs]').forEach(function (box) {
    function pick(k) {
      box.style.setProperty('--d0', '0s');          // 탭을 바꿀 때는 기다리지 않고 바로 떠오른다
      box.dataset.tabs = k;
      $$('[data-tab]', box).forEach(function (t) { t.classList.toggle('on', t.dataset.tab === k); });
      $$('[data-pane]', box).forEach(function (p) { p.hidden = p.dataset.pane !== k; });
    }
    $$('[data-tab]', box).forEach(function (t) { t.addEventListener('click', function () { pick(t.dataset.tab); }); });
    $$('[data-tab-to]', box).forEach(function (t) { t.addEventListener('click', function () { pick(t.dataset.tabTo); }); });
  });

  /* ── 선택 타일 · 체크박스 (가입 · 약관) ── */
  $$('[data-toggle]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault(); var box = $('.box', el); if (!box) return;
      var on = !box.classList.contains('on'); box.classList.toggle('on', on); el.classList.toggle('on', on);
      if (el.dataset.toggle === 'all') $$('[data-toggle="term"]').forEach(function (t) { $('.box', t).classList.toggle('on', on); });
    });
  });
  $$('[data-radios]').forEach(function (g) {
    $$('.chk', g).forEach(function (r) { r.addEventListener('click', function (e) { e.preventDefault(); $$('.rad', g).forEach(function (x) { x.classList.remove('on'); }); $('.rad', r).classList.add('on'); }); });
  });

  /* ── 검색 결과: 항공권마다 숙소 펼치기, 고르기, 합계 ── */
  var dataEl = $('#tp-data');
  if (dataEl) (function () {
    var D = JSON.parse(dataEl.textContent), won = function (n) { return n.toLocaleString('ko-KR') + '원'; };
    var sel = { f: D.sel.f, h: D.sel.h, bag: !!D.sel.bag, meal: false };
    var cards = $$('[data-flight]');
    function paint() {
      cards.forEach(function (c) {
        var on = c.dataset.flight === sel.f;
        c.classList.toggle('on', on);
        $$('[data-pick] .rad', c).forEach(function (r) { r.classList.toggle('on', on); });
        $$('[data-stay]', c).forEach(function (s) { var so = on && s.dataset.stay === sel.h; s.classList.toggle('on', so); $('.rad', s).classList.toggle('on', so); });
        $$('[data-addon]', c).forEach(function (a) { $('.box', a).classList.toggle('on', on && !!sel[a.dataset.addon]); });
        var mealRow = $('[data-addon="meal"]', c); if (mealRow) mealRow.parentNode.hidden = !(on && D.stays[sel.f][sel.h] && D.stays[sel.f][sel.h].nomeal);
      });
      var f = D.flights[sel.f], h = D.stays[sel.f][sel.h];
      var lines = [['항공권', f.t, f.s, f.p]];
      if (sel.bag) lines.push(['수하물', D.bag.t, D.bag.s, D.bag.p]);
      lines.push(['숙소', h.t, h.s, h.p]);
      if (sel.meal && h.nomeal) lines.push(['조식', D.meal.t, D.meal.s, D.meal.p]);
      var total = lines.reduce(function (a, l) { return a + l[3]; }, 0), left = D.budget - total;
      $$('[data-sum="lines"]').forEach(function (el) {
        el.innerHTML = lines.map(function (l, i) { return '<div class="sl' + (i ? '' : ' first') + '"><span class="k">' + l[0] + '</span><div class="grow g2"><span class="t-sm w5">' + l[1] + '</span><span class="t-xs c3">' + l[2] + '</span></div><span class="t-sm num w5 fn">' + won(l[3]) + '</span></div>'; }).join('');
      });
      $$('[data-sum="total"]').forEach(function (el) { el.textContent = won(total); });
      $$('[data-sum="left"]').forEach(function (el) { el.textContent = left >= 0 ? won(left) + ' 여유' : won(-left) + ' 초과'; el.classList.toggle('cok', left >= 0); el.classList.toggle('cbad', left < 0); });
    }
    cards.forEach(function (c) {
      var fid = c.dataset.flight;
      $$('[data-tg]', c).forEach(function (t) { t.addEventListener('click', function (e) { e.preventDefault(); c.classList.toggle('open'); }); });
      $$('[data-pick]', c).forEach(function (p) {
        p.addEventListener('click', function (e) {
          e.preventDefault();
          if (sel.f !== fid) { sel.f = fid; if (!D.stays[fid][sel.h]) sel.h = Object.keys(D.stays[fid])[0]; sel.meal = false; }
          c.classList.add('open'); paint();
        });
      });
      $$('[data-stay]', c).forEach(function (s) { s.addEventListener('click', function (e) { e.preventDefault(); sel.f = fid; sel.h = s.dataset.stay; sel.meal = false; paint(); }); });
      $$('[data-addon]', c).forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); if (sel.f !== fid) return; sel[a.dataset.addon] = !sel[a.dataset.addon]; paint(); }); });
    });
  })();

  /* ── 수정 요청 독: 올리면(.up) 입력 상자가 보이고, 비운 채 4초 두면 내려간다 ── */
  $$('[data-dock]').forEach(function (dock) {
    var x = $('.pbox-x', dock), head = $('.dock-h', dock), cnt = $('.pbox-a .num', dock), send = $('[data-n="Submit"]', dock);
    if (!x || !head) return;
    var ph = x.classList.contains('ph') ? x.textContent : (dock.dataset.ph || ''), timer = 0, hover = false;
    var has = function () { return !x.classList.contains('ph') && x.textContent.trim().length > 0; };
    var sync = function () { var n = has() ? x.textContent.trim().length : 0; if (cnt) cnt.textContent = n + ' / 300'; if (send) { send.classList.toggle('pri', n > 0); } var b = $('.pbox', dock); if (b) b.classList.toggle('focus', doc.activeElement === x); };
    function up() { clearTimeout(timer); if (dock.classList.contains('up')) return; dock.classList.remove('drop'); dock.classList.add('up', 'lift'); }
    function down() { if (has() || hover || dock.contains(doc.activeElement)) return; dock.classList.remove('up', 'lift'); dock.classList.add('drop'); }
    function arm() { clearTimeout(timer); timer = setTimeout(down, 4000); }
    x.setAttribute('contenteditable', 'true'); x.setAttribute('role', 'textbox'); x.setAttribute('aria-label', '수정 요청');
    dock.addEventListener('mouseenter', function () { hover = true; up(); });
    dock.addEventListener('mouseleave', function () { hover = false; arm(); });
    head.addEventListener('click', function () { if (dock.classList.contains('up') && !has()) { hover = false; x.blur(); down(); } else { up(); x.focus(); } });
    x.addEventListener('focus', function () { up(); if (x.classList.contains('ph')) { x.textContent = ''; x.classList.remove('ph'); } sync(); });
    x.addEventListener('blur', function () { if (!x.textContent.trim()) { x.textContent = ph; x.classList.add('ph'); } sync(); arm(); });
    x.addEventListener('input', sync);
    x.addEventListener('paste', function (e) { e.preventDefault(); var t = (e.clipboardData || window.clipboardData).getData('text'); doc.execCommand('insertText', false, t.replace(/\s+/g, ' ').slice(0, 300)); });
    x.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (has() && send && send.getAttribute('href')) location.href = send.getAttribute('href'); } });
    $$('[data-eg]', dock).forEach(function (a) { a.addEventListener('click', function () { up(); x.classList.remove('ph'); x.textContent = a.textContent; sync(); x.focus(); }); });
    if (send) send.addEventListener('click', function (e) { if (!has()) e.preventDefault(); });
  });

  /* ── 주소가 없는 버튼도 키보드로 누를 수 있게 ── */
  doc.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('a[role="button"]')) { e.preventDefault(); e.target.click(); }
  });

  /* ── 잠시 뒤 다음 화면으로 (결제 진행 등). 정지 화면 캡처에서는 넘어가지 않는다 ── */
  if (body.dataset.auto && !still) setTimeout(function () { location.href = body.dataset.auto; }, +(body.dataset.autoMs || 4000));
})();
