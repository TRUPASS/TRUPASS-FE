import { useSyncExternalStore } from 'react';

/** 검색 문장 세 개의 이름: 항공 · 숙소 · 체험 */
export type PromptKey = 'flight' | 'stay' | 'exp';
export type Prompts = Partial<Record<PromptKey, string>>;

// 적은 문장은 sessionStorage 에 담아 다음 화면(로그인 · 검색 중 · 결과)으로 넘긴다.
const KEY = 'tp.prompts';
let cache: Prompts | null = null;
const listeners = new Set<() => void>();

function read(): Prompts {
  if (cache) return cache;
  try {
    cache = JSON.parse(sessionStorage.getItem(KEY) || '{}') as Prompts;
  } catch {
    cache = {};
  }
  return cache;
}

export const prompts = {
  get: read,
  put(key: PromptKey, value: string) {
    cache = { ...read(), [key]: value };
    try {
      sessionStorage.setItem(KEY, JSON.stringify(cache));
    } catch {
      // 저장소를 쓸 수 없는 환경: 이 탭 안에서만 유지한다
    }
    listeners.forEach((notify) => notify());
  },
  /** 적어 둔 문장이 하나라도 있는가 */
  any(): boolean {
    return Object.values(read()).some(Boolean);
  },
};

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

/** 적어 둔 문장들. 바뀌면 다시 그린다. */
export function usePrompts(): Prompts {
  return useSyncExternalStore(subscribe, read, read);
}

/**
 * 화면에 보여 줄 문장 하나. 앞 화면에서 실제로 적은 문장이 있으면 그 문장, 없으면 시안의 예시 문장(fallback)이다.
 * 세 칸 가운데 일부만 적었다면 비운 칸은 "적지 않았습니다"가 되고 empty 가 참이다.
 */
export function usePromptText(key: PromptKey, fallback: string): { text: string; empty: boolean } {
  const saved = usePrompts();
  if (!Object.values(saved).some(Boolean)) return { text: fallback, empty: false };
  const value = saved[key];
  return value ? { text: value, empty: false } : { text: '적지 않았습니다', empty: true };
}
