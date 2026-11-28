/** 새 검색 화면에 띄우는 안내. 검색 중 화면에서 실패 · 취소로 돌아올 때 location.state 로 넘긴다 */
export interface SearchNotice {
  tone: 'fail' | 'info';
  text: string;
}

export const withNotice = (notice: SearchNotice) => ({ notice });

export function readNotice(state: unknown): SearchNotice | null {
  const notice = (state as { notice?: Partial<SearchNotice> } | null)?.notice;
  if (!notice || typeof notice.text !== 'string') return null;
  return notice.tone === 'fail' || notice.tone === 'info'
    ? { tone: notice.tone, text: notice.text }
    : null;
}
