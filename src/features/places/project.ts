// 지도 그림 위에 핀을 놓는 자리 계산. 지도 그림은 OSM 타일을 이어 붙인 것이고,
// 그림의 크기와 왼쪽 위 모서리의 좌표(웹 메르카토르, 타일 화소 단위)는 assets/map/meta.json 에 있다.
import meta from '@/assets/map/meta.json';

interface MapMeta {
  /** 확대 단계 */
  z: number;
  w: number;
  h: number;
  x0: number;
  y0: number;
}
const MAPS: Record<string, MapMeta> = meta;

/** 위경도 → 지도 그림 안의 자리(%). key 는 지도 그림의 이름(ueno, ueno_m). */
export function project(key: string, lat: number, lon: number): { left: string; top: string } {
  const m = MAPS[key];
  if (!m) throw new Error(`unknown map: ${key}`);
  const n = 2 ** m.z * 256;
  const x = ((lon + 180) / 360) * n - m.x0;
  const y = ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n - m.y0;
  return { left: `${((x / m.w) * 100).toFixed(2)}%`, top: `${((y / m.h) * 100).toFixed(2)}%` };
}
