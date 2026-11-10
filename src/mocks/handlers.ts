import { delay, http, HttpResponse } from 'msw';
import type { Schemas } from '@/shared/api/client';
import { MOCK_SCENARIO_PARAM } from '@/shared/api/client';
import { mockDb } from './db';
import { buildCheckoutSnapshot, parseMockScenario, type MockScenario } from './fixtures/checkout';
import { packageOptionsFixture } from './fixtures/packages';

// baseUrl(호스트)에 상관없이 매칭되도록 `*` 를 앞에 둔다.
const api = (path: string) => `*${path}`;

function scenarioFrom(request: Request): MockScenario | undefined {
  return parseMockScenario(new URL(request.url).searchParams.get(MOCK_SCENARIO_PARAM));
}

export function createHandlers({ forceScenario }: { forceScenario?: MockScenario } = {}) {
  return [
    http.post(api('/api/trip-requests'), async ({ request }) => {
      const body = (await request.json()) as Schemas['CreateTripRequestBody'];
      if (!body?.message?.trim()) {
        return HttpResponse.json({ message: 'message is required' }, { status: 400 });
      }
      await delay();
      return HttpResponse.json<Schemas['CreateTripRequestResponse']>(
        { requestId: mockDb.nextId('req') },
        { status: 201 },
      );
    }),

    http.get(api('/api/trip-requests/:requestId/packages'), async () => {
      await delay();
      return HttpResponse.json<Schemas['PackageOption'][]>(packageOptionsFixture);
    }),

    http.post(api('/api/checkouts'), async ({ request }) => {
      const body = (await request.json()) as Schemas['CreateCheckoutBody'];
      const checkoutId = mockDb.nextId('chk');
      mockDb.saveCheckout(checkoutId, {
        packageId: body.packageId,
        scenario: forceScenario ?? scenarioFrom(request) ?? 'SUCCESS',
        ticks: 0,
      });
      await delay();
      return HttpResponse.json<Schemas['CreateCheckoutResponse']>({ checkoutId }, { status: 201 });
    }),

    http.post(api('/api/checkouts/:checkoutId/mandate'), async () => {
      // TODO: 패스키 서명 형식이 정해지면 body 를 검증한다.
      await delay();
      return new HttpResponse(null, { status: 204 });
    }),

    http.get(api('/api/checkouts/:checkoutId'), ({ params, request }) => {
      const checkoutId = String(params.checkoutId);
      // 직접 URL 로 들어온 경우(새로고침 등)에도 동작하도록 없으면 만든다.
      const checkout =
        mockDb.getCheckout(checkoutId) ??
        mockDb.saveCheckout(checkoutId, { packageId: 'unknown', scenario: 'SUCCESS', ticks: 0 });

      // ?mockScenario= 로 언제든 시나리오를 바꿀 수 있다.
      checkout.scenario = forceScenario ?? scenarioFrom(request) ?? checkout.scenario;
      const snapshot = buildCheckoutSnapshot(checkout.scenario, checkout.ticks);
      checkout.ticks += 1;

      return HttpResponse.json<Schemas['CheckoutStatusResponse']>(snapshot);
    }),
  ];
}

export const handlers = createHandlers();
