// 로그인 · 로그아웃 · 내 정보 · 회원 정보 입력 (백엔드 AuthController, UserController)
import { parseLogin } from '@/shared/auth/payload';
import { parseSessionUser, session, sessionFrom, type SessionUser } from '@/shared/auth/session';
import { ApiError, apiClient, unwrapResult, type Schemas } from './client';

/** 회원 정보 입력 화면이 보내는 값 (PUT /users/me/profile) */
export type ProfileInput = Schemas['Profile'];

/** 응답이 약속한 형식이 아닐 때 (필수 값이 빠졌을 때) */
function malformed(response: Response, body: unknown): ApiError {
  return new ApiError(response.status, body);
}

/**
 * Google 로그인. Google Identity Services 가 준 ID 토큰(credential)을 보내 Trupass 토큰을 받고 로그인 상태로 둔다.
 * 처음 온 계정이면 백엔드가 그 자리에서 가입시키고 newUser 가 true 다. 회원 정보 입력으로 보낼지는 user.profileCompleted 로 정한다.
 */
export async function loginWithGoogle(
  idToken: string,
): Promise<{ newUser: boolean; user: SessionUser }> {
  const res = await apiClient.POST('/auth/google', { body: { idToken } });
  const login = parseLogin(unwrapResult(res));
  if (!login) throw malformed(res.response, res.data);
  session.set(sessionFrom(login.tokens, login.user));
  return { newUser: login.newUser, user: login.user };
}

/**
 * 회원 정보 입력 · 수정. 백엔드가 저장하면 profileCompleted 가 true 인 내 정보를 돌려주고, 로그인 상태의 사용자도 그것으로 바꾼다.
 * 칸이 틀리면 ApiError(code COMMON400_1, body.result 에 {칸: 메시지})를 던진다.
 */
export async function saveProfile(profile: ProfileInput): Promise<SessionUser> {
  const res = await apiClient.PUT('/users/me/profile', { body: profile });
  const user = parseSessionUser(unwrapResult(res));
  if (!user) throw malformed(res.response, res.data);
  // 기다리는 사이 로그아웃했거나 다른 계정으로 바뀌었으면 로그인 상태는 건드리지 않는다
  if (session.get()?.user.userId === user.userId) session.setUser(user);
  return user;
}

/** 로그인한 사람의 정보 (Authorization 은 API 클라이언트가 붙인다) */
export async function fetchMe(): Promise<SessionUser> {
  const res = await apiClient.GET('/users/me');
  const user = parseSessionUser(unwrapResult(res));
  if (!user) throw malformed(res.response, res.data);
  return user;
}

/**
 * 로그아웃. 이 기기의 로그인 상태를 먼저 지우고, 백엔드에 refresh token 폐기를 알린다.
 * 알리지 못해도(네트워크 오류 등) 이 기기에서는 로그아웃된 상태다. access token 은 만료될 때까지(30분) 유효하다.
 */
export async function logout(): Promise<void> {
  const current = session.get();
  session.clear();
  if (!current) return;
  try {
    await apiClient.POST('/auth/logout', { body: { refreshToken: current.refreshToken } });
  } catch {
    // 이미 이 기기의 로그인 상태는 지웠다
  }
}
