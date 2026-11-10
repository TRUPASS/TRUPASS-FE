// 05 새 검색 — 로그인 후 첫 화면. 랜딩과 같은 틀에 계정 상태(결제 권한, 최근 검색)가 붙는다.
import { page, header, footer, st } from '../lib/ui.mjs';
import { sform, presets, sources } from './parts-search.mjs';

export const homeBody = (o = {}) => `${header({ kind: 'in', on: '새 검색' })}
<main class="land" data-n="Main"><div class="land-in" data-n="Content">
<section class="land-l" data-n="Search">
  <div class="g10" data-n="Heading"><h1 class="t-display">새 여행 검색</h1><p class="t-lg c2">칸마다 조건을 자유롭게 적어 주세요. 항공권 · 숙소 · 여행 장소를 함께 검색하며, 보통 20~40초가 걸립니다.</p></div>
  <div class="g16" data-n="Form">${sform({ filled: !o.empty, focus: o.empty ? '' : 'wish' })}${presets()}</div>
</section>
<aside class="land-r" data-n="Account">
  <div class="side-b" data-n="Mandate"><div class="row jb"><span class="t-sm w6">결제 권한</span>${st('warn', '미등록')}</div><p class="t-sm c2">첫 결제 단계에서 한도와 허용 항목을 정하고 패스키로 서명합니다. 등록한 범위를 벗어난 결제는 실행되지 않습니다.</p><a class="t-sm lnk w5">지금 등록</a></div>
  <div class="side-b" data-n="Recent"><span class="t-sm w6">최근 검색</span><p class="t-sm c3">아직 검색 내역이 없습니다.</p></div>
  ${sources()}
</aside>
</div></main>
${footer()}`;

export default {
  id: '05-home', no: '05', name: '새 검색 · 로그인 후', kind: 'page',
  note: '이용 안내를 닫은 뒤의 화면. 로그인 전에 칸마다 적은 조건이 그대로 들어 있고, [통합 검색]으로 검색을 시작한다.',
  html: () => page({ title: '05 새 검색 · 로그인 후', cls: 'pg-white', body: homeBody() }),
};
