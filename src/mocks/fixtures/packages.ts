import type { Schemas } from '@/shared/api/client';

type PackageOption = Schemas['PackageOption'];

/** 백엔드가 내려줄 법한 패키지 후보. 금액은 "백엔드 계산 값"이라는 가정으로 고정값을 둔다. */
export const packageOptionsFixture: PackageOption[] = [
  {
    packageId: 'pkg-osaka-standard',
    title: '오사카 2박 3일 · 스탠다드',
    totalAmount: 750_000,
    currency: 'KRW',
    items: [
      {
        offerId: 'offer-flight-001',
        merchant: '스카이브릿지 항공',
        type: 'FLIGHT',
        name: '인천 ⇄ 간사이 왕복 (이코노미)',
        amount: 410_000,
      },
      {
        offerId: 'offer-stay-001',
        merchant: '난바 리버사이드 호텔',
        type: 'STAY',
        name: '난바 리버사이드 호텔 2박 (더블룸)',
        amount: 280_000,
      },
      {
        offerId: 'offer-exp-001',
        merchant: '간사이 로컬 투어',
        type: 'EXPERIENCE',
        name: '도톤보리 푸드 워킹 투어',
        amount: 60_000,
      },
    ],
  },
  {
    packageId: 'pkg-osaka-budget',
    title: '오사카 2박 3일 · 실속형',
    totalAmount: 590_000,
    currency: 'KRW',
    items: [
      {
        offerId: 'offer-flight-002',
        merchant: '스카이브릿지 항공',
        type: 'FLIGHT',
        name: '인천 ⇄ 간사이 왕복 (특가)',
        amount: 330_000,
      },
      {
        offerId: 'offer-stay-002',
        merchant: '우메다 스테이',
        type: 'STAY',
        name: '우메다 스테이 2박 (트윈룸)',
        amount: 210_000,
      },
      {
        offerId: 'offer-exp-002',
        merchant: '간사이 로컬 투어',
        type: 'EXPERIENCE',
        name: '오사카성 가이드 투어',
        amount: 50_000,
      },
    ],
  },
  {
    packageId: 'pkg-osaka-premium',
    title: '오사카 2박 3일 · 프리미엄',
    totalAmount: 1_120_000,
    currency: 'KRW',
    items: [
      {
        offerId: 'offer-flight-003',
        merchant: '스카이브릿지 항공',
        type: 'FLIGHT',
        name: '인천 ⇄ 간사이 왕복 (비즈니스)',
        amount: 690_000,
      },
      {
        offerId: 'offer-stay-003',
        merchant: '나카노시마 그랜드',
        type: 'STAY',
        name: '나카노시마 그랜드 2박 (리버뷰)',
        amount: 360_000,
      },
      {
        offerId: 'offer-exp-003',
        merchant: '간사이 로컬 투어',
        type: 'EXPERIENCE',
        name: '교토 당일 프라이빗 투어',
        amount: 70_000,
      },
    ],
  },
];
