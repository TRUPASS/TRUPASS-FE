import type { Schemas } from '@/shared/api/client';
import { formatKrw } from '@/shared/lib/format';
import { Todo } from '@/shared/ui/Todo';

/** 승인 전 확인 내용: 총액, 판매자별 금액, 취소 규정 */
export function ApprovalSummary({ option }: { option: Schemas['PackageOption'] }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-semibold">{option.title}</h2>
      <ul className="text-sm">
        {option.items.map((item) => (
          <li key={item.offerId}>
            {item.merchant}: {formatKrw(item.amount)}
          </li>
        ))}
      </ul>
      <p>총액 {formatKrw(option.totalAmount)}</p>
      <Todo>취소 규정 표시 (백엔드 스펙 확정 후)</Todo>
    </section>
  );
}
