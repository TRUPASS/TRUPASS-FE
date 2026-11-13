import { ApiError } from '@/shared/api/client';

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/**
 * 칸이 틀렸을 때(COMMON400_1) 백엔드가 result 에 담아 보내는 {칸: 메시지}에서 메시지만 꺼낸다.
 * 예: {"nickname": "닉네임은 2~12자로 입력해 주세요.", "agreements.termsOfService": "필수 약관에 동의해야 합니다."}
 */
function fieldMessages(body: unknown): string[] {
  if (!isRecord(body) || !isRecord(body.result)) return [];
  const texts = Object.values(body.result).filter(
    (m): m is string => typeof m === 'string' && m.length > 0,
  );
  return [...new Set(texts)];
}

/** 회원 정보를 저장하지 못했을 때 보여 줄 문장 */
export function profileErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const fields = fieldMessages(error.body);
    if (fields.length > 0) return fields.join(' ');
    // 성공 응답인데 약속한 형식이 아닐 때 (응답의 "성공했습니다." 를 오류로 보여 주지 않는다)
    if (error.status >= 200 && error.status < 300) {
      return '서버 응답을 읽지 못했습니다. 잠시 뒤 다시 시도해 주세요.';
    }
    if (error.status === 401) return '로그인이 끝났습니다. 다시 로그인해 주세요.';
    if (error.serverMessage) return error.serverMessage;
    return `회원 정보를 저장하지 못했습니다 (오류 ${error.status}). 잠시 뒤 다시 시도해 주세요.`;
  }
  // fetch 자체가 실패: 서버가 꺼져 있거나 주소(VITE_API_BASE_URL) · CORS 설정이 맞지 않는다
  return '서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.';
}
