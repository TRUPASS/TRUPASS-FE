import type { ReactNode } from 'react';
import { AppFooter } from '@/app/layout/AppFooter';
import { AppHeader } from '@/app/layout/AppHeader';
import { PageHead } from '@/shared/ui/PageHead';

interface PayShellProps {
  /** 브라우저 탭에 보이는 이름 */
  tab: string;
  /** 화면 제목 */
  head: string;
  /** 제목 아래 한 줄 설명 */
  sub?: string;
  /** 지금 진행 단계의 번호 (0부터). 결제는 3이고, 결제를 마치면 5(모든 단계가 끝남)다 */
  current: number;
  children: ReactNode;
}

/** 결제 화면들의 틀: 상단 바, 제목과 진행 단계, 본문, 푸터 */
export function PayShell({ tab, head, sub, current, children }: PayShellProps) {
  return (
    <>
      <title>{`${tab} | Trupass`}</title>
      <AppHeader on="새 검색" />
      <main className="main">
        <div className="cx g24">
          <PageHead head={head} current={current} sub={sub} />
          {children}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
