import type { MockScenario } from './fixtures/checkout';
import type { MockSearch } from './fixtures/search';

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

// 검색은 새로고침해도 이어지도록 sessionStorage 에 둔다 (검색 중 화면을 다시 열거나 결과에서 뒤로 갈 때)
const SEARCHES_KEY = 'tp.mock.searches';
let searches: MockSearch[] | null = null;

function loadSearches(): MockSearch[] {
  try {
    const raw = sessionStorage.getItem(SEARCHES_KEY);
    return raw ? (JSON.parse(raw) as MockSearch[]) : [];
  } catch {
    return [];
  }
}

function saveSearches(list: MockSearch[]) {
  try {
    sessionStorage.setItem(SEARCHES_KEY, JSON.stringify(list));
  } catch {
    // 저장소를 쓸 수 없으면 이 탭에서만 기억한다
  }
}

const allSearches = () => (searches ??= loadSearches());

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
  /** 검색을 하나 만든다. 번호는 1부터 차례로 붙는다 */
  createSearch(search: Omit<MockSearch, 'searchId' | 'versionNo'>): MockSearch {
    const list = allSearches();
    const created: MockSearch = {
      searchId: list.reduce((max, s) => Math.max(max, s.searchId), 0) + 1,
      versionNo: 1,
      ...search,
    };
    list.push(created);
    saveSearches(list);
    return created;
  },
  findSearch(searchId: number) {
    return allSearches().find((s) => s.searchId === searchId);
  },
  /** 검색 하나를 바꿔 저장한다 (취소한 시각 등) */
  updateSearch(searchId: number, change: Partial<MockSearch>) {
    const list = allSearches();
    const i = list.findIndex((s) => s.searchId === searchId);
    if (i < 0) return undefined;
    const next = { ...list[i]!, ...change };
    list[i] = next;
    saveSearches(list);
    return next;
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
  searches = null;
  try {
    localStorage.removeItem(USERS_KEY);
    sessionStorage.removeItem(SEARCHES_KEY);
  } catch {
    // 저장소가 없는 환경
  }
}
