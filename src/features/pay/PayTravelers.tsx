import { cx } from '@/shared/lib/cx';
import { Button } from '@/shared/ui/Button';
import { Status } from '@/shared/ui/Status';

// 여권 영문 이름 자리. 회원은 OO, 동반자도 특정 인물로 보이지 않게 기호로 둔다. [이름, 관계, 생년월일과 성별]
const PAX = [
  ['OOO / OO', '본인', '1994.03.22, 여'],
  ['△△△ / △△', '동반 1', '1993.07.09, 남'],
] as const;

/** 탑승객 · 투숙객: 예약에 들어가는 사람과 여권 정보 입력 상태 */
export function PayTravelers() {
  return (
    <section className="pnl">
      <div className="pnl-h jb">
        <div className="row g10">
          <h2 className="t-h3">탑승객 · 투숙객</h2>
          <span className="t-sm c3">성인 2명</span>
        </div>
        <Button kind="txt" size="sm">
          수정
        </Button>
      </div>
      {PAX.map(([name, role, birth], i) => (
        <div key={name} className={cx('pax', i === 0 && 'first')}>
          <span className="nm t-md w5">{name}</span>
          <span className="t-sm c2 grow">{`${role}, ${birth}`}</span>
          <Status tone="ok">여권 정보 입력됨</Status>
        </div>
      ))}
    </section>
  );
}
