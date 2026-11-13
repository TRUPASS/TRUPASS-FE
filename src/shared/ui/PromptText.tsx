import { usePromptText, type PromptKey } from '@/shared/lib/prompts';

/** 적어 둔 문장 하나를 글자로 보여 준다 (없으면 시안의 예시 문장 children). */
export function PromptText({
  k,
  className,
  children,
}: {
  k: PromptKey;
  className?: string;
  children: string;
}) {
  const { text, empty } = usePromptText(k, children);
  const cls = [className, empty && 'is-empty'].filter(Boolean).join(' ') || undefined;
  return <span className={cls}>{text}</span>;
}
