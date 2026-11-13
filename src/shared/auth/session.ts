import { useSyncExternalStore } from 'react';

/** 로그인한 사람 (백엔드 GET /users/me 의 결과) */
export interface SessionUser {
  userId: number;
  email: string;
  /** Google 계정의 이름. 없을 수 있다 */
  name: string | null;
  /** Google 계정의 프로필 사진 주소. 없을 수 있다 */
  pictureUrl: string | null;
  /** 회원 정보 입력에서 정한 닉네임. 입력 전에는 없다 */
  nickname: string | null;
  /** 회원 정보 입력을 마쳤는가. false 면 회원 정보 입력(/signup)으로 보낸다 */
  profileCompleted: boolean;
}

/** 로그인 상태: 백엔드가 준 토큰 쌍과 사용자 */
export interface Session {
  accessToken: string;
  /** access token 이 만료되는 때 (Unix 시각, ms) */
  accessExpiresAt: number;
  /** 한 번 쓰면 바뀐다 (POST /auth/refresh) */
  refreshToken: string;
  refreshExpiresAt: number;
  user: SessionUser;
}

// 탭을 닫았다 열어도 로그인이 이어지도록 localStorage 에 둔다. 다른 탭에서 바뀌면 storage 이벤트로 따라간다.
const KEY = 'tp.auth';
/** 만료 30초 전부터 만료된 것으로 본다 (시계 차이와 요청이 가는 시간) */
const SKEW_MS = 30_000;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isText = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * 저장해 둔 값이 지금 형식과 맞는지 본다. 맞지 않으면(손상) 없는 것으로 본다.
 * 회원 정보 입력 전에 저장한 값(닉네임 · 입력 여부가 없음)은 입력 전으로 읽는다. 앱을 열면 SessionSync 가 최신으로 맞춘다.
 */
export function parseSessionUser(v: unknown): SessionUser | null {
  if (!isRecord(v) || !isTime(v.userId) || !isText(v.email)) return null;
  return {
    userId: v.userId,
    email: v.email,
    name: isText(v.name) ? v.name : null,
    pictureUrl: isText(v.pictureUrl) ? v.pictureUrl : null,
    nickname: isText(v.nickname) ? v.nickname : null,
    profileCompleted: v.profileCompleted === true,
  };
}

function parseSession(v: unknown): Session | null {
  if (!isRecord(v)) return null;
  const user = parseSessionUser(v.user);
  if (!user || !isText(v.accessToken) || !isText(v.refreshToken)) return null;
  if (!isTime(v.accessExpiresAt) || !isTime(v.refreshExpiresAt)) return null;
  return {
    accessToken: v.accessToken,
    accessExpiresAt: v.accessExpiresAt,
    refreshToken: v.refreshToken,
    refreshExpiresAt: v.refreshExpiresAt,
    user,
  };
}

function load(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    const stored = raw ? parseSession(JSON.parse(raw)) : null;
    if (raw && (!stored || stored.refreshExpiresAt <= Date.now())) localStorage.removeItem(KEY);
    return stored && stored.refreshExpiresAt > Date.now() ? stored : null;
  } catch {
    return null;
  }
}

function save(next: Session | null) {
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등): 이 탭에서만 로그인이 유지된다
  }
}

let cache: Session | null | undefined;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export const session = {
  /** 지금 로그인 상태 */
  get(): Session | null {
    if (cache === undefined) cache = load();
    return cache;
  },
  /** 저장소에서 다시 읽는다. 다른 탭이 토큰을 바꿨을 수 있을 때 쓴다 */
  reload(): Session | null {
    const next = load();
    if (next?.refreshToken !== cache?.refreshToken || next?.user.userId !== cache?.user.userId) {
      cache = next;
      notify();
    }
    return cache ?? null;
  },
  set(next: Session) {
    cache = next;
    save(next);
    notify();
  },
  /** 로그인한 사람의 정보만 바꾼다 (로그아웃 상태면 아무것도 하지 않는다) */
  setUser(user: SessionUser) {
    const current = session.get();
    if (current) session.set({ ...current, user });
  },
  clear() {
    cache = null;
    save(null);
    notify();
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY && e.key !== null) return;
    cache = load();
    notify();
  });
}

/** access token 이 곧 만료되거나 이미 만료됐는가 */
export function accessExpired(s: Session, now = Date.now()): boolean {
  return s.accessExpiresAt - SKEW_MS <= now;
}

/** 백엔드가 준 유효 시간(초)으로 만료 시각을 정해 로그인 상태를 만든다 */
export function sessionFrom(
  tokens: {
    accessToken: string;
    accessTokenExpiresIn: number;
    refreshToken: string;
    refreshTokenExpiresIn: number;
  },
  user: SessionUser,
  now = Date.now(),
): Session {
  return {
    accessToken: tokens.accessToken,
    accessExpiresAt: now + tokens.accessTokenExpiresIn * 1000,
    refreshToken: tokens.refreshToken,
    refreshExpiresAt: now + tokens.refreshTokenExpiresIn * 1000,
    user,
  };
}

/** 지금 로그인 상태. 로그인 · 로그아웃 · 토큰 교체 때 다시 그린다 */
export function useSession(): Session | null {
  return useSyncExternalStore(session.subscribe, session.get, () => null);
}
