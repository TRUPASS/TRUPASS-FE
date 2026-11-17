import { formatKrw, formatKrwDiff } from './format';

describe('formatKrw', () => {
  it('천 단위 콤마와 "원"을 붙인다', () => {
    expect(formatKrw(750000)).toBe('750,000원');
  });

  it('0원과 음수(환불 등)도 그대로 표시한다', () => {
    expect(formatKrw(0)).toBe('0원');
    expect(formatKrw(-60000)).toBe('-60,000원');
  });
});

describe('formatKrwDiff', () => {
  it('늘면 +, 줄면 −를 붙이고 같으면 부호 없이 표시한다', () => {
    expect(formatKrwDiff(12000)).toBe('+12,000원');
    expect(formatKrwDiff(-12000)).toBe('−12,000원');
    expect(formatKrwDiff(0)).toBe('0원');
  });
});
