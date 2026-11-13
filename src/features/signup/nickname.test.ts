import { prefillNickname } from './nickname';

describe('닉네임 칸에 미리 채울 값', () => {
  it('Google 이름을 백엔드와 같은 단위(UTF-16)로 12자까지 자르고, 이모지를 반으로 가르지 않는다', () => {
    expect(prefillNickname('김하림')).toBe('김하림');
    expect(prefillNickname('가나다라마바사아자차카타파하')).toBe('가나다라마바사아자차카타');
    // 이모지 하나는 UTF-16 두 단위다: 6개(12단위)까지만 들어간다
    expect(prefillNickname('😀😀😀😀😀😀😀')).toBe('😀😀😀😀😀😀');
    expect(prefillNickname('김하림🌸여행을좋아하는사람')).toBe('김하림🌸여행을좋아하는');
    for (const name of [
      '😀😀😀😀😀😀😀',
      '김하림🌸여행을좋아하는사람',
      '가나다라마바사아자차카타파하',
    ]) {
      expect(prefillNickname(name).length).toBeLessThanOrEqual(12);
    }
  });

  it('백엔드가 거절하는 제어 문자(줄바꿈 등)는 지우고 채운다', () => {
    expect(prefillNickname('도쿄\n여행자')).toBe('도쿄여행자');
    expect(prefillNickname('가\u001F')).toBe('');
    expect(prefillNickname('가나\u0001다')).toBe('가나다');
  });

  it('앞뒤 공백을 빼고 2자가 안 되면 비워 둔다 (서버가 거절할 값을 미리 넣지 않는다)', () => {
    expect(prefillNickname('  여행자  ')).toBe('여행자');
    expect(prefillNickname('J')).toBe('');
    expect(prefillNickname('   ')).toBe('');
    expect(prefillNickname('')).toBe('');
  });
});
