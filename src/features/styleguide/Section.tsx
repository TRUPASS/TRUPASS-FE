import type { ReactNode } from 'react';

interface SectionProps {
  title: string;
  /** 제목 옆에 한 줄로 적는 설명 */
  desc?: string;
  children: ReactNode;
}

/** 디자인 기준의 한 구역: 제목 줄(밑줄) 아래에 내용을 쌓는다 */
export function Section({ title, desc, children }: SectionProps) {
  return (
    <section className="fd-sec">
      <div className="fd-h">
        <h2 className="t-h2">{title}</h2>
        {desc && <span className="t-sm c3">{desc}</span>}
      </div>
      {children}
    </section>
  );
}
