import { delay, http, HttpResponse, type JsonBodyType } from 'msw';
import type { Schemas } from '@/shared/api/client';
import { MOCK_SCENARIO_PARAM } from '@/shared/api/client';
import { mockDb, type MockUser } from './db';
import { ACCESS_TTL_S, REFRESH_TTL_S, accountFromIdToken, failure, ok } from './fixtures/auth';
import { buildCheckoutSnapshot, parseMockScenario, type MockScenario } from './fixtures/checkout';
import { packageOptionsFixture } from './fixtures/packages';
import {
  combinationOf,
  parseSearchScenario,
  progressOf,
  searchPhase,
  versionOf,
  type MockSearch,
  type SearchScenario,
} from './fixtures/search';

// baseUrl(호스트)에 상관없이 매칭되도록 `*` 를 앞에 둔다.
const api = (path: string) => `*${path}`;

function scenarioFrom(request: Request): MockScenario | undefined {
  return parseMockScenario(new URL(request.url).searchParams.get(MOCK_SCENARIO_PARAM));
}

// Mock 토큰은 사용자와 만료 시각을 그대로 담는다 (서버 쪽 저장 없이 검사할 수 있게)
let tokenSeq = 0;
function issueTokens(user: MockUser) {
  const now = Date.now();
  tokenSeq += 1;
  return {
    tokenType: 'Bearer',
    accessToken: `mock-access.${user.userId}.${now + ACCESS_TTL_S * 1000}.${tokenSeq}`,
    accessTokenExpiresIn: ACCESS_TTL_S,
    refreshToken: `mock-refresh.${user.userId}.${now + REFRESH_TTL_S * 1000}.${tokenSeq}`,
    refreshTokenExpiresIn: REFRESH_TTL_S,
  };
}

/** 'mock-access.<userId>.<만료>.<번호>' 을 읽는다. 형식이 틀렸거나 만료됐으면 null */
function readToken(token: string, kind: 'access' | 'refresh'): number | null {
  const [prefix, userId, expiresAt] = token.split('.');
  if (prefix !== `mock-${kind}` || Number(expiresAt) <= Date.now()) return null;
  const id = Number(userId);
  return Number.isInteger(id) ? id : null;
}

function me(user: MockUser) {
  return {
    userId: user.userId,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

const json = (body: JsonBodyType, status = 200) => HttpResponse.json(body, { status });

/** 로그인한 사람. 토큰이 없거나 틀렸으면 백엔드와 같은 401 응답을 돌려준다 */
function signedInUser(request: Request): MockUser | Response {
  const header = request.headers.get('Authorization') ?? '';
  if (!header.startsWith('Bearer ')) {
    return json(failure('COMMON401', '인증이 필요합니다.'), 401);
  }
  const userId = readToken(header.slice('Bearer '.length), 'access');
  if (userId === null) {
    return json(failure('COMMON401_1', 'access token이 올바르지 않거나 만료됐습니다.'), 401);
  }
  return mockDb.findUser(userId) ?? json(failure('USER404_1', '사용자를 찾을 수 없습니다.'), 404);
}

const SENTENCE_FIELDS = ['flightSentence', 'staySentence', 'experienceSentence'] as const;
const SENTENCE_MAX = 500;

/** 검색 문장 검사 (백엔드의 @NotBlank · @Size(max = 500) 와 같은 규칙과 메시지) */
function sentenceErrors(body: unknown): Record<string, string> | null {
  const errors: Record<string, string> = {};
  const record = (body ?? {}) as Record<string, unknown>;
  for (const field of SENTENCE_FIELDS) {
    const value = record[field];
    if (typeof value !== 'string' || !value.trim()) errors[field] = '공백일 수 없습니다';
    else if (value.length > SENTENCE_MAX)
      errors[field] = `크기가 0에서 ${SENTENCE_MAX} 사이여야 합니다`;
  }
  return Object.keys(errors).length ? errors : null;
}

/** 주소의 검색 · 버전을 찾는다. 없거나 내 검색이 아니면 404 */
function ownSearch(
  request: Request,
  params: Record<string, string | readonly string[] | undefined>,
): MockSearch | Response {
  const user = signedInUser(request);
  if (user instanceof Response) return user;
  const search = mockDb.findSearch(Number(params.searchId));
  if (!search || search.userId !== user.userId) {
    return json(failure('SEARCH404_1', '검색을 찾을 수 없습니다.'), 404);
  }
  if (Number(params.versionNo) !== search.versionNo) {
    return json(failure('SEARCH404_2', '검색 버전을 찾을 수 없습니다.'), 404);
  }
  return search;
}

export function createHandlers({
  forceScenario,
  searchScenario,
}: { forceScenario?: MockScenario; searchScenario?: SearchScenario } = {}) {
  return [
    // ── 로그인 (백엔드 AuthController 와 같은 규칙) ──
    http.post(api('/auth/google'), async ({ request }) => {
      const body = (await request.json().catch(() => null)) as { idToken?: string } | null;
      if (!body?.idToken?.trim()) {
        return json(
          failure('COMMON400_1', '입력값이 올바르지 않습니다.', { idToken: '공백일 수 없습니다' }),
          400,
        );
      }
      const account = accountFromIdToken(body.idToken);
      if (!account) return json(failure('AUTH401_1', 'Google 인증 정보가 올바르지 않습니다.'), 401);
      if (!account.emailVerified) {
        return json(failure('AUTH401_2', 'Google 계정 이메일이 인증되지 않았습니다.'), 401);
      }
      await delay();
      const { user, newUser } = mockDb.signIn(account);
      return json(ok({ tokens: issueTokens(user), user: me(user), newUser }));
    }),

    http.post(api('/auth/refresh'), async ({ request }) => {
      const body = (await request.json().catch(() => null)) as { refreshToken?: string } | null;
      const token = body?.refreshToken ?? '';
      const userId = readToken(token, 'refresh');
      const user = userId === null ? undefined : mockDb.findUser(userId);
      if (!user || !mockDb.useRefreshToken(token)) {
        return json(failure('AUTH401_3', 'refresh token이 올바르지 않거나 만료됐습니다.'), 401);
      }
      return json(ok(issueTokens(user)));
    }),

    http.post(api('/auth/logout'), async ({ request }) => {
      const body = (await request.json().catch(() => null)) as { refreshToken?: string } | null;
      if (body?.refreshToken) mockDb.useRefreshToken(body.refreshToken);
      return json(ok());
    }),

    http.get(api('/users/me'), ({ request }) => {
      const user = signedInUser(request);
      return user instanceof Response ? user : json(ok(me(user)));
    }),

    // ── 검색 (계약: 팀 Notion "엔드포인트" DB, B1 · B2). 진행 상태는 시작한 뒤 흐른 시간으로 정한다 ──
    http.post(api('/searches'), async ({ request }) => {
      const user = signedInUser(request);
      if (user instanceof Response) return user;
      const scenario =
        searchScenario ??
        parseSearchScenario(new URL(request.url).searchParams.get(MOCK_SCENARIO_PARAM));
      if (scenario === 'rateLimited') {
        // 코드 이름은 백엔드 B1 에서 정해진다 (아직 확정 전)
        return json(
          failure('SEARCH429_1', '검색 요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.'),
          429,
        );
      }
      const body = (await request.json().catch(() => null)) as Record<string, string> | null;
      const errors = sentenceErrors(body);
      if (errors || !body) {
        return json(failure('COMMON400_1', '입력값이 올바르지 않습니다.', errors ?? {}), 400);
      }
      await delay();
      const search = mockDb.createSearch({
        userId: user.userId,
        flightSentence: body.flightSentence!,
        staySentence: body.staySentence!,
        experienceSentence: body.experienceSentence!,
        scenario,
        startedAt: Date.now(),
      });
      const { status, progressStep, startedAt } = progressOf(search, search.startedAt);
      return json(
        ok({
          searchId: search.searchId,
          versionNo: search.versionNo,
          status,
          progressStep,
          startedAt,
        }),
      );
    }),

    http.get(api('/searches/:searchId/versions/:versionNo/progress'), ({ request, params }) => {
      const search = ownSearch(request, params);
      return search instanceof Response ? search : json(ok(progressOf(search, Date.now())));
    }),

    http.post(
      api('/searches/:searchId/versions/:versionNo/cancel'),
      async ({ request, params }) => {
        const search = ownSearch(request, params);
        if (search instanceof Response) return search;
        const now = Date.now();
        if (searchPhase(search, now).status !== 'IN_PROGRESS') {
          return json(failure('SEARCH409_2', '이미 끝난 검색입니다.'), 409);
        }
        await delay();
        mockDb.updateSearch(search.searchId, { canceledAt: now });
        return json(
          ok({ searchId: search.searchId, versionNo: search.versionNo, status: 'CANCELED' }),
        );
      },
    ),

    http.get(api('/searches/:searchId/versions/:versionNo/combination'), ({ request, params }) => {
      const search = ownSearch(request, params);
      if (search instanceof Response) return search;
      const combination = combinationOf(search, Date.now());
      return combination
        ? json(ok(combination))
        : json(failure('COMBINATION404_1', '검색이 끝나지 않았거나 결과가 없습니다.'), 404);
    }),

    http.get(api('/searches/:searchId/versions/:versionNo'), ({ request, params }) => {
      const search = ownSearch(request, params);
      return search instanceof Response ? search : json(ok(versionOf(search, Date.now())));
    }),

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
