// 결과 화면(API)이 백엔드 응답을 화면 모양으로 옮긴다. 금액은 받은 값을 그대로 넘기고 더하거나 빼지 않는다.
import type { CondRow, RequestRowData } from '@/features/search/RequestPanel';
import type { Combination, SearchCondition, SearchVersion } from '@/shared/api/queries/searches';
import type { PromptKey } from '@/shared/lib/prompts';
import type { SummaryLine } from './SummaryPanel';

const CATEGORY: Record<SearchCondition['category'], PromptKey> = {
  FLIGHT: 'flight',
  STAY: 'stay',
  EXPERIENCE: 'exp',
};

const condRow = (c: SearchCondition): CondRow => ({
  key: String(c.conditionId),
  name: c.label,
  value: c.value,
  mark: c.note ?? (c.changed ? '변경' : undefined),
  changed: c.changed,
});

/** 요청 표: 문장 세 개와, category 로 나눠 sortOrder 순서로 늘어놓은 조건 */
export function requestRows(v: SearchVersion): Record<PromptKey, RequestRowData> {
  const rows: Record<PromptKey, RequestRowData> = {
    flight: { sentence: v.flightSentence, conds: [] },
    stay: { sentence: v.staySentence, conds: [] },
    exp: { sentence: v.experienceSentence, conds: [] },
  };
  [...v.conditions]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .forEach((c) => {
      const key = CATEGORY[c.category] as PromptKey | undefined;
      if (key) rows[key].conds.push(condRow(c));
    });
  return rows;
}

const CABIN: Record<string, string> = {
  ECONOMY: '이코노미',
  PREMIUM_ECONOMY: '프리미엄 이코노미',
  BUSINESS: '비즈니스',
  FIRST: '퍼스트',
};

/** 합계 옆에 적는 인원. 성인 수를 알면 "성인 2명", 모르면 탑승 인원 "2명" */
export function paxText(c: Combination, adults?: number | null): string {
  return adults != null ? `성인 ${adults}명` : `${c.flight.passengerCount}명`;
}

/** [선택한 조합]: 줄마다 서버가 준 금액, 합계는 totalAmount, 예산 대비는 budgetGap 을 그대로 쓴다 */
export function summaryOf(c: Combination, adults?: number | null) {
  const pax = paxText(c, adults);
  const lines: SummaryLine[] = [
    {
      k: '항공권',
      t: `${c.flight.airlineName} ${c.flight.outboundFlightNo} / ${c.flight.inboundFlightNo}`,
      s: `${CABIN[c.flight.cabinClass] ?? c.flight.cabinClass}, ${pax} 왕복`,
      p: c.flightAmount,
    },
    {
      k: '숙소',
      t: c.stay.hotelName,
      s: `${c.stay.roomType}, ${c.stay.nights}박, ${c.stay.breakfastIncluded ? '조식 포함' : '조식 불포함'}`,
      p: c.stayAmount,
    },
  ];
  // 추가 선택(수하물 · 조식)은 아직 고를 수 없어 늘 0원이다. 서버가 금액을 주면 그 줄만 보인다
  if (c.addonAmount > 0) lines.push({ k: '추가', t: '추가 선택', s: '', p: c.addonAmount });
  return { pax, sum: { lines, total: c.totalAmount, left: c.budgetGap ?? null } };
}
