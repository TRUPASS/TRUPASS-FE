import type { Schemas } from '@/shared/api/client';

type CheckoutStatusResponse = Schemas['CheckoutStatusResponse'];
type CheckoutStepStatus = Schemas['CheckoutStepStatus'];

/**
 * Mock 체크아웃 시나리오
 * - SUCCESS: 모든 단계 성공 → COMPLETED
 * - SOLD_OUT: 숙소 HOLD 실패(매진) → 항공 HOLD 보상 → FAILED
 * - MANUAL_REVIEW: 숙소 PAY 실패 후 보상 불가 → NEEDS_MANUAL_REVIEW
 */
export const MOCK_SCENARIOS = ['SUCCESS', 'SOLD_OUT', 'MANUAL_REVIEW'] as const;
export type MockScenario = (typeof MOCK_SCENARIOS)[number];

export function parseMockScenario(value: string | null | undefined): MockScenario | undefined {
  return MOCK_SCENARIOS.find((s) => s === value?.toUpperCase());
}

const FLIGHT = '스카이브릿지 항공';
const STAY = '난바 리버사이드 호텔';
const EXPERIENCE = '간사이 로컬 투어';
const TRUPASS = 'TRUPASS';

/** Saga 단계 순서. 폴링 1회마다 한 단계씩 진행된다. */
const STEP_PLAN: Pick<CheckoutStepStatus, 'merchant' | 'step'>[] = [
  { merchant: FLIGHT, step: 'HOLD' },
  { merchant: STAY, step: 'HOLD' },
  { merchant: EXPERIENCE, step: 'HOLD' },
  { merchant: TRUPASS, step: 'COLLECT' },
  { merchant: FLIGHT, step: 'PAY' },
  { merchant: STAY, step: 'PAY' },
  { merchant: EXPERIENCE, step: 'PAY' },
  { merchant: FLIGHT, step: 'CONFIRM' },
  { merchant: STAY, step: 'CONFIRM' },
  { merchant: EXPERIENCE, step: 'CONFIRM' },
];

function pendingSteps(): CheckoutStepStatus[] {
  return STEP_PLAN.map((s) => ({ ...s, state: 'PENDING' }));
}

function succeedFirst(steps: CheckoutStepStatus[], count: number) {
  steps.slice(0, count).forEach((s) => (s.state = 'SUCCEEDED'));
}

/**
 * `tick` 번째 조회(0부터) 시점의 체크아웃 상태를 만든다.
 * tick 0 은 서명 직후(SIGNED) 상태다.
 */
export function buildCheckoutSnapshot(
  scenario: MockScenario,
  tick: number,
): CheckoutStatusResponse {
  const steps = pendingSteps();
  if (tick <= 0) return { status: 'SIGNED', steps };

  switch (scenario) {
    case 'SUCCESS': {
      const done = Math.min(tick, steps.length);
      succeedFirst(steps, done);
      return { status: done < steps.length ? 'IN_PROGRESS' : 'COMPLETED', steps };
    }
    case 'SOLD_OUT': {
      // [0] 항공 HOLD 성공 → [1] 숙소 HOLD 실패 → 항공 HOLD 보상
      succeedFirst(steps, 1);
      if (tick === 1) return { status: 'IN_PROGRESS', steps };
      steps[1]!.state = 'FAILED';
      if (tick === 2) return { status: 'COMPENSATING', steps };
      steps[0]!.state = 'COMPENSATED';
      return { status: 'FAILED', steps };
    }
    case 'MANUAL_REVIEW': {
      // HOLD·COLLECT·항공 PAY 까지 성공 → [5] 숙소 PAY 실패 → 보상 실패로 운영자 확인
      const done = Math.min(tick, 5);
      succeedFirst(steps, done);
      if (tick <= 5) return { status: 'IN_PROGRESS', steps };
      steps[5]!.state = 'FAILED';
      if (tick === 6) return { status: 'COMPENSATING', steps };
      return { status: 'NEEDS_MANUAL_REVIEW', steps };
    }
  }
}
