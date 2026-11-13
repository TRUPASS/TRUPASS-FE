import { ApiError } from '@/shared/api/client';

// 백엔드 에러 코드(AuthErrorCode)별로 화면에 보여 줄 말
const BY_CODE: Record<string, string> = {
  AUTH401_1: 'Google 계정을 확인하지 못했습니다. 다시 시도해 주세요.',
  AUTH401_2: '이메일 인증을 마친 Google 계정으로만 시작할 수 있습니다.',
  AUTH500_1: '지금은 Google 로그인을 쓸 수 없습니다. 서버에 로그인 설정이 없습니다.',
  AUTH502_1: 'Google 인증 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.',
};

/** 로그인에 실패했을 때 보여 줄 문장 */
export function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code && BY_CODE[error.code]) return BY_CODE[error.code] as string;
    if (error.serverMessage) return error.serverMessage;
    return `로그인하지 못했습니다 (오류 ${error.status}). 잠시 뒤 다시 시도해 주세요.`;
  }
  // fetch 자체가 실패: 서버가 꺼져 있거나 주소(VITE_API_BASE_URL) · CORS 설정이 맞지 않는다
  return '서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.';
}
