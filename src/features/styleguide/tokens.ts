import css from '@/styles/tokens.css?raw';

// 색 토큰의 이름 → 값. 색 값을 따로 적어 두지 않고 styles/tokens.css 의 토큰 블록에서 읽는다 (예: 'n-900' → '#1c1f5a').
const TOKENS = new Map(
  [...css.matchAll(/--([a-z]+-\d+):\s*(#[0-9a-f]{6})/g)].map(
    ([, name = '', value = '']) => [name, value] as const,
  ),
);

/** 토큰 하나의 색 값 */
export function tokenColor(name: string): string {
  const value = TOKENS.get(name);
  if (!value) throw new Error(`unknown token: ${name}`);
  return value;
}

/** 한 벌(n · b · g · y · r)에 속한 토큰 이름들. 토큰 블록에 적힌 순서(옅은 색 → 짙은 색)대로다. */
export function tokenRamp(prefix: string): string[] {
  return [...TOKENS.keys()].filter((name) => name.startsWith(`${prefix}-`));
}
