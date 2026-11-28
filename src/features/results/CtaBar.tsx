import { formatKrw } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';

interface CtaBarProps {
  /** 합계(원). 받은 그대로 보여 준다 */
  total: number;
  /** 합계 옆에 적는 인원 (성인 2명) */
  pax: string;
  label: string;
  to: string;
}

/** 태블릿 · 모바일: 수정 요청 독 아래에 붙는 합계와 다음 단계 버튼 */
export function CtaBar({ total, pax, label, to }: CtaBarProps) {
  return (
    <div className="cta-bar tm-only">
      <div className="g2">
        <span className="t-xs c3">{`합계, ${pax}`}</span>
        <span className="t-h3 num">{formatKrw(total)}</span>
      </div>
      <Button kind="pri" to={to}>
        {label}
      </Button>
    </div>
  );
}
