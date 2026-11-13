import { delay, http, HttpResponse, type JsonBodyType } from 'msw';
import type { Schemas } from '@/shared/api/client';
import { MOCK_SCENARIO_PARAM } from '@/shared/api/client';
import { mockDb, type MockUser } from './db';
import { ACCESS_TTL_S, REFRESH_TTL_S, accountFromIdToken, failure, ok } from './fixtures/auth';
import { buildCheckoutSnapshot, parseMockScenario, type MockScenario } from './fixtures/checkout';
import { packageOptionsFixture } from './fixtures/packages';
import { INTEREST_ORDER, checkProfile } from './fixtures/profile';

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

/** GET /users/me 와 로그인 응답의 user. 회원 정보 입력 전에는 닉네임 등이 null 이고 profileCompleted 가 false 다 */
function me(user: MockUser) {
  const p = user.profile;
  return {
    userId: user.userId,
    email: user.email,
    name: user.name,
    pictureUrl: null,
    nickname: p?.nickname ?? null,
    birthYear: p?.birthYear ?? null,
    gender: p?.gender ?? null,
    interests: p
      ? [...p.interests].sort((a, b) => INTEREST_ORDER.indexOf(a) - INTEREST_ORDER.indexOf(b))
      : [],
    agreements: {
      termsOfService: p?.agreements.termsOfService ?? false,
      privacyCollection: p?.agreements.privacyCollection ?? false,
      marketing: p?.agreements.marketing ?? false,
      marketingAgreedAt: p?.marketingAgreedAt ?? null,
    },
    profileCompleted: p !== undefined,
    createdAt: user.createdAt,
  };
}

const json = (body: JsonBodyType, status = 200) => HttpResponse.json(body, { status });

/** Authorization 의 access token 으로 로그인한 사람을 찾는다. 없거나 틀리면 백엔드와 같은 401 · 404 응답을 돌려준다 */
function signedIn(request: Request): MockUser | Response {
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

export function createHandlers({ forceScenario }: { forceScenario?: MockScenario } = {}) {
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
      const user = signedIn(request);
      if (user instanceof Response) return user;
      return json(ok(me(user)));
    }),

    // ── 회원 정보 입력 · 수정 (백엔드 UserController 와 같은 규칙) ──
    http.put(api('/users/me/profile'), async ({ request }) => {
      const user = signedIn(request);
      if (user instanceof Response) return user;
      const checked = checkProfile(await request.json().catch(() => null));
      if (!checked.ok) {
        return json(failure(checked.code, checked.message, checked.fields), checked.status);
      }
      await delay();
      const saved = mockDb.saveProfile(user.userId, checked.profile) ?? user;
      return json(ok(me(saved)));
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
