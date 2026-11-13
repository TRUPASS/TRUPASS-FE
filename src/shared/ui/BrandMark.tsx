import airlines from '@/assets/brands/airlines.json';
import { asset } from '@/shared/lib/assets';
import { BRANDS, type BrandKey } from './brands';

/**
 * 회사 마크 (요금 조회처 · 지도 · 후기 사이트). 연동을 가정한 예시이며 실제 제휴 관계를 뜻하지 않는다.
 * 그리는 방법은 마크마다 다르다: 가로로 긴 워드마크는 글자 띠만 잘라 넓게, 색이 옅은 마크는 회사 색 바탕 위에 올린다.
 */
export function BrandMark({ name, size = 16 }: { name: BrandKey; size?: number }) {
  const b = BRANDS[name];
  const cls = `bm bm-${name}`;
  if (b.box) {
    const [, , bw = 24, bh = 24] = b.box.split(' ').map(Number);
    const h = Math.round(size * 0.75);
    return (
      <svg
        className={cls}
        aria-hidden="true"
        width={Math.round((h * bw) / bh)}
        height={h}
        viewBox={b.box}
      >
        <path d={b.path} />
      </svg>
    );
  }
  if (b.tile) {
    return (
      <svg className={cls} aria-hidden="true" width={size} height={size} viewBox="0 0 24 24">
        <rect className="t" width="24" height="24" rx={b.tile === 'round' ? 12 : 5.5} />
        <path
          className={b.ink === 'light' ? 'g-l' : 'g-d'}
          transform={`translate(12 12) scale(${b.scale}) translate(-12 -12)`}
          d={b.path}
        />
      </svg>
    );
  }
  return (
    <svg className={cls} aria-hidden="true" width={size} height={size} viewBox="0 0 24 24">
      <path d={b.path} />
    </svg>
  );
}

/** 마크 + 회사 이름 (검색 출처 표시) */
export function BrandSource({ name }: { name: BrandKey }) {
  return (
    <span className="src">
      <BrandMark name={name} />
      <span className="nm">{BRANDS[name].label}</span>
    </span>
  );
}

export type AirlineKey = keyof typeof airlines;

/**
 * 항공사 로고. 이름은 옆에 글자로 따로 적으므로 대체 글은 비운다.
 * 높이는 정해 둔 화면 크기로 못 박는다. 그림의 비율대로 다시 잡히면(16 → 16.03) 그 아래 줄들이 소수점만큼 밀린다.
 */
export function AirlineLogo({ name }: { name: AirlineKey }) {
  const a = airlines[name];
  return (
    <img
      className="al"
      src={asset(`brands/${name}.svg`)}
      width={a.w}
      height={a.h}
      alt=""
      style={{ height: a.h }}
    />
  );
}

/** Google 버튼용 G 마크 (Google 브랜드 가이드의 표준 4색 마크) */
export function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
