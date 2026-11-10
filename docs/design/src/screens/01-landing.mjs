// 01 랜딩 — 스크롤 없이 첫 화면에서 검색 조건을 칸마다 입력한다. 05 새 검색(로그인 후)도 같은 틀을 쓴다.
import { header, footer, page } from '../lib/ui.mjs';
import { sform, presets, how, sources } from './parts-search.mjs';

export const landingBody = (o = {}) => `${header()}
<main class="land" data-n="Main"><div class="land-in" data-n="Content">
<section class="land-l" data-n="Search">
  <div class="g10" data-n="Heading"><h1 class="t-display">항공권 · 숙소 · 여행 장소 통합 검색</h1><p class="t-lg c2">조건을 문장으로 적으면 AI가 해석해 여러 예약 사이트의 항공권과 숙소, 지도와 후기 검색의 여행 장소를 한 번에 찾습니다.</p></div>
  <div class="g16" data-n="Form">${sform(o)}${presets()}</div>
</section>
<aside class="land-r" data-n="Guide">${how()}${sources()}</aside>
</div></main>
${footer()}`;

export default {
  id: '01-landing', no: '01', name: '랜딩 · 검색 조건 입력', kind: 'page',
  note: '비로그인 첫 화면. 스크롤 없이 검색 입력이 보인다. 입력은 여행 장소 · 출발 시기 · 기간과 인원 · 예산 · 요청사항 칸으로 나뉘고, 칸마다 연한 예시가 깔려 문장으로 자유롭게 적어도 된다는 것을 알린다. [통합 검색]을 누르면 02 로그인으로 이어진다.',
  html: () => page({ title: '01 랜딩 · 검색 조건 입력', cls: 'pg-white', body: landingBody() }),
};
