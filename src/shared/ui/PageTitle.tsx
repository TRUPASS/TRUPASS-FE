import type { ReactNode } from 'react';

/** 공용 UI 자리. 디자인 시스템이 정해지면 교체한다. */
export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="mb-4 text-xl font-semibold">{children}</h1>;
}
