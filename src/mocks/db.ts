import type { MockScenario } from './fixtures/checkout';
import type { SavedProfile } from './fixtures/profile';

interface MockCheckout {
  packageId: string;
  scenario: MockScenario;
  /** GET /api/checkouts/{id} 호출 횟수 */
  ticks: number;
}

/** Mock 로그인으로 가입한 사람 */
export interface MockUser {
  userId: number;
  sub: string;
  email: string;
  name: string;
  createdAt: string;
  /** 회원 정보 입력에서 저장한 값. 입력을 마치기 전에는 없다 (예전에 저장해 둔 Mock 사용자에도 없다) */
  profile?: SavedProfile;
}

/** 브라우저 탭(또는 테스트) 메모리에만 있는 Mock 상태. 새로고침하면 초기화된다. */
const checkouts = new Map<string, MockCheckout>();
let sequence = 0;
/** 이미 쓴 refresh token (한 번만 쓸 수 있다) */
const usedRefreshTokens = new Set<string>();

// 가입한 사람은 새로고침해도 남도록 localStorage 에 둔다 (다시 로그인하면 "이미 가입한 계정"이 되게)
const USERS_KEY = 'tp.mock.users';

function loadUsers(): MockUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as MockUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: MockUser[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // 저장소를 쓸 수 없으면 이 탭에서만 기억한다
  }
}

let users: MockUser[] | null = null;
const allUsers = () => (users ??= loadUsers());

export const mockDb = {
  nextId(prefix: string) {
    sequence += 1;
    return `${prefix}-${Date.now().toString(36)}-${sequence}`;
  },
  getCheckout(id: string) {
    return checkouts.get(id);
  },
  saveCheckout(id: string, checkout: MockCheckout) {
    checkouts.set(id, checkout);
    return checkout;
  },
  /** Google 계정(sub)으로 찾고, 없으면 가입시킨다. 백엔드 UserService.loginWithGoogle 과 같다 */
  signIn(account: { sub: string; email: string; name: string }): {
    user: MockUser;
    newUser: boolean;
  } {
    const list = allUsers();
    const found = list.find((u) => u.sub === account.sub);
    if (found) return { user: found, newUser: false };
    const user: MockUser = {
      userId: list.reduce((max, u) => Math.max(max, u.userId), 0) + 1,
      sub: account.sub,
      email: account.email,
      name: account.name,
      createdAt: new Date().toISOString(),
    };
    list.push(user);
    saveUsers(list);
    return { user, newUser: true };
  },
  findUser(userId: number) {
    return allUsers().find((u) => u.userId === userId);
  },
  /** 회원 정보를 저장한다 (처음이면 회원 정보 입력을 마친 것이 된다). 백엔드 UserService.updateProfile 과 같다 */
  saveProfile(userId: number, profile: SavedProfile): MockUser | undefined {
    const list = allUsers();
    const user = list.find((u) => u.userId === userId);
    if (!user) return undefined;
    user.profile = profile;
    saveUsers(list);
    return user;
  },
  /** refresh token 을 한 번 쓴다. 이미 쓴 것이면 false */
  useRefreshToken(token: string): boolean {
    if (usedRefreshTokens.has(token)) return false;
    usedRefreshTokens.add(token);
    return true;
  },
};

export function resetMockDb() {
  checkouts.clear();
  sequence = 0;
  usedRefreshTokens.clear();
  users = null;
  try {
    localStorage.removeItem(USERS_KEY);
  } catch {
    // 저장소가 없는 환경
  }
}
