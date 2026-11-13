import { cx } from './cx';

describe('cx', () => {
  const dock = (up: boolean, moved: boolean) =>
    cx('dock', up && 'up', moved && (up ? 'lift' : 'drop'));

  it('참인 이름만 한 칸씩 띄어 잇는다', () => {
    expect(dock(true, true)).toBe('dock up lift');
    expect(dock(false, true)).toBe('dock drop');
    expect(dock(false, false)).toBe('dock');
  });

  it('빈 값(false · null · undefined)만 있으면 빈 문자열이다', () => {
    expect(cx(false, null, undefined)).toBe('');
  });
});
