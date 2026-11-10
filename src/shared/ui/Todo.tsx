import type { ReactNode } from 'react';

/** 아직 구현되지 않은 영역 표시 */
export function Todo({ children }: { children: ReactNode }) {
  return <p className="my-2 text-sm text-gray-500">TODO: {children}</p>;
}
