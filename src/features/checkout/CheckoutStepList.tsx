import type { Schemas } from '@/shared/api/client';

/** Saga 단계 목록 (텍스트만) */
export function CheckoutStepList({ steps }: { steps: Schemas['CheckoutStepStatus'][] }) {
  return (
    <ol className="text-sm">
      {steps.map((s) => (
        <li key={`${s.step}-${s.merchant}`}>
          {s.step} · {s.merchant} · <strong>{s.state}</strong>
        </li>
      ))}
    </ol>
  );
}
