import { formatKrwDiff } from '@/shared/lib/format';
import { Checkbox } from '@/shared/ui/Check';

interface AddOnProps {
  item: { label: string; sub: string; price: number };
  checked: boolean;
  /** 고르지 않은 항공권의 추가 선택은 켤 수 없다 */
  disabled?: boolean;
  hidden?: boolean;
  onChange: (on: boolean) => void;
}

/** 추가 선택 한 줄: 수하물은 항공권에, 조식은 조식이 빠진 숙소를 골랐을 때만 붙는다. */
export function AddOn({ item, checked, disabled, hidden, onChange }: AddOnProps) {
  return (
    <div className="ax-r" hidden={hidden}>
      <Checkbox checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)}>
        {`${item.label} `}
        <span className="c3">{item.sub}</span>
      </Checkbox>
      <span className="t-sm num w5 fn">{formatKrwDiff(item.price)}</span>
    </div>
  );
}
