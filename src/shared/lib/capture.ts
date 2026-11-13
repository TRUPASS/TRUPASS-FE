/**
 * 주소 끝에 `#still` 을 붙이면(정지 화면 캡처용) 자동 이동과 부드러운 따라가기를 끈다.
 * 화면을 찍어 비교하는 도구가 쓴다. 처음 연 주소로 정해지고 그 뒤로는 바뀌지 않는다.
 */
export const still = typeof location !== 'undefined' && location.hash === '#still';

/** 움직임을 줄이도록 설정한 사용자인가 */
export function reduceMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
