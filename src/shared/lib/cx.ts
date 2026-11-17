/**
 * 클래스 이름을 이어 붙인다. 거짓인 값은 건너뛴다.
 * 조건에 따라 붙는 클래스는 문자열 안의 공백에 기대지 말고 이 함수로 잇는다
 * (className 안의 문자열은 포매터가 앞뒤 공백을 지운다).
 * @example cx('dock', up && 'up') // "dock up"
 */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
