// 05 새 요청 — 로그인 후 첫 화면. 랜딩과 같은 틀에 계정 상태(결제 권한, 최근 요청)가 붙는다.
import { page, header, footer, pbox, st } from '../lib/ui.mjs';
import { REQ } from '../lib/data.mjs';
import { examples, sources } from './01-landing.mjs';

export const homeBody = (o = {}) => `${header({ kind: 'in', on: '새 요청' })}
<main class="land" data-n="Main"><div class="land-in" data-n="Content">
<section class="land-l" data-n="Request">
  <div class="g12" data-n="Heading"><h1 class="t-display">새 여행 요청</h1><p class="t-lg c2">목적지, 일정, 인원, 예산을 문장으로 입력해 주세요. 조회에는 보통 20~40초가 걸립니다.</p></div>
  <div class="g8" data-n="RequestField"><span class="t-sm w6">여행 요청</span>${pbox({ text: o.empty ? '' : REQ.text, focus: !o.empty, count: o.empty ? 0 : REQ.text.length, ph: '예) ' + REQ.text, hint: '목적지 · 일정 · 인원 · 예산을 함께 적으면 조합이 정확해집니다.' })}</div>
  ${examples()}
</section>
<aside class="land-r" data-n="Account">
  <div class="side-b" data-n="Mandate"><div class="row jb"><span class="t-sm w6">결제 권한</span>${st('warn', '미등록')}</div><p class="t-sm c2">첫 결제 단계에서 한도와 허용 항목을 정하고 패스키로 서명합니다. 등록한 범위를 벗어난 결제는 실행되지 않습니다.</p><a class="t-sm lnk w5">지금 등록</a></div>
  <div class="side-b" data-n="Recent"><span class="t-sm w6">최근 요청</span><p class="t-sm c3">아직 요청 내역이 없습니다.</p></div>
  ${sources()}
</aside>
</div></main>
${footer()}`;

export default {
  id: '05-home', no: '05', name: '새 요청 · 로그인 후', kind: 'page',
  note: '이용 안내를 닫은 뒤의 화면. 로그인 전에 적은 요청이 그대로 들어 있고, [조합 요청]으로 조회를 시작한다.',
  html: () => page({ title: '05 새 요청 · 로그인 후', cls: 'pg-white', body: homeBody() }),
};
