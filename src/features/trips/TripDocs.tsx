import { DocRow } from '@/features/pay/DocRow';
import { DOCS } from '@/features/pay/docs';
import { useMember } from '@/shared/auth/member';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

/** 문서함: 결제 영수증과 예약 확정서를 모아 둔다 */
export function TripDocs() {
  const { email } = useMember();
  return (
    <section className="pnl" id="docs">
      <div className="pnl-h jb">
        <div className="row g10">
          <Icon name="document" size={20} />
          <h2 className="t-h3">문서함</h2>
        </div>
        <span className="t-sm c3">{`${DOCS.length}건`}</span>
      </div>
      {DOCS.map((doc, i) => (
        <DocRow key={doc.title} doc={doc} first={i === 0} />
      ))}
      <div className="pnl-f">
        <span className="t-sm c3 dt-only">{`${email} 주소로도 보냈습니다.`}</span>
        <Button icon="download">모두 PDF로 받기</Button>
      </div>
    </section>
  );
}
