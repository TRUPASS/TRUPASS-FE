// 흐름 검사가 백엔드(core) 대신 응답한다. 규칙은 백엔드 코드와 같다.
//   POST /auth/google  — ID 토큰 검증 → 처음이면 가입(newUser) → 토큰 쌍 (AuthService · UserService)
//   POST /auth/refresh — refresh token 은 한 번만 쓴다. 이미 쓴 것이 오면 그 사람의 것을 모두 폐기한다 (RefreshTokenService)
//   POST /auth/logout  — refresh token 폐기
//   GET  /users/me     — 토큰이 없으면 COMMON401, 틀렸거나 만료됐으면 COMMON401_1
//   검색(계약 B1 · B2) — POST /searches · GET …/progress · POST …/cancel · GET …/versions/{n} · GET …/combination
//                       진행 상태는 시작한 뒤 흐른 시간으로 정한다 (흐름 검사가 오래 걸리지 않게 단계마다 1.5초)
// 응답은 모두 {isSuccess, code, message, result} 형식이고, 다른 출처(origin)에서 부르므로 CORS 머리글을 붙인다.

// 가짜 ID 토큰 'fake:<이름>' 이 가리키는 Google 계정
const ACCOUNTS = {
  traveler: { email: 'traveler@example.com', name: '여행자', emailVerified: true },
  unverified: { email: 'unverified@example.com', name: '미인증', emailVerified: false },
};

// 검색 진행 시간표 (시작 뒤 ms). 폴링 간격(1.5초)과 엇갈리게 두어 단계마다 한 번은 보이게 한다
const STEP_AT = [
  [1000, 'PARSING'],
  [2500, 'FLIGHT'],
  [4000, 'STAY'],
  [5500, 'SUMMARY'],
];
const TRIP = {
  originCountry: '대한민국',
  destinationCountry: '일본',
  originCountryCode: 'KR',
  destinationCountryCode: 'JP',
  destinationCity: '오사카',
  departDateFrom: '2027-01-09',
  departDateTo: '2027-01-09',
  departTimeFrom: null,
  departTimeTo: null,
  adultCount: 2,
  nights: 2,
};
const iso = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');

/** 검색 하나의 지금 상태 */
function phase(search, now) {
  if (search.canceledAt) return { status: 'CANCELED', step: 'FLIGHT', endedAt: search.canceledAt };
  const t = now - search.startedAt;
  const step = STEP_AT.find(([until]) => t < until)?.[1];
  return step
    ? { status: 'IN_PROGRESS', step }
    : { status: 'COMPLETED', step: 'SUMMARY', endedAt: search.startedAt + STEP_AT.at(-1)[0] };
}

export function createFakeBackend() {
  const users = new Map(); // 계정 이름 → 사용자
  const access = new Map(); // access token → userId
  const refresh = new Map(); // refresh token → { userId, revoked }
  /** 받은 요청 ('GET /users/me (토큰)' 처럼). preflight(OPTIONS)는 적지 않는다 */
  const calls = [];
  let seq = 0;
  const searches = new Map(); // searchId → 검색

  const issue = (userId) => {
    seq += 1;
    const accessToken = `fake-access-${seq}`;
    const refreshToken = `fake-refresh-${seq}`;
    access.set(accessToken, userId);
    refresh.set(refreshToken, { userId, revoked: false });
    return {
      tokenType: 'Bearer',
      accessToken,
      accessTokenExpiresIn: 1800,
      refreshToken,
      refreshTokenExpiresIn: 1_209_600,
    };
  };
  const me = (u) => ({
    userId: u.userId,
    email: u.email,
    name: u.name,
    pictureUrl: null,
    createdAt: u.createdAt,
  });

  async function handle(route) {
    const req = route.request();
    const headers = await req.allHeaders();
    const cors = {
      'access-control-allow-origin': headers.origin ?? '*',
      'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'access-control-allow-headers': headers['access-control-request-headers'] ?? '*',
      'access-control-max-age': '600',
      vary: 'Origin',
    };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });

    const path = new URL(req.url()).pathname;
    const bearer = (headers.authorization ?? '').replace(/^Bearer /, '');
    calls.push(`${req.method()} ${path}${bearer ? ' (토큰)' : ''}`);
    const send = (status, body) =>
      route.fulfill({
        status,
        headers: { ...cors, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    const ok = (result) =>
      send(200, { isSuccess: true, code: 'COMMON200', message: '성공했습니다.', result });
    const fail = (status, code, message) => send(status, { isSuccess: false, code, message });
    let body = {};
    try {
      body = JSON.parse(req.postData() || '{}');
    } catch {
      body = {};
    }

    switch (`${req.method()} ${path}`) {
      case 'POST /auth/google': {
        if (!body.idToken) return fail(400, 'COMMON400_1', '입력값이 올바르지 않습니다.');
        const name = /^fake:([a-z]+)$/.exec(body.idToken)?.[1];
        const account = name && ACCOUNTS[name];
        if (!account) return fail(401, 'AUTH401_1', 'Google 인증 정보가 올바르지 않습니다.');
        if (!account.emailVerified) {
          return fail(401, 'AUTH401_2', 'Google 계정 이메일이 인증되지 않았습니다.');
        }
        let user = users.get(name);
        const newUser = !user;
        if (!user) {
          user = { userId: users.size + 1, ...account, createdAt: new Date().toISOString() };
          users.set(name, user);
        }
        return ok({ tokens: issue(user.userId), user: me(user), newUser });
      }
      case 'POST /auth/refresh': {
        const token = refresh.get(body.refreshToken);
        const invalid = () =>
          fail(401, 'AUTH401_3', 'refresh token이 올바르지 않거나 만료됐습니다.');
        if (!token) return invalid();
        if (token.revoked) {
          // 이미 쓴 토큰이 다시 왔다: 탈취로 보고 그 사람의 refresh token 을 모두 폐기한다
          for (const t of refresh.values()) if (t.userId === token.userId) t.revoked = true;
          return invalid();
        }
        token.revoked = true;
        return ok(issue(token.userId));
      }
      case 'POST /auth/logout': {
        const token = refresh.get(body.refreshToken);
        if (token) token.revoked = true;
        return send(200, { isSuccess: true, code: 'COMMON200', message: '성공했습니다.' });
      }
      case 'GET /users/me': {
        if (!bearer) return fail(401, 'COMMON401', '인증이 필요합니다.');
        const userId = access.get(bearer);
        if (!userId)
          return fail(401, 'COMMON401_1', 'access token이 올바르지 않거나 만료됐습니다.');
        return ok(me([...users.values()].find((u) => u.userId === userId)));
      }
      default:
        if (path === '/searches' || path.startsWith('/searches/')) return searchRoute();
        return fail(404, 'COMMON404', '요청한 리소스를 찾을 수 없습니다.');
    }

    // 검색: 로그인이 필요하다. 남의 검색 · 없는 버전은 404
    function searchRoute() {
      const userId = access.get(bearer);
      if (!bearer) return fail(401, 'COMMON401', '인증이 필요합니다.');
      if (!userId) return fail(401, 'COMMON401_1', 'access token이 올바르지 않거나 만료됐습니다.');
      if (req.method() === 'POST' && path === '/searches') {
        const fields = ['flightSentence', 'staySentence', 'experienceSentence'];
        if (
          fields.some((f) => typeof body[f] !== 'string' || !body[f].trim() || body[f].length > 500)
        ) {
          return fail(400, 'COMMON400_1', '입력값이 올바르지 않습니다.');
        }
        const search = {
          searchId: searches.size + 1,
          versionNo: 1,
          userId,
          ...body,
          startedAt: Date.now(),
        };
        searches.set(search.searchId, search);
        return ok({
          searchId: search.searchId,
          versionNo: 1,
          status: 'IN_PROGRESS',
          progressStep: 'PARSING',
          startedAt: iso(search.startedAt),
        });
      }
      const m = /^\/searches\/(\d+)\/versions\/(\d+)(\/[a-z]+)?$/.exec(path);
      const search = m && searches.get(Number(m[1]));
      if (!search || search.userId !== userId) {
        return fail(404, 'SEARCH404_1', '검색을 찾을 수 없습니다.');
      }
      if (Number(m[2]) !== search.versionNo)
        return fail(404, 'SEARCH404_2', '검색 버전을 찾을 수 없습니다.');
      const now = Date.now();
      const p = phase(search, now);
      const parsed = p.step !== 'PARSING';
      const base = {
        searchId: search.searchId,
        versionNo: search.versionNo,
        status: p.status,
        flightSentence: search.flightSentence,
        staySentence: search.staySentence,
        experienceSentence: search.experienceSentence,
        revisionRequest: null,
        startedAt: iso(search.startedAt),
        completedAt: p.endedAt ? iso(p.endedAt) : null,
      };
      switch (`${req.method()} ${m[3] ?? ''}`) {
        case 'GET /progress':
          return ok({
            ...base,
            progressStep: p.step,
            ...Object.fromEntries(Object.entries(TRIP).map(([k, v]) => [k, parsed ? v : null])),
            flightOfferCount: p.step === 'STAY' || p.step === 'SUMMARY' ? 8 : null,
            providerNames: { FLIGHT: ['Duffel'], STAY: ['LiteAPI'] }[p.step] ?? [],
          });
        case 'POST /cancel':
          if (p.status !== 'IN_PROGRESS') return fail(409, 'SEARCH409_2', '이미 끝난 검색입니다.');
          search.canceledAt = now;
          return ok({ searchId: search.searchId, versionNo: search.versionNo, status: 'CANCELED' });
        case 'GET ':
          return ok({
            ...base,
            latest: true,
            changeSummary: null,
            conditions: parsed
              ? [
                  ['FLIGHT', '구간', '부산 → 오사카'],
                  ['FLIGHT', '출발', '01.09 (토)'],
                  ['FLIGHT', '인원', '성인 2명'],
                  ['STAY', '위치', '난바역 근처'],
                  ['STAY', '기간', '2박'],
                ].map(([category, label, value], i) => ({
                  conditionId: i + 1,
                  category,
                  label,
                  value,
                  note: null,
                  changed: false,
                  sortOrder: i + 1,
                }))
              : [],
            adultCount: parsed ? 2 : null,
            nights: parsed ? 2 : null,
            budgetAmount: null,
            priceCheckedAt: base.completedAt,
          });
        case 'GET /combination':
          if (p.status !== 'COMPLETED') {
            return fail(404, 'COMBINATION404_1', '검색이 끝나지 않았거나 결과가 없습니다.');
          }
          return ok({
            combinationId: 40 + search.searchId,
            searchId: search.searchId,
            versionNo: search.versionNo,
            flight: {
              flightOfferId: 101,
              airlineName: '제주항공',
              outboundFlightNo: '7C 1351',
              inboundFlightNo: '7C 1352',
              cabinClass: 'ECONOMY',
              passengerCount: 2,
            },
            stay: {
              stayOfferId: 201,
              hotelName: '난바 리버사이드 호텔',
              roomType: '스탠다드 트윈',
              nights: 2,
              breakfastIncluded: true,
            },
            addons: [],
            flightAmount: 318000,
            stayAmount: 276400,
            addonAmount: 0,
            totalAmount: 594400,
            budgetAmount: null,
            budgetGap: null,
            currency: 'KRW',
            selectedAt: base.completedAt,
            updatedAt: base.completedAt,
          });
        default:
          return fail(404, 'COMMON404', '요청한 리소스를 찾을 수 없습니다.');
      }
    }
  }

  return {
    handle,
    calls,
    /** 지금까지 내준 access token 을 모두 만료시킨다 (30분이 지난 것처럼) */
    expireAccessTokens() {
      access.clear();
    },
    /** 내준 refresh token 을 모두 폐기한다 (14일이 지났거나 다른 기기에서 폐기된 것처럼) */
    revokeAll() {
      for (const t of refresh.values()) t.revoked = true;
    },
    isRevoked(token) {
      return refresh.get(token)?.revoked === true;
    },
  };
}
