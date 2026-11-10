const krwFormatter = new Intl.NumberFormat('ko-KR');

/**
 * 원화 표시용 포맷. 금액 계산은 하지 않고 백엔드가 준 값을 그대로 표시만 한다.
 * @example formatKrw(410000) // "410,000원"
 */
export function formatKrw(amount: number): string {
  return `${krwFormatter.format(amount)}원`;
}
