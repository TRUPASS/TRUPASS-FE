// dist/ 를 실제 브라우저로 열어 랜딩부터 결제 완료까지 눌러 본다 (움직임을 켠 채로).
// 마우스 · 키보드 · 터치 · 움직임 줄이기 · 스크립트 끔 다섯 가지 환경을 본다.
// 사용: node src/build.mjs && node tools/flow-test.mjs        실패가 하나라도 있으면 종료 코드 1
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from './render.mjs';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const url = f => pathToFileURL(join(dist, 'screens', f)).href;
const browser = await chromium.launch();
const errs = [];
let failed = 0;
const ok = (name, cond, extra = '') => { if (!cond) failed++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };
const open = async opts => {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  return { ctx, page };
};
const D = { viewport: { width: 1440, height: 900 } };
const svc = page => page.evaluate(() => ({ on: document.querySelector('.lp-svc').dataset.on, focus: document.activeElement && document.activeElement.name }));
const total = page => page.evaluate(() => document.querySelector('.sum [data-sum="total"]').textContent);

/* 1) 랜딩 → 로그인 → 회원 정보 입력 → 검색 중 → 결과 → 수정 요청 */
{
  const { ctx, page } = await open(D);
  await page.goto(url('01-landing.html'));
  await page.waitForTimeout(400);
  ok('랜딩: 오른쪽 위 [검색 시작] 끝에 동그란 화살표가 있다', await page.evaluate(() => { const a = document.querySelector('.lp-top [data-n="Start"] .arr'); return !!a && a.getBoundingClientRect().width >= 24 && a.getAttribute('aria-hidden') === 'true'; }));
  await page.evaluate(() => window.scrollTo(0, window.__tpStop('hero', 0.5)));
  await page.waitForTimeout(900);
  const p = await page.evaluate(() => +document.querySelector('.lp-hero').style.getPropertyValue('--p'));
  ok('하늘: 스크롤 진행도를 따라간다', Math.abs(p - 0.5) < 0.02, 'p=' + p);
  ok('하늘: 진행 50%에서 소개 문장이 보인다', +(await page.evaluate(() => getComputedStyle(document.querySelector('.hero-t')).opacity)) > 0.95);
  await page.evaluate(() => window.scrollTo(0, window.__tpStop('stats', 0.3))); await page.waitForTimeout(700);
  const mid = await page.evaluate(() => [...document.querySelectorAll('.lp-stats [data-count]')].map(e => e.textContent).join(','));
  await page.evaluate(() => window.scrollTo(0, window.__tpStop('stats', 1))); await page.waitForTimeout(900);
  const end = await page.evaluate(() => [...document.querySelectorAll('.lp-stats [data-count]')].map(e => e.textContent).join(','));
  ok('숫자: 스크롤에 맞춰 센다', end === '6,23,9,30' && mid !== end, mid + ' → ' + end);
  await page.evaluate(() => document.querySelector('#how').scrollIntoView()); await page.waitForTimeout(500);
  ok('이용 방법: 첫 장에서는 이전 버튼이 꺼져 있다', await page.evaluate(() => document.querySelector('[data-car-prev]').getAttribute('aria-disabled') === 'true'));
  for (let i = 0; i < 4; i++) { await page.click('[data-car-next]'); await page.waitForTimeout(250); }
  const car = await page.evaluate(() => ({ done: document.querySelector('.lp-how').classList.contains('done'), on: [...document.querySelectorAll('[data-slide]')].findIndex(s => s.classList.contains('on')), next: document.querySelector('[data-car-next]').getAttribute('aria-disabled'), dot: [...document.querySelectorAll('[data-dot]')].findIndex(d => d.getAttribute('aria-current')) }));
  ok('이용 방법: 마지막 장에서 스크롤 권유가 나타난다', car.done && car.on === 4 && car.next === 'true' && car.dot === 4, JSON.stringify(car));
  await page.waitForTimeout(600);
  await page.click('.how-go'); await page.waitForTimeout(1900);
  let st = await svc(page);
  ok('스크롤 권유를 누르면 항공 문장 칸으로 가서 커서를 둔다', st.on === '0' && st.focus === 'flight', JSON.stringify(st));
  await page.keyboard.type('크리스마스 전에 부산에서 오사카, 저녁 출발'); await page.keyboard.press('Enter'); await page.waitForTimeout(2100);
  st = await svc(page);
  ok('엔터: 숙소 문장 칸으로 넘어간다', st.on === '1' && st.focus === 'stay', JSON.stringify(st));
  await page.keyboard.type('난바역 근처 깔끔한 호텔 2박'); await page.keyboard.press('Enter'); await page.waitForTimeout(2100);
  st = await svc(page);
  ok('엔터: 체험 문장 칸으로 넘어간다', st.on === '2' && st.focus === 'exp', JSON.stringify(st));
  await page.keyboard.type('먹거리 위주, 유니버설 하루');
  await Promise.all([page.waitForNavigation(), page.keyboard.press('Enter')]);
  ok('세 번째 엔터: 로그인으로 넘어간다', /02-login\.html/.test(page.url()));
  await page.waitForTimeout(300);
  const rc = await page.evaluate(() => [...document.querySelectorAll('.rc [data-prompt]')].map(e => e.textContent));
  ok('로그인: 적은 문장 세 개가 그대로 보인다', rc[0].includes('부산에서 오사카') && rc[2].includes('유니버설'), JSON.stringify(rc));
  ok('로그인: 버튼은 Google 계정으로 계속하기 하나다', (await page.evaluate(() => document.querySelectorAll('.auth-card a, .auth-card button').length)) === 1);
  await Promise.all([page.waitForNavigation(), page.click('.gbtn')]);
  ok('Google 계정으로 계속하기 → 회원 정보 입력', /03-signup/.test(page.url()));
  await page.waitForTimeout(1400);
  await page.click('[data-toggle="all"]'); await page.waitForTimeout(100);
  ok('약관 전체 동의가 모두 체크한다', await page.evaluate(() => [...document.querySelectorAll('[data-toggle="term"] input')].every(b => b.checked)));
  const term = i => page.locator('[data-toggle="term"]').nth(i);
  await term(2).click(); await page.waitForTimeout(80);
  ok('약관 하나를 풀면 전체 동의도 풀린다', await page.evaluate(() => !document.querySelector('[data-toggle="all"] input').checked));
  await term(0).click(); await page.waitForTimeout(80);
  await page.click('[data-n="Submit"]'); await page.waitForTimeout(300);
  ok('필수 약관을 풀면 가입이 넘어가지 않는다', /03-signup/.test(page.url()) && await page.evaluate(() => document.querySelectorAll('[data-toggle="term"] input:invalid').length === 1));
  await term(0).click(); await page.waitForTimeout(80);
  await page.click('.tiles .opt:nth-child(1)'); await page.waitForTimeout(80);
  const tiles = await page.evaluate(() => { const b = [...document.querySelectorAll('.tiles input')]; return { on: b.filter(x => x.checked).length, locked: b.filter(x => x.disabled).length }; });
  ok('관심사: 세 개를 고르면 나머지는 잠긴다', tiles.on === 3 && tiles.locked === 5, JSON.stringify(tiles));
  await page.fill('#su-nick', '여행자'); await page.waitForTimeout(60);
  ok('닉네임: 글자 수를 센다', (await page.evaluate(() => document.querySelector('.inp [data-len]').textContent)) === '3 / 12');
  await Promise.all([page.waitForNavigation(), page.click('[data-n="Submit"]')]);
  ok('가입 → 검색 중', /06-searching\.html/.test(page.url()));
  const stages = [], t0 = Date.now();
  for (let i = 0; i < 44 && /06-searching/.test(page.url()); i++) {
    const s = await page.evaluate(() => document.body.dataset.stage).catch(() => 'nav');
    if (stages[stages.length - 1] !== s) stages.push(s);
    await page.waitForTimeout(500);
  }
  await page.waitForURL(/07-result/, { timeout: 8000 }).catch(() => {});
  ok('검색 중: 항공 → 숙소 → 완료 뒤 결과로 넘어간다', /07-result/.test(page.url()) && stages.join('>').startsWith('flight>stay'), stages.join('>') + ' · ' + ((Date.now() - t0) / 1000).toFixed(1) + '초');
  await page.waitForTimeout(1600);
  ok('결과: 처음에는 항공권 세 줄이 모두 접혀 있다', await page.evaluate(() => [...document.querySelectorAll('details.fo-s')].every(d => !d.open)));
  await page.click('[data-flight="F2"] [data-tg]'); await page.waitForTimeout(1300);
  ok('결과: [보기]가 두 번째 항공권의 숙소를 펼친다', await page.evaluate(() => document.querySelector('[data-flight="F2"] details').open && document.querySelector('[data-flight="F2"] [data-stay]').getBoundingClientRect().height > 40));
  ok('결과: 고르지 않은 항공권의 추가 선택은 잠겨 있다', await page.evaluate(() => document.querySelector('[data-flight="F2"] [data-addon="bag"] input').disabled));
  await page.click('[data-flight="F2"] [data-stay="H5"]'); await page.waitForTimeout(200);
  const r1 = await page.evaluate(() => ({ total: document.querySelector('.sum [data-sum="total"]').textContent, f2: document.querySelector('[data-flight="F2"]').classList.contains('on'), f1: document.querySelector('[data-flight="F1"]').classList.contains('on'), radio: document.querySelector('input[name="flight"]:checked').value, line: document.querySelector('[data-flight="F2"] [data-stay-line]').textContent, other: document.querySelector('[data-flight="F1"] [data-stay-line]').textContent, say: document.querySelector('[data-sum="say"]').textContent }));
  ok('결과: 숙소를 고르면 그 항공권이 선택되고 합계가 바뀐다', r1.total === '843,800원' && r1.f2 && !r1.f1 && r1.radio === 'F2' && r1.line === '고른 숙소 호텔 시노바즈 우에노' && /^추천 숙소 3곳/.test(r1.other) && /843,800원/.test(r1.say), JSON.stringify(r1));
  await page.click('[data-flight="F2"] [data-addon="bag"] .chk'); await page.waitForTimeout(150);
  ok('결과: 수하물 추가가 합계에 더해진다', (await total(page)) === '887,800원');
  await page.click('[data-flight="F3"] .fo-p'); await page.waitForTimeout(300);
  const r2 = await page.evaluate(() => ({ total: document.querySelector('.sum [data-sum="total"]').textContent, radio: document.querySelector('input[name="flight"]:checked').value, open: document.querySelector('[data-flight="F3"] details').open, stay: (document.querySelector('[data-flight="F3"] [data-stay] input:checked') || {}).value, stale: document.querySelectorAll('[data-flight="F2"] [data-stay] input:checked').length }));
  ok('결과: 줄을 누르면 그 항공권을 고르고 같은 숙소를 이어 간다', r2.total === '1,207,800원' && r2.radio === 'F3' && r2.open && r2.stay === 'H5' && r2.stale === 0, JSON.stringify(r2));
  await page.hover('[data-dock] .dock-h'); await page.waitForTimeout(400);
  ok('독: 마우스를 올리면 올라온다', await page.evaluate(() => document.querySelector('[data-dock]').classList.contains('up') && document.querySelector('.dock-h').getAttribute('aria-expanded') === 'true'));
  ok('독: 비어 있으면 [다시 검색]이 꺼져 있다', await page.evaluate(() => document.querySelector('[data-dock] [data-n="Submit"]').getAttribute('aria-disabled') === 'true'));
  const ask = '숙소를 우에노역에서 더 가까운 곳으로';
  await page.click('[data-dock] .pbox-x'); await page.keyboard.type(ask); await page.waitForTimeout(150);
  ok('독: 적은 글자 수를 센다', (await page.evaluate(() => document.querySelector('[data-dock] [data-len]').textContent)) === `${ask.length} / 300`);
  await Promise.all([page.waitForNavigation(), page.keyboard.press('Enter')]);
  ok('독: 엔터로 다시 검색한 결과(v2)로 간다', /08-result-v2/.test(page.url()));
  await page.waitForTimeout(600);
  ok('다시 검색한 결과: 고른 항공권의 숙소가 펼쳐져 있다', await page.evaluate(() => document.querySelector('[data-flight="F1"] details').open && !document.querySelector('[data-flight="F2"] details').open));
  await ctx.close();
}

/* 2) 움직임 줄이기: 검색 중 화면이 장면만 바꾸고 결과로 넘어간다 */
{
  const { ctx, page } = await open({ ...D, reducedMotion: 'reduce' });
  await page.goto(url('06-searching.html'));
  await page.waitForTimeout(1200);
  const s1 = await page.evaluate(() => document.body.dataset.stage);
  await page.waitForTimeout(2200);
  const s2 = await page.evaluate(() => document.body.dataset.stage).catch(() => 'nav');
  await page.waitForURL(/07-result/, { timeout: 6000 }).catch(() => {});
  ok('움직임 줄이기: 장면만 바꾸고 결과에 닿는다', s1 === 'flight' && s2 === 'stay' && /07-result/.test(page.url()), s1 + '>' + s2);
  ok('움직임 줄이기: 항공권 줄이 바로 보인다', (await page.evaluate(() => [...document.querySelectorAll('.fo')].map(e => getComputedStyle(e).opacity).join(','))) === '1,1,1');
  await page.goto(url('01-landing.html')); await page.waitForTimeout(300);
  ok('움직임 줄이기: 흐르는 글자 멈춤 단추를 치운다', await page.evaluate(() => document.querySelector('[data-mq]').hidden));
  await ctx.close();
}

/* 3) 문장 없이 로그인 · 키보드만으로 */
{
  const { ctx, page } = await open(D);
  await page.goto(url('01-landing.html'));
  await page.waitForTimeout(300);
  await Promise.all([page.waitForNavigation(), page.click('.lp-top [data-n="Login"]')]);
  ok('문장 없이 로그인: 예시 조건이라고 알린다', /예시/.test(await page.evaluate(() => document.querySelector('.rc-k').textContent)));
  await page.goto(url('01-landing.html'));
  await page.waitForTimeout(300);
  await page.focus('.lp-top [data-n="Start"]'); await page.keyboard.press('Enter'); await page.waitForTimeout(2600);
  const st = await svc(page);
  ok('키보드: [검색 시작]에서 엔터 → 항공 문장 칸', st.on === '0' && st.focus === 'flight', JSON.stringify(st));
  await page.keyboard.type('삿포로 1월 말'); await page.keyboard.press('Enter'); await page.waitForTimeout(2000);
  await page.keyboard.press('Enter'); await page.waitForTimeout(2000);
  await Promise.all([page.waitForNavigation(), page.keyboard.press('Enter')]);
  const rc = await page.evaluate(() => [...document.querySelectorAll('.rc [data-prompt]')].map(e => e.textContent));
  ok('일부만 적으면 나머지는 "적지 않았습니다"로 보인다', rc[0] === '삿포로 1월 말' && rc[1] === '적지 않았습니다' && rc[2] === '적지 않았습니다', JSON.stringify(rc));
  // Tab 으로 내려가다 문장 칸에 닿으면(아직 창이 커지기 전) 그 질문 자리로 스크롤해 보여 준다
  await page.goto(url('01-landing.html')); await page.waitForTimeout(300);
  await page.evaluate(() => sessionStorage.clear());
  await page.focus('[data-mq]'); await page.keyboard.press('Tab'); await page.waitForTimeout(1900);
  const tab = await page.evaluate(() => { const s = document.querySelector('.lp-svc'), el = document.activeElement, r = el.getBoundingClientRect(); return { name: el.name, live: s.classList.contains('live'), on: s.dataset.on, ui: +getComputedStyle(document.querySelector('.svc-ui')).opacity, inView: r.top > 0 && r.bottom < innerHeight }; });
  ok('키보드: Tab 으로 문장 칸에 닿으면 그 자리가 화면에 나타난다', tab.name === 'flight' && tab.live && tab.on === '0' && tab.ui > 0.95 && tab.inView, JSON.stringify(tab));
  await page.evaluate(() => window.scrollTo(0, window.__tpStop('svc', 0))); await page.waitForTimeout(700);
  await page.click('[data-mq]'); await page.waitForTimeout(80);
  const mq = await page.evaluate(() => ({ paused: document.querySelector('.lp-svc').classList.contains('mq-paused'), pressed: document.querySelector('[data-mq]').getAttribute('aria-pressed'), state: getComputedStyle(document.querySelector('.mq-t')).animationPlayState }));
  ok('흐르는 글자: 단추로 멈춘다', mq.paused && mq.pressed === 'true' && mq.state === 'paused', JSON.stringify(mq));
  // 독: 키보드로 열고 닫는다
  await page.goto(url('07-result.html')); await page.waitForTimeout(1500);
  await page.focus('.dock-h'); await page.keyboard.press('Enter'); await page.waitForTimeout(350);
  const k1 = await page.evaluate(() => ({ up: document.querySelector('[data-dock]').classList.contains('up'), focus: document.activeElement.className }));
  ok('독: 머리줄에서 엔터를 누르면 올라오고 입력 칸에 커서가 간다', k1.up && /pbox-x/.test(k1.focus), JSON.stringify(k1));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  const k2 = await page.evaluate(() => ({ up: document.querySelector('[data-dock]').classList.contains('up'), focus: document.activeElement.className, exp: document.querySelector('.dock-h').getAttribute('aria-expanded') }));
  ok('독: 빈 채로 Esc 를 누르면 내려가고 초점이 머리줄로 돌아온다', !k2.up && /dock-h/.test(k2.focus) && k2.exp === 'false', JSON.stringify(k2));
  // 결과: 키보드로 항공권과 숙소를 고른다
  await page.focus('input[name="flight"]:checked'); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(200);
  const k3 = await page.evaluate(() => ({ radio: document.querySelector('input[name="flight"]:checked').value, total: document.querySelector('.sum [data-sum="total"]').textContent, open: document.querySelector('[data-flight="F2"] details').open }));
  ok('결과: 방향키로 항공권을 바꾸면 합계가 따라 바뀐다', k3.radio === 'F2' && k3.total === '736,400원' && k3.open, JSON.stringify(k3));
  await ctx.close();
}

/* 4) 모바일 폭 · 터치 */
{
  const { ctx, page } = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await page.goto(url('01-landing.html'));
  await page.waitForTimeout(300);
  await page.tap('.lp-top [data-n="Start"]'); await page.waitForTimeout(2600);
  await page.keyboard.type('오사카 주말 2박'); await page.keyboard.press('Enter'); await page.waitForTimeout(2200);
  ok('모바일: 엔터로 숙소 문장 칸으로 넘어간다', (await page.evaluate(() => document.querySelector('.lp-svc').dataset.on)) === '1');
  await page.goto(url('07-result.html'));
  await page.waitForTimeout(1500);
  await page.tap('[data-flight="F3"] [data-tg]'); await page.waitForTimeout(1300);
  await page.tap('[data-flight="F3"] [data-stay="H6"]'); await page.waitForTimeout(200);
  ok('모바일: 숙소를 고르면 아래 합계 바가 바뀐다', (await page.evaluate(() => document.querySelector('.cta-bar [data-sum="total"]').textContent)) === '1,010,400원');
  ok('모바일: 가로 넘침이 없다', (await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0);
  await page.tap('.dock-h'); await page.waitForTimeout(500);
  ok('모바일: 독 머리줄을 누르면 올라온 채로 있다', await page.evaluate(() => document.querySelector('[data-dock]').classList.contains('up')));
  await ctx.close();
}

/* 5) 장소 → 결제 권한 → 결제 확인 → 진행 → 완료 → 새 검색 */
{
  const { ctx, page } = await open(D);
  await page.goto(url('09-places.html'));
  await page.waitForTimeout(300);
  await Promise.all([page.waitForNavigation(), page.click('.sum [data-n="Next"]')]);
  ok('장소 → 결제 권한 등록', /10-mandate/.test(page.url()));
  await Promise.all([page.waitForNavigation(), page.click('[data-n="Sign"]')]);
  ok('결제 권한 등록 → 결제 확인', /11-checkout/.test(page.url()));
  await Promise.all([page.waitForNavigation(), page.click('[data-n="Approve"]')]);
  ok('결제 확인 → 결제 진행', /12-processing/.test(page.url()));
  await page.waitForURL(/13-complete/, { timeout: 9000 }).catch(() => {});
  ok('결제 진행 → 결제 완료 (자동)', /13-complete/.test(page.url()));
  await Promise.all([page.waitForNavigation(), page.click('[data-n="Trips"]')]);
  const tr = await page.evaluate(() => ({ cur: (document.querySelector('.hdr .nav a[aria-current="page"]') || {}).textContent, days: document.querySelectorAll('.tl-d').length, docs: document.querySelectorAll('#docs .doc').length }));
  ok('결제 완료 → 내 여행 (날짜별 일정과 문서함)', /14-trips/.test(page.url()) && tr.cur === '내 여행' && tr.days === 3 && tr.docs === 3, JSON.stringify(tr));
  await Promise.all([page.waitForNavigation(), page.click('.tl [data-n="Places"]')]);
  ok('내 여행: 자유 일정에서 추천 장소로 간다', /09-places/.test(page.url()));
  await Promise.all([page.waitForNavigation(), page.click('.hdr .nav a[href="14-trips.html"]')]);
  ok('상단 메뉴의 [내 여행]을 누르면 내 여행으로 간다', /14-trips/.test(page.url()));
  await Promise.all([page.waitForNavigation(), page.click('[data-n="NewSearch"]')]);
  ok('내 여행 → 새 검색', /05-home/.test(page.url()));
  await page.focus('[data-ask="flight"] input'); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  ok('새 검색: 엔터로 다음 문장 칸에 커서가 간다', (await page.evaluate(() => document.activeElement && document.activeElement.name)) === 'stay');
  await ctx.close();
}

/* 6) 스크립트를 끈 브라우저: 연출 없이 같은 내용이 그대로 보이고, 링크와 폼으로 다음 화면에 갈 수 있다 */
{
  const { ctx, page } = await open({ ...D, javaScriptEnabled: false });
  await page.goto(url('01-landing.html'));
  await page.waitForTimeout(300);
  const seen = sel => page.$$eval(sel, els => els.filter(el => { let o = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden') return false; o *= parseFloat(c.opacity); } const r = el.getBoundingClientRect(); return o > 0.95 && r.width > 0 && r.height > 0; }).length);
  const n = { h1: await seen('.hero-h'), asks: await seen('.svc-pane input'), slides: await seen('.how-sl'), nums: await page.$$eval('.lp-stats [data-count]', e => e.map(x => x.textContent).join(',')), dead: await seen('.how-car .btn.rb, .how-dots button, .how-go, .mq-x') };
  ok('스크립트 끔: 제목 · 문장 칸 3개 · 이용 방법 5걸음 · 숫자가 모두 보인다', n.h1 === 1 && n.asks === 3 && n.slides === 5 && n.nums === '6,23,9,30', JSON.stringify(n));
  ok('스크립트 끔: 스크립트가 있어야 움직이는 단추는 보이지 않는다', n.dead === 0, 'dead=' + n.dead);
  await page.fill('[data-ask="flight"] input', '도쿄 12월');
  await Promise.all([page.waitForNavigation(), page.press('[data-ask="flight"] input', 'Enter')]);
  ok('스크립트 끔: 문장 칸에서 엔터 → 로그인', /02-login\.html\?flight=/.test(page.url()));
  await page.goto(url('07-result.html')); await page.waitForTimeout(200);
  await page.click('[data-flight="F2"] [data-tg]'); await page.waitForTimeout(1700);   // 숙소 세 곳이 차례로 떠오를 때까지
  const r = { open: await page.$eval('[data-flight="F2"] details', d => d.open), stays: await seen('[data-flight="F2"] [data-stay]'), dock: await seen('.dock .pbox-x') };
  ok('스크립트 끔: 숙소가 펼쳐지고 수정 요청 칸이 열려 있다', r.open && r.stays === 3 && r.dock === 1, JSON.stringify(r));
  await ctx.close();
}

console.log(errs.length ? errs.join('\n') : '페이지 오류 없음');
await browser.close();
if (failed || errs.length) { console.log(`실패 ${failed}건`); process.exit(1); }
console.log('모두 통과');
