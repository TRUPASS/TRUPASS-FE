// 앱을 빌드해 실제 브라우저로 열고 랜딩부터 Google 로그인 · 회원 정보 입력 · 결제 완료 · 내 여행까지 눌러 본다 (움직임을 켠 채로).
// 마우스 · 키보드 · 터치 · 움직임 줄이기 네 가지 환경을 본다. 실패가 하나라도 있으면 종료 코드 1.
//
//   pnpm test:flow                              # 흐름 검사용으로 빌드(dist-flow)한 뒤 미리보기 서버를 띄워 검사한다
//   node scripts/flow-test.mjs --base=<주소>     # 이미 떠 있는 서버를 검사한다 (아래 FLOW_ENV 와 같은 설정으로 띄운 것)
//
// Google 로그인은 진짜 Google 과 백엔드 대신 이 스크립트가 브라우저 안에서 응답한다 (scripts/flow/).
// 브라우저가 없으면 먼저 `pnpm exec playwright install chromium` 을 한 번 실행한다.
import { chromium } from 'playwright';
import * as vite from 'vite';
import { createFakeBackend } from './flow/fake-backend.mjs';
import { FAKE_GSI } from './flow/fake-google.mjs';

const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3);

// 흐름 검사용 빌드 설정: Google 로그인을 켜고, 백엔드 주소는 가짜 백엔드가 가로챌 곳으로 둔다.
// 이미 있는 환경 변수가 .env 파일보다 먼저이므로, 개발자의 .env.local 과 상관없이 같은 빌드가 나온다.
const FLOW_ENV = {
  VITE_USE_MOCK: 'false',
  VITE_API_BASE_URL: 'http://localhost:8080',
  VITE_GOOGLE_CLIENT_ID: 'flow-test.apps.googleusercontent.com',
};
const OUT_DIR = 'dist-flow';

// 빌드하고 미리보기 서버로 띄워 주소를 돌려준다
async function startPreview(port = 4319) {
  Object.assign(process.env, FLOW_ENV);
  await vite.build({ logLevel: 'error', build: { outDir: OUT_DIR, emptyOutDir: true } });
  try {
    const preview = await vite.preview({
      logLevel: 'error',
      build: { outDir: OUT_DIR },
      preview: { port, strictPort: true, host: '127.0.0.1' },
    });
    return { base: `http://127.0.0.1:${port}`, stop: () => preview.close() };
  } catch (error) {
    throw new Error(`미리보기 서버가 ${port} 포트에 뜨지 않았다.`, { cause: error });
  }
}

const server = arg('base') ? { base: arg('base'), stop() {} } : await startPreview();
const backend = createFakeBackend();
const url = (path) => server.base + path;
const browser = await chromium.launch();
const errs = [];
let failed = 0;
const ok = (name, cond, extra = '') => {
  if (!cond) failed++;
  console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : ''));
};
const open = async (opts) => {
  const ctx = await browser.newContext(opts);
  // Google 로그인 스크립트와 백엔드 대신 응답한다 (컨텍스트마다 저장소는 따로, 가짜 백엔드의 가입 기록은 함께 쓴다)
  await ctx.route('https://accounts.google.com/gsi/client', (route) =>
    route.fulfill({ status: 200, contentType: 'text/javascript', body: FAKE_GSI }),
  );
  await ctx.route(`${FLOW_ENV.VITE_API_BASE_URL}/**`, (route) => backend.handle(route));
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  return { ctx, page };
};
const D = { viewport: { width: 1440, height: 900 } };
const at = (page, path) => new URL(page.url()).pathname + new URL(page.url()).search === path;
// 화면을 넘긴다. 주소가 바뀐 뒤 새 화면이 그려지기까지 한 박자가 있으므로, 도착한 화면의 요소(ready)를 주면 그것까지 기다린다
const go = async (page, pattern, action, ready) => {
  await Promise.all([page.waitForURL(pattern, { timeout: 8000 }), action()]).catch(() => {});
  if (ready) await page.waitForSelector(ready, { timeout: 4000 }).catch(() => {});
};

// 랜딩의 스크롤 구간([data-sec]) 안의 한 자리(0–1)로 간다
const toStop = (page, k, f) =>
  page.evaluate(
    ([k, f]) => {
      const el = document.querySelector(`[data-sec="${k}"]`);
      const r = el.getBoundingClientRect();
      window.scrollTo(0, r.top + window.scrollY + f * Math.max(0, r.height - window.innerHeight));
    },
    [k, f],
  );
const svc = (page) =>
  page.evaluate(() => ({
    on: document.querySelector('.lp-svc').dataset.on,
    focus: document.activeElement && document.activeElement.name,
  }));
// 결과 화면: 항공권 한 줄, 그 줄의 숙소 · 추가 선택
const ROW = (id) => `.fo:has(input[name="flight"][value="${id}"])`;
const STAY = (fid, hid) => `${ROW(fid)} label.sc:has(input[value="${hid}"])`;
const total = (page) => page.evaluate(() => document.querySelector('.sum .t-h1.num').textContent);

/* 1) 랜딩 → 로그인 → 회원 정보 입력 → 검색 중 → 결과 → 수정 요청 */
{
  const { ctx, page } = await open(D);
  await page.goto(url('/'));
  await page.waitForTimeout(600);
  ok(
    '랜딩: 오른쪽 위 [검색 시작] 끝에 동그란 화살표가 있다',
    await page.evaluate(() => {
      const a = document.querySelector('.lp-top a.cta .arr');
      return (
        !!a && a.getBoundingClientRect().width >= 24 && a.getAttribute('aria-hidden') === 'true'
      );
    }),
  );
  await toStop(page, 'hero', 0.5);
  await page.waitForTimeout(900);
  const p = await page.evaluate(
    () => +document.querySelector('.lp-hero').style.getPropertyValue('--p'),
  );
  ok('하늘: 스크롤 진행도를 따라간다', Math.abs(p - 0.5) < 0.02, 'p=' + p);
  ok(
    '하늘: 진행 50%에서 소개 문장이 보인다',
    +(await page.evaluate(() => getComputedStyle(document.querySelector('.hero-t')).opacity)) >
      0.95,
  );
  const counts = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.lp-stats [data-count]')].map((e) => e.textContent).join(','),
    );
  await toStop(page, 'stats', 0.3);
  await page.waitForTimeout(700);
  const mid = await counts();
  await toStop(page, 'stats', 1);
  await page.waitForTimeout(900);
  const end = await counts();
  ok('숫자: 스크롤에 맞춰 센다', end === '6,23,9,30' && mid !== end, mid + ' → ' + end);
  await page.evaluate(() => document.querySelector('#how').scrollIntoView());
  await page.waitForTimeout(500);
  const PREV = '.how-car .btn[aria-label="이전 걸음"]';
  const NEXT = '.how-car .btn[aria-label="다음 걸음"]';
  ok(
    '이용 방법: 첫 장에서는 이전 버튼이 꺼져 있다',
    (await page.getAttribute(PREV, 'aria-disabled')) === 'true',
  );
  for (let i = 0; i < 4; i++) {
    await page.click(NEXT);
    await page.waitForTimeout(250);
  }
  const car = await page.evaluate(() => ({
    done: document.querySelector('.lp-how').classList.contains('done'),
    on: [...document.querySelectorAll('.how-sl')].findIndex((s) => s.classList.contains('on')),
    next: document
      .querySelector('.how-car .btn[aria-label="다음 걸음"]')
      .getAttribute('aria-disabled'),
    dot: [...document.querySelectorAll('.how-dots button')].findIndex((d) =>
      d.getAttribute('aria-current'),
    ),
  }));
  ok(
    '이용 방법: 마지막 장에서 스크롤 권유가 나타난다',
    car.done && car.on === 4 && car.next === 'true' && car.dot === 4,
    JSON.stringify(car),
  );
  await page.waitForTimeout(600);
  await page.click('.how-go');
  await page.waitForTimeout(1900);
  let st = await svc(page);
  ok(
    '스크롤 권유를 누르면 항공 문장 칸으로 가서 커서를 둔다',
    st.on === '0' && st.focus === 'flight',
    JSON.stringify(st),
  );
  await page.keyboard.type('크리스마스 전에 부산에서 오사카, 저녁 출발');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2100);
  st = await svc(page);
  ok('엔터: 숙소 문장 칸으로 넘어간다', st.on === '1' && st.focus === 'stay', JSON.stringify(st));
  await page.keyboard.type('난바역 근처 깔끔한 호텔 2박');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2100);
  st = await svc(page);
  ok('엔터: 체험 문장 칸으로 넘어간다', st.on === '2' && st.focus === 'exp', JSON.stringify(st));
  await page.keyboard.type('먹거리 위주, 유니버설 하루');
  const veil = page
    .waitForFunction(() => document.documentElement.classList.contains('leaving'), null, {
      timeout: 2000,
    })
    .then(
      () => true,
      () => false,
    );
  await go(page, '**/login', () => page.keyboard.press('Enter'), '.rc');
  ok('세 번째 엔터: 구름 장막이 덮인 뒤 로그인으로 넘어간다', at(page, '/login') && (await veil));
  await page.waitForTimeout(300);
  ok(
    '로그인: 장막이 걷힌다',
    await page.evaluate(
      () =>
        !document.documentElement.classList.contains('leaving') &&
        document.body.classList.contains('veil-in'),
    ),
  );
  const said = await page.evaluate(() => ({
    title: document.title,
    status: document.querySelector('#root > p[role="status"]').textContent,
  }));
  ok(
    '화면이 바뀌면 새 화면의 이름을 스크린리더에 알린다',
    said.title === '로그인 | Trupass' && said.status === said.title,
    JSON.stringify(said),
  );
  const rc = await page.evaluate(() =>
    [...document.querySelectorAll('.rc .v')].map((e) => e.textContent),
  );
  ok(
    '로그인: 적은 문장 세 개가 그대로 보인다',
    rc[0].includes('부산에서 오사카') && rc[2].includes('유니버설'),
    JSON.stringify(rc),
  );
  await page.waitForSelector('.auth-gsi .fake-gsi', { timeout: 4000 }).catch(() => {});
  const gsi = await page.evaluate(() => ({
    slots: document.querySelectorAll('.auth-card .auth-gsi').length,
    buttons: document.querySelectorAll('.auth-card a, .auth-card button').length,
    init: window.__gsi && window.__gsi.initialize,
    look: window.__gsi && window.__gsi.renderButton.at(-1),
  }));
  ok(
    '로그인: Google 의 로그인 버튼 하나만 그린다 (계속하기 · 둥근 모양 · 한국어)',
    gsi.slots === 1 &&
      gsi.buttons === 1 &&
      gsi.init.length === 1 &&
      gsi.init[0].client_id === FLOW_ENV.VITE_GOOGLE_CLIENT_ID &&
      gsi.look.text === 'continue_with' &&
      gsi.look.shape === 'pill' &&
      gsi.look.locale === 'ko',
    JSON.stringify(gsi),
  );
  await go(page, '**/signup', () => page.click('.auth-gsi .fake-gsi'), '.su-form');
  ok(
    'Google 계정으로 계속하기 → 처음 온 계정이라 백엔드가 가입시키고 회원 정보 입력으로 간다',
    at(page, '/signup') && backend.calls.includes('POST /auth/google'),
    backend.calls.join(', '),
  );
  const filled = await page.evaluate(() => ({
    mail: document.querySelector('#su-mail').value,
    nick: document.querySelector('#su-nick').value,
    header: document.querySelector('.hdr').textContent,
  }));
  ok(
    '회원 정보 입력: 로그인한 Google 계정의 이메일과 이름으로 채운다',
    filled.mail === 'traveler@example.com' &&
      filled.nick === '여행자' &&
      filled.header.includes('traveler@example.com'),
    JSON.stringify(filled),
  );
  await page.waitForTimeout(1400);
  const ALL = '.su-form .pnl-b.g10 > .chk';
  const term = (i) => page.locator('.su-form .term .chk').nth(i);
  await page.click(ALL);
  await page.waitForTimeout(100);
  ok(
    '약관 전체 동의가 모두 체크한다',
    await page.evaluate(() =>
      [...document.querySelectorAll('.su-form .term input')].every((b) => b.checked),
    ),
  );
  await term(2).click();
  await page.waitForTimeout(80);
  ok(
    '약관 하나를 풀면 전체 동의도 풀린다',
    await page.evaluate(() => !document.querySelector('.su-form .pnl-b.g10 > .chk input').checked),
  );
  await term(0).click();
  await page.waitForTimeout(80);
  await page.click('.su-form button[type="submit"]');
  await page.waitForTimeout(300);
  ok(
    '필수 약관을 풀면 가입이 넘어가지 않는다',
    at(page, '/signup') &&
      (await page.evaluate(
        () => document.querySelectorAll('.su-form .term input:invalid').length === 1,
      )),
  );
  await term(0).click();
  await page.waitForTimeout(80);
  await page.click('.tiles .opt:nth-child(1)');
  await page.waitForTimeout(80);
  const tiles = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.tiles input')];
    return { on: b.filter((x) => x.checked).length, locked: b.filter((x) => x.disabled).length };
  });
  ok(
    '관심사: 세 개를 고르면 나머지는 잠긴다',
    tiles.on === 3 && tiles.locked === 5,
    JSON.stringify(tiles),
  );
  await page.fill('#su-nick', '여행자');
  await page.waitForTimeout(60);
  ok(
    '닉네임: 글자 수를 센다',
    (await page.evaluate(() => document.querySelector('.inp:has(#su-nick) .num').textContent)) ===
      '3 / 12',
  );
  await go(page, '**/search/progress', () => page.click('.su-form button[type="submit"]'));
  ok('가입 → 검색 중', at(page, '/search/progress'));
  const stages = [];
  const t0 = Date.now();
  for (let i = 0; i < 44 && at(page, '/search/progress'); i++) {
    const s = await page.evaluate(() => document.body.dataset.stage).catch(() => 'nav');
    if (s && stages[stages.length - 1] !== s) stages.push(s);
    await page.waitForTimeout(500);
  }
  await page.waitForURL('**/results', { timeout: 8000 }).catch(() => {});
  await page.waitForSelector('.fo', { timeout: 4000 }).catch(() => {});
  ok(
    '검색 중: 항공 → 숙소 → 완료 뒤 결과로 넘어간다',
    at(page, '/results') && stages.join('>').startsWith('flight>stay'),
    stages.join('>') + ' · ' + ((Date.now() - t0) / 1000).toFixed(1) + '초',
  );
  await page.waitForTimeout(1600);
  ok(
    '결과: 처음에는 항공권 세 줄이 모두 접혀 있다',
    await page.evaluate(() => [...document.querySelectorAll('details.fo-s')].every((d) => !d.open)),
  );
  await page.click(`${ROW('F2')} summary.fo-tg`);
  await page.waitForTimeout(1300);
  ok(
    '결과: [보기]가 두 번째 항공권의 숙소를 펼친다',
    await page.evaluate(
      (r) =>
        document.querySelector(`${r} details`).open &&
        document.querySelector(`${r} label.sc`).getBoundingClientRect().height > 40,
      ROW('F2'),
    ),
  );
  ok(
    '결과: 고르지 않은 항공권의 추가 선택은 잠겨 있다',
    await page.evaluate((r) => document.querySelector(`${r} .ax-r input`).disabled, ROW('F2')),
  );
  await page.click(STAY('F2', 'H5'));
  await page.waitForTimeout(200);
  const r1 = await page.evaluate(
    ([f1, f2]) => ({
      total: document.querySelector('.sum .t-h1.num').textContent,
      f2: document.querySelector(f2).classList.contains('on'),
      f1: document.querySelector(f1).classList.contains('on'),
      radio: document.querySelector('input[name="flight"]:checked').value,
      line: document.querySelector(`${f2} .fo-st .w5`).textContent,
      other: document.querySelector(`${f1} .fo-st .w5`).textContent,
      say: document.querySelector('.sum [role="status"]').textContent,
    }),
    [ROW('F1'), ROW('F2')],
  );
  ok(
    '결과: 숙소를 고르면 그 항공권이 선택되고 합계가 바뀐다',
    r1.total === '843,800원' &&
      r1.f2 &&
      !r1.f1 &&
      r1.radio === 'F2' &&
      r1.line === '고른 숙소 호텔 시노바즈 우에노' &&
      /^추천 숙소 3곳/.test(r1.other) &&
      /843,800원/.test(r1.say),
    JSON.stringify(r1),
  );
  await page.click(`${ROW('F2')} .ax-r .chk`);
  await page.waitForTimeout(150);
  ok('결과: 수하물 추가가 합계에 더해진다', (await total(page)) === '887,800원');
  await page.click(`${ROW('F3')} .fo-p`);
  await page.waitForTimeout(300);
  const r2 = await page.evaluate(
    ([f2, f3]) => ({
      total: document.querySelector('.sum .t-h1.num').textContent,
      radio: document.querySelector('input[name="flight"]:checked').value,
      open: document.querySelector(`${f3} details`).open,
      stay: (document.querySelector(`${f3} label.sc input:checked`) || {}).value,
      stale: document.querySelectorAll(`${f2} label.sc input:checked`).length,
    }),
    [ROW('F2'), ROW('F3')],
  );
  ok(
    '결과: 줄을 누르면 그 항공권을 고르고 같은 숙소를 이어 간다',
    r2.total === '1,207,800원' &&
      r2.radio === 'F3' &&
      r2.open &&
      r2.stay === 'H5' &&
      r2.stale === 0,
    JSON.stringify(r2),
  );
  await page.hover('.dock .dock-h');
  await page.waitForTimeout(400);
  ok(
    '독: 마우스를 올리면 올라온다',
    await page.evaluate(
      () =>
        document.querySelector('.dock').classList.contains('up') &&
        document.querySelector('.dock-h').getAttribute('aria-expanded') === 'true',
    ),
  );
  ok(
    '독: 비어 있으면 [다시 검색]이 꺼져 있다',
    (await page.getAttribute('.dock .pbox-a .btn', 'aria-disabled')) === 'true',
  );
  const ask = '숙소를 우에노역에서 더 가까운 곳으로';
  await page.click('.dock .pbox-x');
  await page.keyboard.type(ask);
  await page.waitForTimeout(150);
  ok(
    '독: 적은 글자 수를 센다',
    (await page.evaluate(() => document.querySelector('.dock .pbox-a .num').textContent)) ===
      `${ask.length} / 300`,
  );
  await go(page, '**/results?rev=2', () => page.keyboard.press('Enter'));
  ok('독: 엔터로 다시 검색한 결과로 간다', at(page, '/results?rev=2'));
  await page.waitForTimeout(600);
  ok(
    '다시 검색한 결과: 고른 항공권의 숙소가 펼쳐져 있다',
    await page.evaluate(
      ([f1, f2]) =>
        document.querySelector(`${f1} details`).open &&
        !document.querySelector(`${f2} details`).open,
      [ROW('F1'), ROW('F2')],
    ),
  );
  await ctx.close();
}

/* 2) 움직임 줄이기: 검색 중 화면이 장면만 바꾸고 결과로 넘어간다 */
{
  const { ctx, page } = await open({ ...D, reducedMotion: 'reduce' });
  await page.goto(url('/search/progress'));
  await page.waitForTimeout(1200);
  const s1 = await page.evaluate(() => document.body.dataset.stage);
  await page.waitForTimeout(2200);
  const s2 = await page.evaluate(() => document.body.dataset.stage).catch(() => 'nav');
  await page.waitForURL('**/results', { timeout: 6000 }).catch(() => {});
  ok(
    '움직임 줄이기: 장면만 바꾸고 결과에 닿는다',
    s1 === 'flight' && s2 === 'stay' && at(page, '/results'),
    s1 + '>' + s2,
  );
  await page.waitForSelector('.fo', { timeout: 3000 }).catch(() => {});
  ok(
    '움직임 줄이기: 항공권 줄이 바로 보인다',
    (await page.evaluate(() =>
      [...document.querySelectorAll('.fo')].map((e) => getComputedStyle(e).opacity).join(','),
    )) === '1,1,1',
  );
  await page.goto(url('/'));
  await page.waitForTimeout(300);
  ok(
    '움직임 줄이기: 흐르는 글자 멈춤 단추를 치운다',
    await page.evaluate(() => document.querySelector('.mq-x').hidden),
  );
  await ctx.close();
}

/* 3) 문장 없이 로그인 · 키보드만으로 */
{
  const { ctx, page } = await open(D);
  await page.goto(url('/'));
  await page.waitForTimeout(300);
  await go(page, '**/login', () => page.click('.lp-top a:has-text("로그인")'), '.rc-k');
  ok(
    '문장 없이 로그인: 예시 조건이라고 알린다',
    /예시/.test(await page.evaluate(() => document.querySelector('.rc-k').textContent)),
  );
  await page.goto(url('/'));
  await page.waitForTimeout(300);
  await page.focus('.lp-top a.cta');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2600);
  const st = await svc(page);
  ok(
    '키보드: [검색 시작]에서 엔터 → 항공 문장 칸',
    st.on === '0' && st.focus === 'flight',
    JSON.stringify(st),
  );
  await page.keyboard.type('삿포로 1월 말');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  await go(page, '**/login', () => page.keyboard.press('Enter'), '.rc');
  await page.waitForTimeout(200);
  const rc = await page.evaluate(() =>
    [...document.querySelectorAll('.rc .v')].map((e) => e.textContent),
  );
  ok(
    '일부만 적으면 나머지는 "적지 않았습니다"로 보인다',
    rc[0] === '삿포로 1월 말' && rc[1] === '적지 않았습니다' && rc[2] === '적지 않았습니다',
    JSON.stringify(rc),
  );
  // [문장 다시 적기]로 돌아오면 첫 질문 자리에서 시작한다
  await go(page, '**/#search', () => page.click('.rc-e'), '.lp-svc');
  await page.waitForTimeout(1200);
  const back = await svc(page);
  ok(
    '로그인의 [문장 다시 적기] → 랜딩의 항공 문장 칸',
    back.on === '0' &&
      back.focus === 'flight' &&
      (await page.inputValue('.lp-svc input[name="flight"]')) === '삿포로 1월 말',
    JSON.stringify(back),
  );
  // Tab 으로 내려가다 문장 칸에 닿으면(아직 창이 커지기 전) 그 질문 자리로 스크롤해 보여 준다
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(url('/'));
  await page.waitForTimeout(300);
  await page.focus('.mq-x');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1900);
  const tab = await page.evaluate(() => {
    const s = document.querySelector('.lp-svc');
    const el = document.activeElement;
    const r = el.getBoundingClientRect();
    return {
      name: el.name,
      live: s.classList.contains('live'),
      on: s.dataset.on,
      ui: +getComputedStyle(document.querySelector('.svc-ui')).opacity,
      inView: r.top > 0 && r.bottom < innerHeight,
    };
  });
  ok(
    '키보드: Tab 으로 문장 칸에 닿으면 그 자리가 화면에 나타난다',
    tab.name === 'flight' && tab.live && tab.on === '0' && tab.ui > 0.95 && tab.inView,
    JSON.stringify(tab),
  );
  await toStop(page, 'svc', 0);
  await page.waitForTimeout(700);
  await page.click('.mq-x');
  await page.waitForTimeout(80);
  const mq = await page.evaluate(() => ({
    paused: document.querySelector('.lp-svc').classList.contains('mq-paused'),
    pressed: document.querySelector('.mq-x').getAttribute('aria-pressed'),
    state: getComputedStyle(document.querySelector('.mq-t')).animationPlayState,
  }));
  ok(
    '흐르는 글자: 단추로 멈춘다',
    mq.paused && mq.pressed === 'true' && mq.state === 'paused',
    JSON.stringify(mq),
  );
  // 독: 키보드로 열고 닫는다
  await page.goto(url('/results'));
  await page.waitForTimeout(1500);
  await page.focus('.dock-h');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(350);
  const k1 = await page.evaluate(() => ({
    up: document.querySelector('.dock').classList.contains('up'),
    focus: document.activeElement.className,
  }));
  ok(
    '독: 머리줄에서 엔터를 누르면 올라오고 입력 칸에 커서가 간다',
    k1.up && /pbox-x/.test(k1.focus),
    JSON.stringify(k1),
  );
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const k2 = await page.evaluate(() => ({
    up: document.querySelector('.dock').classList.contains('up'),
    focus: document.activeElement.className,
    exp: document.querySelector('.dock-h').getAttribute('aria-expanded'),
  }));
  ok(
    '독: 빈 채로 Esc 를 누르면 내려가고 초점이 머리줄로 돌아온다',
    !k2.up && /dock-h/.test(k2.focus) && k2.exp === 'false',
    JSON.stringify(k2),
  );
  // 결과: 키보드로 항공권과 숙소를 고른다
  await page.focus('input[name="flight"]:checked');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  const k3 = await page.evaluate(
    (f2) => ({
      radio: document.querySelector('input[name="flight"]:checked').value,
      total: document.querySelector('.sum .t-h1.num').textContent,
      open: document.querySelector(`${f2} details`).open,
    }),
    ROW('F2'),
  );
  ok(
    '결과: 방향키로 항공권을 바꾸면 합계가 따라 바뀐다',
    k3.radio === 'F2' && k3.total === '736,400원' && k3.open,
    JSON.stringify(k3),
  );
  await ctx.close();
}

/* 4) 모바일 폭 · 터치 */
{
  const { ctx, page } = await open({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  await page.goto(url('/'));
  await page.waitForTimeout(300);
  await page.tap('.lp-top a.cta');
  await page.waitForTimeout(2600);
  await page.keyboard.type('오사카 주말 2박');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2200);
  ok(
    '모바일: 엔터로 숙소 문장 칸으로 넘어간다',
    (await page.evaluate(() => document.querySelector('.lp-svc').dataset.on)) === '1',
  );
  await page.goto(url('/results'));
  await page.waitForTimeout(1500);
  await page.tap(`${ROW('F3')} summary.fo-tg`);
  await page.waitForTimeout(1300);
  await page.tap(STAY('F3', 'H6'));
  await page.waitForTimeout(200);
  ok(
    '모바일: 숙소를 고르면 아래 합계 바가 바뀐다',
    (await page.evaluate(() => document.querySelector('.cta-bar .t-h3.num').textContent)) ===
      '1,010,400원',
  );
  ok(
    '모바일: 가로 넘침이 없다',
    (await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0,
  );
  await page.tap('.dock-h');
  await page.waitForTimeout(500);
  ok(
    '모바일: 독 머리줄을 누르면 올라온 채로 있다',
    await page.evaluate(() => document.querySelector('.dock').classList.contains('up')),
  );
  await ctx.close();
}

/* 5) 장소 → 결제 권한 → 결제 확인 → 진행 → 완료 → 내 여행 → 새 검색 */
{
  const { ctx, page } = await open(D);
  await page.goto(url('/places'));
  await page.waitForTimeout(300);
  await go(page, '**/pay/mandate', () => page.click('.sum .btn.pri'));
  ok('장소 → 결제 권한 등록', at(page, '/pay/mandate'));
  await go(page, '**/pay/checkout', () => page.click('button:has-text("패스키로 서명하고 등록")'));
  ok('결제 권한 등록 → 결제 확인', at(page, '/pay/checkout'));
  await go(page, '**/pay/processing', () => page.click('a:has-text("패스키로 승인하고 결제")'));
  ok('결제 확인 → 결제 진행', at(page, '/pay/processing'));
  await page.waitForURL('**/pay/complete', { timeout: 9000 }).catch(() => {});
  ok('결제 진행 → 결제 완료 (자동)', at(page, '/pay/complete'));
  await go(page, '**/trips', () => page.click('a:has-text("내 여행에서 일정 보기")'), '.tl-d');
  const tr = await page.evaluate(() => ({
    cur: (document.querySelector('.hdr .nav a[aria-current="page"]') || {}).textContent,
    days: document.querySelectorAll('.tl-d').length,
    docs: document.querySelectorAll('#docs .doc').length,
  }));
  ok(
    '결제 완료 → 내 여행 (날짜별 일정과 문서함)',
    at(page, '/trips') && tr.cur === '내 여행' && tr.days === 3 && tr.docs === 3,
    JSON.stringify(tr),
  );
  await go(page, '**/places', () => page.click('.tl a:has-text("추천 장소 보기")'), '.map');
  ok('내 여행: 자유 일정에서 추천 장소로 간다', at(page, '/places'));
  await go(page, '**/trips', () => page.click('.hdr .nav a[href="/trips"]'), '.tl-d');
  ok('상단 메뉴의 [내 여행]을 누르면 내 여행으로 간다', at(page, '/trips'));
  await go(page, '**/search', () => page.click('main a.btn:has-text("새 검색")'), '.ask');
  ok('내 여행 → 새 검색', at(page, '/search'));
  await page.focus('.ask input[name="flight"]');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  ok(
    '새 검색: 엔터로 다음 문장 칸에 커서가 간다',
    (await page.evaluate(() => document.activeElement && document.activeElement.name)) === 'stay',
  );
  await ctx.close();
}

/* 6) Google 로그인 연동: 로그인이 필요한 화면 · 거절 · 이미 가입한 계정 · 토큰 재발급 · 로그아웃 */
{
  const { ctx, page } = await open(D);
  const stored = async () =>
    JSON.parse((await page.evaluate(() => localStorage.getItem('tp.auth'))) || 'null');
  // 가짜 백엔드가 n 개의 요청을 더 받을 때까지 (최대 3초) 기다린다
  const settle = async (from, n) => {
    for (let i = 0; i < 30 && backend.calls.length < from + n; i++) await page.waitForTimeout(100);
    await page.waitForTimeout(150);
    return backend.calls.slice(from);
  };

  await page.goto(url('/signup'));
  await page.waitForURL('**/login', { timeout: 4000 }).catch(() => {});
  ok('로그인하지 않고 회원 정보 입력을 열면 로그인 화면으로 간다', at(page, '/login'));

  await page.waitForSelector('.auth-gsi .fake-gsi', { timeout: 4000 }).catch(() => {});
  await page.evaluate(() => {
    window.__googleAccount = 'unverified';
  });
  await page.click('.auth-gsi .fake-gsi');
  const refused = await page
    .waitForSelector('.auth-go [role="alert"]', { timeout: 4000 })
    .then((el) => el.textContent())
    .catch(() => '');
  ok(
    '백엔드가 거절하면(이메일 미인증) 이유를 보여 주고 로그인 화면에 남는다',
    at(page, '/login') && /이메일 인증/.test(refused) && (await stored()) === null,
    refused,
  );

  await page.evaluate(() => {
    window.__googleAccount = 'traveler';
  });
  await go(page, '**/search', () => page.click('.auth-gsi .fake-gsi'), '.ask');
  ok(
    '이미 가입한 계정은 회원 정보 입력을 건너뛰고, 적어 둔 문장이 없으니 새 검색으로 간다',
    at(page, '/search'),
  );
  await page.waitForSelector('.hdr .me', { timeout: 4000 }).catch(() => {});
  const me = await page.evaluate(() => document.querySelector('.hdr .me')?.textContent ?? '');
  ok('상단 바에 로그인한 사람의 이름이 보인다', me.includes('여행자님'), me);

  await page.goto(url('/login'));
  await page.waitForURL('**/search', { timeout: 4000 }).catch(() => {});
  ok('이미 로그인한 채로 로그인 화면을 열면 바로 다음 화면으로 간다', at(page, '/search'));

  await page.goto(url('/'));
  await page.waitForSelector('.lp-top a', { timeout: 4000 }).catch(() => {});
  const top = await page.evaluate(() =>
    [...document.querySelectorAll('.lp-top a')].map((a) => a.textContent.trim()).join(' | '),
  );
  ok('로그인한 채로 랜딩에 오면 [로그인] 대신 [새 검색]이 보인다', top.startsWith('새 검색'), top);

  // 30분이 지나 access token 이 만료된 뒤 다시 열면: 401 → refresh token 으로 새 쌍 → 다시 묻는다
  await page.goto(url('/search'));
  await page.waitForSelector('.hdr .me', { timeout: 4000 }).catch(() => {});
  await settle(backend.calls.length, 1);
  const before = await stored();
  backend.expireAccessTokens();
  const mark = backend.calls.length;
  await page.reload();
  const seq = await settle(mark, 3);
  const after = await stored();
  ok(
    'access token 이 만료되면 refresh token 으로 새 쌍을 받아 같은 요청을 다시 보낸다',
    seq.join(', ') === 'GET /users/me (토큰), POST /auth/refresh, GET /users/me (토큰)' &&
      after?.refreshToken !== before.refreshToken &&
      backend.isRevoked(before.refreshToken),
    seq.join(' → '),
  );

  await page.click('.hdr .me');
  const menu = await page
    .waitForSelector('.me-menu', { timeout: 2000 })
    .then((el) => el.textContent())
    .catch(() => '');
  await go(
    page,
    (u) => u.pathname === '/',
    () => page.click('.me-menu .me-it'),
    '.lp-top',
  );
  await settle(backend.calls.length, 1);
  ok(
    '계정 메뉴의 로그아웃: refresh token 을 폐기하고 이 기기의 로그인을 지운 뒤 랜딩으로 간다',
    menu.includes('traveler@example.com') &&
      at(page, '/') &&
      backend.isRevoked(after.refreshToken) &&
      (await stored()) === null,
    menu,
  );

  // 다른 기기에서 폐기됐거나 14일이 지나 refresh token 도 쓸 수 없으면: 로그인이 풀린다
  await page.goto(url('/login'));
  await page.waitForSelector('.auth-gsi .fake-gsi', { timeout: 4000 }).catch(() => {});
  await go(page, '**/search', () => page.click('.auth-gsi .fake-gsi'), '.ask');
  backend.expireAccessTokens();
  backend.revokeAll();
  await page.reload();
  await page.waitForSelector('.hdr a[href="/login"]', { timeout: 4000 }).catch(() => {});
  ok(
    'refresh token 까지 쓸 수 없으면 로그인이 풀리고 상단 바에 [로그인]이 보인다',
    (await stored()) === null &&
      (await page.evaluate(() => !!document.querySelector('.hdr a[href="/login"]'))),
  );
  await ctx.close();
}

console.log(errs.length ? errs.join('\n') : '페이지 오류 없음');
await browser.close();
await server.stop();
if (failed || errs.length) {
  console.log(`실패 ${failed}건`);
  process.exit(1);
}
console.log('모두 통과');
