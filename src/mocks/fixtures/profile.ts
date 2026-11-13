// 회원 정보 입력(PUT /users/me/profile)의 검증 규칙과 메시지. 백엔드(UserReqDTO.Profile, UserService.updateProfile)와 같다.
// 화면이 보내는 값(문자열 닉네임, 정수 출생 연도, 불리언 약관, enum 값)에 대해서는 판정과 메시지가 백엔드와 같다.
// 다른 점: 타입이 틀린 값은 판정이 다를 수 있다. 백엔드는 JSON 을 읽을 때 "1994"·1994.5 를 숫자로, 12345 를 문자열로, "true"·1 을
// 불리언으로 바꿔 받거나 다른 코드로 거절하지만, Mock 은 바꿔 받지 않고 COMMON400 · COMMON400_1 로 거절한다. 화면은 그런 값을 보내지 않는다.
import type { ProfileInput } from '@/shared/api/auth';

type Interest = NonNullable<ProfileInput['interests']>[number];

/** 저장된 회원 정보 */
export interface SavedProfile {
  nickname: string;
  birthYear: number;
  gender: 'FEMALE' | 'MALE' | null;
  interests: Interest[];
  agreements: { termsOfService: boolean; privacyCollection: boolean; marketing: boolean };
  /** 지금 유지 중인 마케팅 수신 동의를 한 시각(ISO). 동의하지 않았으면 null */
  marketingAgreedAt: string | null;
}

/** 백엔드 TravelInterest 의 순서. 응답의 관심사는 이 순서로 정렬된다 */
export const INTEREST_ORDER: readonly Interest[] = [
  'FOOD',
  'SIGHTSEEING',
  'SHOPPING',
  'RELAXATION',
  'CULTURE',
  'ARCHITECTURE',
  'NATURE',
  'THEME_PARK',
];

/** 테스트에서 "회원 정보 입력을 마친 계정"을 만들 때 쓰는 값 */
export const COMPLETED_PROFILE: SavedProfile = {
  nickname: '여행자',
  birthYear: 1994,
  gender: null,
  interests: ['CULTURE', 'ARCHITECTURE'],
  agreements: { termsOfService: true, privacyCollection: true, marketing: false },
  marketingAgreedAt: null,
};

const REQUIRED_TERMS = '필수 약관에 동의해야 합니다.';
// 백엔드 @Pattern("[^\\x00-\\x1F\\x7F]*") 와 같다
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001F\u007F]/;
// Java String.strip() 이 지우는 공백(Character.isWhitespace)의 문자 코드 범위. JS trim() 과 달리 U+00A0 · U+2007 · U+202F · U+FEFF 는
// 남기고 U+001C~U+001F 는 지운다
const JAVA_WHITESPACE: readonly (readonly [number, number])[] = [
  [0x09, 0x0d],
  [0x1c, 0x1f],
  [0x20, 0x20],
  [0x1680, 0x1680],
  [0x2000, 0x2006],
  [0x2008, 0x200a],
  [0x2028, 0x2029],
  [0x205f, 0x205f],
  [0x3000, 0x3000],
];
const isJavaWhitespace = (code: number) =>
  JAVA_WHITESPACE.some(([from, to]) => code >= from && code <= to);

/** 백엔드(Java String.strip)와 같게 앞뒤 공백을 지운다 */
export function javaStrip(text: string): string {
  let start = 0;
  let end = text.length;
  while (start < end && isJavaWhitespace(text.charCodeAt(start))) start += 1;
  while (end > start && isJavaWhitespace(text.charCodeAt(end - 1))) end -= 1;
  return text.slice(start, end);
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isInterest = (v: unknown): v is Interest =>
  typeof v === 'string' && (INTEREST_ORDER as readonly string[]).includes(v);

export type ProfileCheck =
  | { ok: true; profile: Omit<SavedProfile, 'marketingAgreedAt'> }
  | { ok: false; status: number; code: string; message: string; fields?: Record<string, string> };

const badRequest: ProfileCheck = {
  ok: false,
  status: 400,
  code: 'COMMON400',
  message: '잘못된 요청입니다.',
};

/**
 * 받은 본문을 검사한다. 칸이 틀리면 COMMON400_1 과 {칸: 메시지}, 없는 값(성별 · 관심사)이나 형식이 틀리면 COMMON400,
 * 출생 연도가 올해(UTC)보다 뒤면 USER400_1 이다.
 */
export function checkProfile(body: unknown, thisYear = new Date().getUTCFullYear()): ProfileCheck {
  if (!isRecord(body)) return badRequest;
  const { nickname, birthYear, gender, interests, agreements } = body;

  // 백엔드는 enum 에 없는 값을 JSON 을 읽는 단계에서 거절한다 (칸별 메시지 없음)
  if (gender !== undefined && gender !== null && gender !== 'FEMALE' && gender !== 'MALE') {
    return badRequest;
  }
  if (interests !== undefined && interests !== null) {
    if (!Array.isArray(interests) || !interests.every(isInterest)) return badRequest;
  }
  if (birthYear !== undefined && birthYear !== null && !Number.isInteger(birthYear)) {
    return badRequest;
  }

  const fields: Record<string, string> = {};
  const nick = typeof nickname === 'string' ? javaStrip(nickname) : '';
  if (!nick) fields.nickname = '닉네임을 입력해 주세요.';
  else if (nick.length < 2 || nick.length > 12)
    fields.nickname = '닉네임은 2~12자로 입력해 주세요.';
  else if (CONTROL.test(nick)) fields.nickname = '닉네임에 줄바꿈 같은 제어 문자는 쓸 수 없습니다.';

  if (typeof birthYear !== 'number') fields.birthYear = '출생 연도를 골라 주세요.';
  else if (birthYear < 1900) fields.birthYear = '출생 연도가 올바르지 않습니다.';

  const chosen = [...new Set((interests ?? []) as Interest[])];
  if (chosen.length > 3) fields.interests = '여행 관심사는 최대 3개까지 고를 수 있습니다.';

  if (!isRecord(agreements)) {
    fields.agreements = '약관 동의 여부를 보내 주세요.';
  } else {
    if (agreements.termsOfService !== true) fields['agreements.termsOfService'] = REQUIRED_TERMS;
    if (agreements.privacyCollection !== true) {
      fields['agreements.privacyCollection'] = REQUIRED_TERMS;
    }
  }

  if (Object.keys(fields).length > 0) {
    return {
      ok: false,
      status: 400,
      code: 'COMMON400_1',
      message: '입력값이 올바르지 않습니다.',
      fields,
    };
  }
  if ((birthYear as number) > thisYear) {
    return { ok: false, status: 400, code: 'USER400_1', message: '출생 연도가 올바르지 않습니다.' };
  }
  return {
    ok: true,
    profile: {
      nickname: nick,
      birthYear: birthYear as number,
      gender: (gender ?? null) as SavedProfile['gender'],
      interests: chosen,
      agreements: {
        termsOfService: true,
        privacyCollection: true,
        marketing: isRecord(agreements) && agreements.marketing === true,
      },
    },
  };
}
