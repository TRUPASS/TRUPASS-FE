// 검색 중 · 결과 화면이 백엔드 값을 글로 바꿀 때 쓴다. 값을 계산하지 않고 보여 주는 모양만 정한다.
import { ApiError } from '@/shared/api/client';
import type { SearchProgress } from '@/shared/api/queries/searches';

/** 실패 이유를 받지 못했을 때 보여 주는 안내 */
export const SEARCH_FAILED_TEXT = '검색하지 못했습니다. 문장을 고쳐 다시 시도해 주세요.';
export const SEARCH_CANCELED_TEXT = '검색을 취소했습니다.';

/** 백엔드 오류면 백엔드가 보낸 문장, 아니면 fallback */
export function apiErrorText(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.serverMessage ? error.serverMessage : fallback;
}

/**
 * FAILED 일 때 보여 줄 문장. 백엔드가 failureReason(사용자에게 보여 줄 한국어 문장)을 주면 그 문장, 없으면 기본 안내.
 * failureReason 은 아직 계약에 없다. 백엔드가 추가를 제안할 예정이라 있으면 읽기만 한다.
 */
export function failureText(progress: SearchProgress): string {
  const reason = (progress as { failureReason?: unknown }).failureReason;
  return typeof reason === 'string' && reason.trim() ? reason.trim() : SEARCH_FAILED_TEXT;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** "2026-12-18" → "12.18 (금)". 형식이 다르면 받은 그대로 둔다 */
export function shortDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return date;
  const [, y, mo, d] = m;
  const day = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d))).getUTCDay();
  return `${mo}.${d} (${DAYS[day]})`;
}

/** 출발일: 두 값이 같으면 하루, 다르면 범위 */
export function dateText(from?: string | null, to?: string | null): string | null {
  const a = from || to;
  const b = to || from;
  if (!a || !b) return null;
  return a === b ? shortDate(a) : `${shortDate(a)} ~ ${shortDate(b)}`;
}

const BANDS: [from: string, to: string, name: string][] = [
  ['06:00', '12:00', '오전'],
  ['12:00', '18:00', '오후'],
  ['18:00', '23:59', '저녁'],
];
const hm = (time: string) => time.slice(0, 5); // "06:00:00" 으로 와도 시 · 분만 쓴다

/** 출발 시간대: "오전 06:00 ~ 12:00". 정해진 시간대가 아니면 시각만, 말하지 않았으면(null) null */
export function timeText(from?: string | null, to?: string | null): string | null {
  if (!from || !to) return null;
  const range = `${hm(from)} ~ ${hm(to)}`;
  const band = BANDS.find(([a, b]) => a === hm(from) && b === hm(to));
  return band ? `${band[2]} ${range}` : range;
}

/** 진행 상태에서 읽은 여행 조건 한 줄: 출발일 · 시간대 · 인원 · 숙박. 아직 모르면 빈 배열 */
export function tripFacts(p: SearchProgress | undefined): string[] {
  if (!p) return [];
  const date = dateText(p.departDateFrom, p.departDateTo);
  return [
    date && `${date} 출발`,
    timeText(p.departTimeFrom, p.departTimeTo),
    p.adultCount != null ? `성인 ${p.adultCount}명` : null,
    p.nights != null ? `${p.nights}박` : null,
  ].filter((v): v is string => Boolean(v));
}

/** 받침에 맞춘 '으로/로'. ㄹ 받침은 '로'다. 한글이 아니면 '(으)로' */
export function withRo(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  if (Number.isNaN(code) || code < 0xac00 || code > 0xd7a3) return `${word}(으)로`;
  const final = (code - 0xac00) % 28;
  return `${word}${final === 0 || final === 8 ? '로' : '으로'}`;
}

/** 출처 이름들: "Duffel · LiteAPI". 로고가 없는 이름이라 글자로만 보여 준다 */
export const providerText = (names: readonly string[] | undefined) =>
  (names ?? []).filter(Boolean).join(' · ');

/** 서버 시각(UTC)을 한국 시각 "14:02" 로 */
export function clockText(iso: string | null | undefined): string {
  if (!iso) return '';
  const time = new Date(iso);
  if (Number.isNaN(time.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Seoul',
  }).format(time);
}
