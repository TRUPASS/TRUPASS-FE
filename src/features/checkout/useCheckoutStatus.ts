import { isTerminalCheckoutStatus, useCheckoutStatusQuery } from '@/shared/api/queries/checkouts';

export const DEFAULT_CHECKOUT_POLL_INTERVAL_MS = 1500;

/**
 * 백엔드 Saga(HOLD → COLLECT → PAY → CONFIRM) 진행 상태를 폴링한다.
 * COMPLETED / FAILED / NEEDS_MANUAL_REVIEW 가 되면 폴링을 멈춘다.
 */
export function useCheckoutStatus(
  checkoutId: string,
  { pollIntervalMs = DEFAULT_CHECKOUT_POLL_INTERVAL_MS }: { pollIntervalMs?: number } = {},
) {
  const query = useCheckoutStatusQuery(checkoutId, pollIntervalMs);
  return {
    ...query,
    isTerminal: isTerminalCheckoutStatus(query.data?.status),
  };
}
