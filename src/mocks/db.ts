import type { MockScenario } from './fixtures/checkout';

interface MockCheckout {
  packageId: string;
  scenario: MockScenario;
  /** GET /api/checkouts/{id} 호출 횟수 */
  ticks: number;
}

/** 브라우저 탭(또는 테스트) 메모리에만 있는 Mock 상태. 새로고침하면 초기화된다. */
const checkouts = new Map<string, MockCheckout>();
let sequence = 0;

export const mockDb = {
  nextId(prefix: string) {
    sequence += 1;
    return `${prefix}-${Date.now().toString(36)}-${sequence}`;
  },
  getCheckout(id: string) {
    return checkouts.get(id);
  },
  saveCheckout(id: string, checkout: MockCheckout) {
    checkouts.set(id, checkout);
    return checkout;
  },
};

export function resetMockDb() {
  checkouts.clear();
  sequence = 0;
}
