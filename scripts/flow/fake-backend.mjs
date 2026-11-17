// 흐름 검사가 백엔드(core) 대신 응답한다. 규칙은 백엔드 코드와 같다.
//   POST /auth/google  — ID 토큰 검증 → 처음이면 가입(newUser) → 토큰 쌍 (AuthService · UserService)
//   POST /auth/refresh — refresh token 은 한 번만 쓴다. 이미 쓴 것이 오면 그 사람의 것을 모두 폐기한다 (RefreshTokenService)
//   POST /auth/logout  — refresh token 폐기
//   GET  /users/me     — 토큰이 없으면 COMMON401, 틀렸거나 만료됐으면 COMMON401_1
// 응답은 모두 {isSuccess, code, message, result} 형식이고, 다른 출처(origin)에서 부르므로 CORS 머리글을 붙인다.

// 가짜 ID 토큰 'fake:<이름>' 이 가리키는 Google 계정
const ACCOUNTS = {
  traveler: { email: 'traveler@example.com', name: '여행자', emailVerified: true },
  unverified: { email: 'unverified@example.com', name: '미인증', emailVerified: false },
};

export function createFakeBackend() {
  const users = new Map(); // 계정 이름 → 사용자
  const access = new Map(); // access token → userId
  const refresh = new Map(); // refresh token → { userId, revoked }
  /** 받은 요청 ('GET /users/me (토큰)' 처럼). preflight(OPTIONS)는 적지 않는다 */
  const calls = [];
  let seq = 0;

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
        return fail(404, 'COMMON404', '요청한 리소스를 찾을 수 없습니다.');
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
