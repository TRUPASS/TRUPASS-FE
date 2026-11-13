import { checkProfile, javaStrip } from './profile';

const body = (nickname: string) => ({
  nickname,
  birthYear: 1994,
  agreements: { termsOfService: true, privacyCollection: true },
});
const ch = (code: number) => String.fromCharCode(code);
const NBSP = ch(0xa0);
const BOM = ch(0xfeff);
const IDEOGRAPHIC_SPACE = ch(0x3000);
const LINE_SEPARATOR = ch(0x2028);
const UNIT_SEPARATOR = ch(0x1f);

describe('Mock 회원 정보 검사 (백엔드와 같은 규칙)', () => {
  it('닉네임 앞뒤 공백은 Java String.strip 처럼 지운다 (NBSP 등은 남기고 U+001C~U+001F 는 지운다)', () => {
    expect(javaStrip('  여행자\t\n')).toBe('여행자');
    expect(javaStrip(`가${NBSP}`)).toBe(`가${NBSP}`);
    expect(javaStrip(`가${BOM}`)).toBe(`가${BOM}`);
    expect(javaStrip(`가나${UNIT_SEPARATOR}`)).toBe('가나');
    expect(javaStrip(`${IDEOGRAPHIC_SPACE}가나${LINE_SEPARATOR}`)).toBe('가나');
  });

  it('백엔드가 받는 값은 받고, 거절하는 값은 같은 코드로 거절한다', () => {
    // 백엔드: strip 뒤 '가'+NBSP(2자) → 200, '가나'+U+001F → strip 뒤 '가나' → 200
    expect(checkProfile(body(`가${NBSP}`))).toMatchObject({ ok: true });
    expect(checkProfile(body(`가나${UNIT_SEPARATOR}`))).toMatchObject({
      ok: true,
      profile: { nickname: '가나' },
    });
    expect(checkProfile(body('   a   '))).toMatchObject({
      ok: false,
      code: 'COMMON400_1',
      fields: { nickname: '닉네임은 2~12자로 입력해 주세요.' },
    });
    expect(checkProfile(body('도쿄\n여행'))).toMatchObject({
      ok: false,
      fields: { nickname: '닉네임에 줄바꿈 같은 제어 문자는 쓸 수 없습니다.' },
    });
    expect(checkProfile({ ...body('여행자'), birthYear: 3000 })).toMatchObject({
      ok: false,
      code: 'USER400_1',
    });
    expect(checkProfile({ ...body('여행자'), gender: '여성' })).toMatchObject({
      ok: false,
      code: 'COMMON400',
    });
  });
});
