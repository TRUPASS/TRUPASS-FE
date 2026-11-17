import { PAY, REQ, V1 } from '@/shared/sample/data';
import type { IconName } from '@/shared/ui/icons';

/** 결제를 마치면 이메일로 보내는 문서 한 건 */
export interface PayDoc {
  icon: IconName;
  title: string;
  /** 문서를 찾는 번호 (주문번호 · 예약번호) */
  sub: string;
}

const { f, h } = V1;

// 결제 완료와 내 여행의 문서함이 함께 쓴다.
export const DOCS: PayDoc[] = [
  { icon: 'document--pdf', title: '결제 영수증', sub: `주문번호 ${REQ.order}` },
  { icon: 'document', title: '항공권 e-티켓 확정서', sub: `${f.air} 예약번호 ${PAY.air.no}` },
  { icon: 'document', title: '숙소 예약 확정서', sub: `${h.name} 예약번호 ${PAY.stay.no}` },
];
