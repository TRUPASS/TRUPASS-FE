import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import { formatKrw } from '@/shared/lib/format';
import { MANDATE as M, U, V1 } from '@/shared/sample/data';
import { Button } from '@/shared/ui/Button';
import { OptionTile, Radio } from '@/shared/ui/Check';
import { Field, Input } from '@/shared/ui/Field';
import { Icon } from '@/shared/ui/Icon';

// 한도 칸에 채워 두는 금액. 단위(원)는 칸 뒤에 따로 붙는다.
const amount = (n: number) => n.toLocaleString('ko-KR');

/**
 * 결제 권한 등록 폼: 결제수단, 1회 · 월 누적 한도, 허용 항목, 유효기간, 결제 승인 방식.
 * 칸은 전부 실제 input · checkbox · radio 다. [패스키로 서명하고 등록]을 누르면 결제 확인으로 넘어간다.
 */
export function MandateForm() {
  const navigate = useNavigate();

  return (
    <form
      className="pnl two-m su-form"
      onSubmit={(e) => {
        e.preventDefault();
        void navigate(routes.checkout);
      }}
    >
      <div className="pnl-b g24">
        <Field label="결제수단" hint="권한에 묶인 결제수단으로만 결제됩니다.">
          <div className="cardrow jb">
            <div className="row g12">
              <Icon name="purchase" size={20} className="c2" />
              <div className="g2">
                <span className="t-md w5">{U.card}</span>
                <span className="t-xs c3">본인 명의 신용카드, 유효기간 08/29</span>
              </div>
            </div>
            <Button kind="txt" size="sm">
              변경
            </Button>
          </div>
        </Field>
        <div className="f2">
          <Field
            label="1회 결제 한도"
            htmlFor="md-per"
            hint={`이번 결제 예정 금액은 ${formatKrw(V1.total)}입니다.`}
          >
            <Input
              id="md-per"
              className="num"
              defaultValue={amount(M.per)}
              inputMode="numeric"
              hinted
              after={<span className="c3 fn">원</span>}
            />
          </Field>
          <Field
            label="월 누적 한도"
            htmlFor="md-month"
            hint="매월 1일에 누적 금액이 초기화됩니다."
          >
            <Input
              id="md-month"
              className="num"
              defaultValue={amount(M.month)}
              inputMode="numeric"
              hinted
              after={<span className="c3 fn">원</span>}
            />
          </Field>
        </div>
        <Field label="허용 항목" hint="선택하지 않은 항목은 조합에 들어 있어도 결제되지 않습니다.">
          <div className="tiles t3">
            <OptionTile defaultChecked>항공권</OptionTile>
            <OptionTile defaultChecked>숙소</OptionTile>
            <OptionTile>체험 · 입장권</OptionTile>
          </div>
        </Field>
        <Field label="유효기간" hint={`${M.from} ~ ${M.until}`}>
          <div className="radios">
            <Radio name="term">6개월</Radio>
            <Radio name="term" defaultChecked>
              1년
            </Radio>
            <Radio name="term">직접 입력</Radio>
          </div>
        </Field>
        <Field
          label="결제 승인 방식"
          hint="본인 확인 없이 진행하도록 바꾸면 [이 조합으로 결제]를 누르는 즉시 결제됩니다."
        >
          <div className="rlist">
            <Radio name="approve" defaultChecked>
              매 결제마다 패스키로 본인 확인
            </Radio>
            <Radio name="approve">한도 안의 결제는 본인 확인 없이 진행</Radio>
          </div>
        </Field>
      </div>
      <div className="pnl-f">
        <span className="t-sm c3 dt-only">
          서명에는 이 기기의 패스키(지문 · 얼굴 인식)를 사용합니다.
        </span>
        <Button kind="pri" size="lg" type="submit" icon="fingerprint-recognition" iconSize={20}>
          패스키로 서명하고 등록
        </Button>
      </div>
    </form>
  );
}
