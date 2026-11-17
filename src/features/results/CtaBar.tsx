import { formatKrw } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';

/** 태블릿 · 모바일: 수정 요청 독 아래에 붙는 합계와 다음 단계 버튼 */
export function CtaBar({ total, label, to }: { total: number; label: string; to: string }) {
  return (
    <div className="cta-bar tm-only">
      <div className="g2">
        <span className="t-xs c3">합계, 성인 2명</span>
        <span className="t-h3 num">{formatKrw(total)}</span>
      </div>
      <Button kind="pri" to={to}>
        {label}
      </Button>
    </div>
  );
}
