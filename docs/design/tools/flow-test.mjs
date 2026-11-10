// dist/ 를 실제 브라우저로 열어 랜딩부터 결제 완료까지 눌러 본다 (움직임을 켠 채로).
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

/* 1) 랜딩 → 로그인 → 가입 → 검색 중 → 결과 → 수정 요청 */
{
  const { ctx, page } = await open(D);
  await page.goto(url('01-landing.html'));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, window.__tpStop('hero', 0.5)));
  await page.waitForTimeout(900);
  const p = await page.evaluate(() => +document.querySelector('.lp-hero').style.getPropertyValue('--p'));
  ok('하늘: 스크롤 진행도를 따라간다', Math.abs(p - 0.5) < 0.02, 'p=' + p);
  ok('하늘: 진행 50%에서 소개 문장이 보인다', +(await page.evaluate(() => getComputedStyle(document.querySelector('.hero-t')).opacity)) > 0.95);
  await page.evaluate(() => window.scrollTo(0, window.__tpStop('stats', 0.3))); await page.waitForTimeout(700);
  const mid = await page.evaluate(() => [...document.querySelectorAll('[data-count]')].map(e => e.textContent).join(','));
  await page.evaluate(() => window.scrollTo(0, window.__tpStop('stats', 1))); await page.waitForTimeout(900);
  const end = await page.evaluate(() => [...document.querySelectorAll('[data-count]')].map(e => e.textContent).join(','));
  ok('숫자: 스크롤에 맞춰 센다', end === '6,23,9,30' && mid !== end, mid + ' → ' + end);
  await page.evaluate(() => document.querySelector('#how').scrollIntoView()); await page.waitForTimeout(500);
  ok('이용 방법: 첫 장에서는 이전 버튼이 꺼져 있다', await page.evaluate(() => document.querySelector('[data-car-prev]').classList.contains('off')));
  for (let i = 0; i < 4; i++) { await page.click('[data-car-next]'); await page.waitForTimeout(250); }
  const car = await page.evaluate(() => ({ done: document.querySelector('.lp-how').classList.contains('done'), on: [...document.querySelectorAll('[data-slide]')].findIndex(s => s.classList.contains('on')), count: document.querySelector('[data-car-count]').textContent }));
  ok('이용 방법: 마지막 장에서 스크롤 권유가 나타난다', car.done && car.on === 4 && car.count === '05 / 05', JSON.stringify(car));
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
  await page.click('[data-tab="join"]'); await page.waitForTimeout(200);
  ok('탭: 회원가입으로 바뀐다', await page.evaluate(() => !document.querySelector('[data-pane="join"]').hidden && document.querySelector('[data-pane="login"]').hidden));
  await Promise.all([page.waitForNavigation(), page.click('[data-pane="join"] .gbtn')]);
  ok('Google 가입 → 회원 정보 입력', /03-signup/.test(page.url()));
  await page.click('[data-toggle="all"]'); await page.waitForTimeout(100);
  ok('약관 전체 동의가 모두 체크한다', await page.evaluate(() => [...document.querySelectorAll('[data-toggle="term"] .box')].every(b => b.classList.contains('on'))));
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
  await page.click('[data-flight="F2"] [data-tg]'); await page.waitForTimeout(1300);
  ok('결과: 토글이 옵션 2의 숙소를 펼친다', await page.evaluate(() => getComputedStyle(document.querySelector('[data-flight="F2"] .oc-s')).display === 'flex'));
  await page.click('[data-flight="F2"] [data-stay="H5"]'); await page.waitForTimeout(200);
  const r1 = await page.evaluate(() => ({ total: document.querySelector('.sum [data-sum="total"]').textContent, f2: document.querySelector('[data-flight="F2"]').classList.contains('on'), f1: document.querySelector('[data-flight="F1"]').classList.contains('on') }));
  ok('결과: 숙소를 고르면 합계가 바뀐다', r1.total === '843,800원' && r1.f2 && !r1.f1, JSON.stringify(r1));
  await page.click('[data-flight="F2"] [data-addon="bag"]'); await page.waitForTimeout(150);
  ok('결과: 수하물 추가가 합계에 더해진다', (await page.evaluate(() => document.querySelector('.sum [data-sum="total"]').textContent)) === '887,800원');
  await page.hover('[data-dock] .dock-h'); await page.waitForTimeout(400);
  ok('독: 마우스를 올리면 올라온다', await page.evaluate(() => document.querySelector('[data-dock]').classList.contains('up')));
  await page.click('[data-dock] .pbox-x'); await page.keyboard.type('숙소를 우에노역에서 더 가까운 곳으로'); await page.waitForTimeout(150);
  await Promise.all([page.waitForNavigation(), page.keyboard.press('Enter')]);
  ok('독: 엔터로 다시 검색한 결과(v2)로 간다', /08-result-v2/.test(page.url()));
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
  ok('움직임 줄이기: 옵션 카드가 바로 보인다', (await page.evaluate(() => [...document.querySelectorAll('.oc')].map(e => getComputedStyle(e).opacity).join(','))) === '1,1,1');
  await ctx.close();
}

/* 3) 문장 없이 로그인 · 키보드 · 일부만 적기 */
{
  const { ctx, page } = await open(D);
  await page.goto(url('01-landing.html'));
  await page.waitForTimeout(300);
  await Promise.all([page.waitForNavigation(), page.click('.lp-top [data-n="Login"]')]);
  ok('문장 없이 로그인: 예시 조건이라고 알린다', /예시/.test(await page.evaluate(() => document.querySelector('.rc-k').textContent)));
  await Promise.all([page.waitForNavigation(), page.click('[data-pane="login"] .gbtn')]);
  ok('Google 로그인 → 곧바로 검색 중', /06-searching/.test(page.url()));
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
  await ctx.close();
}

/* 4) 모바일 폭 */
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
  await Promise.all([page.waitForNavigation(), page.click('[data-n="NewSearch"]')]);
  ok('결제 완료 → 새 검색', /05-home/.test(page.url()));
  await page.focus('[data-ask="flight"] input'); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  ok('새 검색: 엔터로 다음 문장 칸에 커서가 간다', (await page.evaluate(() => document.activeElement && document.activeElement.name)) === 'stay');
  await ctx.close();
}

console.log(errs.length ? errs.join('\n') : '페이지 오류 없음');
await browser.close();
if (failed || errs.length) { console.log(`실패 ${failed}건`); process.exit(1); }
console.log('모두 통과');
