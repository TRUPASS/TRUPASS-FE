/** 닉네임 글자 수. 백엔드(@Size)와 화면의 글자 수 표시처럼 UTF-16 단위로 센다 */
export const NICK_MIN = 2;
export const NICK_MAX = 12;

/**
 * 닉네임 칸에 미리 채울 값. 백엔드와 같은 단위(UTF-16)로 12자까지 자르되 이모지 같은 글자를 반으로 가르지 않는다.
 * 잘라서 2자가 안 되면 비워 둔다. 스크립트로 넣은 값은 브라우저의 글자 수 검사를 거치지 않으므로, 서버가 거절할 값을 미리 넣지 않는다.
 */
export function prefillNickname(source: string): string {
  let out = '';
  // 백엔드는 제어 문자(줄바꿈 등)가 든 닉네임을 거절하므로 지우고 채운다
  // eslint-disable-next-line no-control-regex
  for (const ch of source.replace(/[\x00-\x1F\x7F]/g, '').trim()) {
    if (out.length + ch.length > NICK_MAX) break;
    out += ch;
  }
  out = out.trim();
  return out.length >= NICK_MIN ? out : '';
}
