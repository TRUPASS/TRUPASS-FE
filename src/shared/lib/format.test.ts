import { formatKrw } from './format';

describe('formatKrw', () => {
  it('천 단위 콤마와 "원"을 붙인다', () => {
    expect(formatKrw(750000)).toBe('750,000원');
  });

  it('0원과 음수(환불 등)도 그대로 표시한다', () => {
    expect(formatKrw(0)).toBe('0원');
    expect(formatKrw(-60000)).toBe('-60,000원');
  });
});
