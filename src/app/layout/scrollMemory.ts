/** 라우터가 화면별 스크롤 자리를 적어 두는 sessionStorage 이름 */
export const SCROLL_KEY = 'tp.scroll';

/**
 * 주소를 열어 새로 들어온 방문이면 적어 둔 스크롤 자리를 지운다. 새로고침 · 뒤로 가기일 때만 자리를 되살리기 위해서다.
 * 라우터는 처음 연 화면의 자리를 늘 같은 이름으로 적어 두므로, 지우지 않으면 같은 탭의 이전 방문 자리로 내려간 채 열린다.
 */
export function forgetScrollOnFreshVisit() {
  if (typeof performance.getEntriesByType !== 'function') return;
  const entry = performance.getEntriesByType('navigation')[0] as
    PerformanceNavigationTiming | undefined;
  if (entry?.type !== 'navigate') return;
  try {
    sessionStorage.removeItem(SCROLL_KEY);
  } catch {
    // 저장소를 쓸 수 없는 환경에서는 라우터도 자리를 적지 못하므로 할 일이 없다
  }
}
