import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient, unwrap, type Schemas } from '../client';
import { queryKeys } from './keys';

export type CheckoutStatus = Schemas['CheckoutStatus'];

/** 더 이상 폴링하지 않아도 되는 최종 상태 */
export const TERMINAL_CHECKOUT_STATUSES: readonly CheckoutStatus[] = [
  'COMPLETED',
  'FAILED',
  'NEEDS_MANUAL_REVIEW',
];

export function isTerminalCheckoutStatus(status: CheckoutStatus | undefined): boolean {
  return status !== undefined && TERMINAL_CHECKOUT_STATUSES.includes(status);
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: async (body: Schemas['CreateCheckoutBody']) =>
      unwrap(await apiClient.POST('/api/checkouts', { body })),
  });
}

export function useCheckoutStatusQuery(checkoutId: string, pollIntervalMs: number) {
  return useQuery({
    queryKey: queryKeys.checkout(checkoutId),
    queryFn: async () =>
      unwrap(
        await apiClient.GET('/api/checkouts/{checkoutId}', {
          params: { path: { checkoutId } },
        }),
      ),
    // 최종 상태가 되면 폴링을 멈춘다.
    refetchInterval: (query) =>
      isTerminalCheckoutStatus(query.state.data?.status) ? false : pollIntervalMs,
  });
}

export function useSubmitMandate(checkoutId: string) {
  return useMutation({
    mutationFn: async (body: Schemas['SubmitMandateBody']) =>
      unwrap(
        await apiClient.POST('/api/checkouts/{checkoutId}/mandate', {
          params: { path: { checkoutId } },
          body,
        }),
      ),
  });
}
