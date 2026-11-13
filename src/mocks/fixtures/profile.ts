// 회원 정보 입력(PUT /users/me/profile)의 검증 규칙과 메시지. 백엔드(UserReqDTO.Profile, UserService.updateProfile)와 같다.
import type { Schemas } from '@/shared/api/client';

type Interest = Schemas['TravelInterest'];

/** 저장된 회원 정보 */
export interface SavedProfile {
  nickname: string;
  birthYear: number;
  gender: 'FEMALE' | 'MALE' | null;
  interests: Interest[];
  agreements: { termsOfService: boolean; privacyCollection: boolean; marketing: boolean };
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
};

const REQUIRED_TERMS = '필수 약관에 동의해야 합니다.';
// 백엔드 @Pattern("[^\\x00-\\x1F\\x7F]*") 와 같다
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001F\u007F]/;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isInterest = (v: unknown): v is Interest =>
  typeof v === 'string' && (INTEREST_ORDER as readonly string[]).includes(v);

export type ProfileCheck =
  | { ok: true; profile: SavedProfile }
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

  // 백엔드는 enum 에 없는 값이나 타입이 틀린 값을 JSON 을 읽는 단계에서 거절한다 (칸별 메시지 없음)
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
  const nick = typeof nickname === 'string' ? nickname.trim() : '';
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
