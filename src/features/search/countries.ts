// 지구본은 나라를 ISO 3166-1 숫자 코드로 찾고(지도 데이터의 id), 검색 API 는 alpha-2(KR, JP)를 준다. 그 사이를 잇는 표.
// 지금 백엔드가 지원하는 나라만 넣었다. 표에 없는 나라는 칠하지 않는다.
import type { LivePlace } from './globe';

interface GlobeCountry {
  /** ISO 3166-1 숫자 코드 */
  id: string;
  /** 지도 데이터(110m)에 도형이 없는 나라만: 도형의 중심 대신 쓰는 좌표 [경도, 위도] */
  at?: [number, number];
}

export const GLOBE_COUNTRIES: Record<string, GlobeCountry> = {
  KR: { id: '410' },
  JP: { id: '392' },
  TH: { id: '764' },
  TW: { id: '158' },
  HK: { id: '344', at: [114.17, 22.32] },
  SG: { id: '702', at: [103.82, 1.35] },
  VN: { id: '704' },
};

/** 지구본에 놓을 나라 하나. 코드를 모르면(아직 문장 해석 전) null, 표에 없는 코드면 이름표만 있고 칠하지 않는다 */
export function globePlace(code: string | null | undefined, label: string): LivePlace | null {
  if (!code) return null;
  const country = GLOBE_COUNTRIES[code.toUpperCase()];
  return { id: country?.id, at: country?.at, label };
}
