import type { Schemas } from '@/shared/api/client';
import { formatKrw } from '@/shared/lib/format';

interface Props {
  option: Schemas['PackageOption'];
  onSelect: (option: Schemas['PackageOption']) => void;
  disabled?: boolean;
}

/** 패키지 1안 (디자인 없음). 금액은 백엔드 값을 그대로 표시한다. */
export function PackageOptionCard({ option, onSelect, disabled }: Props) {
  return (
    <li className="border p-3">
      <h2 className="font-semibold">{option.title}</h2>
      <ul className="my-2 text-sm">
        {option.items.map((item) => (
          <li key={item.offerId}>
            [{item.type}] {item.name} · {item.merchant} · {formatKrw(item.amount)}
          </li>
        ))}
      </ul>
      <p>총액 {formatKrw(option.totalAmount)}</p>
      <button
        type="button"
        className="mt-2 border px-3 py-1"
        onClick={() => onSelect(option)}
        disabled={disabled}
      >
        이 패키지로 진행
      </button>
    </li>
  );
}
