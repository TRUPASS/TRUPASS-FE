import { V1 } from '@/shared/sample/data';
import { Checkbox } from '@/shared/ui/Check';

const { f, h } = V1;

/** 결제 전에 확인하는 규정과 개인정보 제공 동의 */
export function PayTerms() {
  return (
    <section className="pnl">
      <div className="pnl-b g10">
        <Checkbox defaultChecked>항공 운임 규정과 취소 · 환불 규정을 확인했습니다.</Checkbox>
        <Checkbox defaultChecked>숙소 취소 규정을 확인했습니다.</Checkbox>
        <Checkbox className="top" defaultChecked>
          {`예약에 필요한 개인정보를 ${f.air}, ${h.name}에 제공하는 데 동의합니다.`}
        </Checkbox>
      </div>
    </section>
  );
}
