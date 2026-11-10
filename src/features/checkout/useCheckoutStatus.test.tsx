import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createHandlers } from '@/mocks/handlers';
import { server } from '@/test/server';
import { useCheckoutStatus } from './useCheckoutStatus';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useCheckoutStatus', () => {
  it('폴링하며 단계가 진행되고 COMPLETED 에서 멈춘다', async () => {
    const seen: string[] = [];
    const { result } = renderHook(
      () => {
        const query = useCheckoutStatus('chk-test-ok', { pollIntervalMs: 10 });
        const status = query.data?.status;
        if (status && seen.at(-1) !== status) seen.push(status);
        return query;
      },
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.data?.status).toBe('COMPLETED'), { timeout: 3000 });

    expect(seen).toEqual(['SIGNED', 'IN_PROGRESS', 'COMPLETED']);
    expect(result.current.isTerminal).toBe(true);
    expect(result.current.data?.steps.every((s) => s.state === 'SUCCEEDED')).toBe(true);
  });

  it('숙소 SOLD_OUT 시나리오에서는 보상 후 FAILED 로 끝난다', async () => {
    server.use(...createHandlers({ forceScenario: 'SOLD_OUT' }));

    const { result } = renderHook(
      () => useCheckoutStatus('chk-test-fail', { pollIntervalMs: 10 }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(result.current.data?.status).toBe('FAILED'), { timeout: 3000 });

    const steps = result.current.data?.steps ?? [];
    expect(steps.some((s) => s.step === 'HOLD' && s.state === 'FAILED')).toBe(true);
    expect(steps.some((s) => s.state === 'COMPENSATED')).toBe(true);
  });
});
