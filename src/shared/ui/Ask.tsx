import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import { prompts, type PromptKey } from '@/shared/lib/prompts';
import { Icon } from './Icon';
import type { IconName } from './icons';

/** 문장 칸 하나에 필요한 것 (shared/sample/data 의 PROMPTS 한 건) */
export interface AskPrompt {
  k: PromptKey;
  /** 이름 (항공 · 숙소 · 체험) */
  l: string;
  icon: IconName;
  /** 질문. 스크린리더가 읽는 이름으로 쓴다 */
  q?: string;
  /** 빈 칸에 연하게 깔리는 예시 */
  ph: string;
  /** 시안에서 고객이 적은 문장 */
  v: string;
  /** 눌러서 채우는 예시 */
  egs: readonly string[];
}

export interface AskHandle {
  /** 예시 문장으로 채우고 커서를 둔다 */
  fill(text: string): void;
  focus(): void;
}

interface AskProps {
  prompt: AskPrompt;
  /** 시안의 문장을 미리 채워 보여 준다 (적어 둔 문장이 있으면 그 문장이 우선한다) */
  filled?: boolean;
  /** 사진이 아닌 종이 바탕 위에 놓을 때 */
  plain?: boolean;
  /** 마지막 칸: 버튼이 [검색]이 된다 */
  last?: boolean;
  /** 엔터를 누르거나 버튼을 눌렀을 때 */
  onSubmit: () => void;
  ref?: Ref<AskHandle>;
}

/**
 * 문장 검색 상자 (랜딩 · 새 검색). 적는 대로 sessionStorage 에 담아 다음 화면으로 넘긴다.
 */
export function Ask({ prompt: p, filled, plain, last, onSubmit, ref }: AskProps) {
  const [value, setValue] = useState(() => prompts.get()[p.k] || (filled ? p.v : ''));
  const input = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    fill(text) {
      setValue(text);
      prompts.put(p.k, text);
      input.current?.focus({ preventScroll: true });
    },
    focus() {
      input.current?.focus();
    },
  }));

  return (
    <form
      className={plain ? 'ask plain' : 'ask'}
      onSubmit={(e) => {
        e.preventDefault();
        prompts.put(p.k, value.trim());
        onSubmit();
      }}
    >
      <Icon name={p.icon} size={24} />
      <input
        ref={input}
        type="text"
        name={p.k}
        placeholder={p.ph}
        value={value}
        autoComplete="off"
        enterKeyHint={last ? 'search' : 'next'}
        aria-label={p.q || p.l}
        onChange={(e) => {
          setValue(e.target.value);
          prompts.put(p.k, e.target.value.trim());
        }}
      />
      <button className="go" type="submit" aria-label={last ? '검색' : '다음'}>
        <Icon name={last ? 'search' : 'arrow--right'} size={22} />
      </button>
    </form>
  );
}

/** 눌러서 채우는 예시 문장들 */
export function Chips({
  examples,
  className,
  onPick,
}: {
  examples: readonly string[];
  className?: string;
  onPick: (text: string) => void;
}) {
  return (
    <div className={className ? `chips ${className}` : 'chips'}>
      {examples.map((t) => (
        <button key={t} type="button" className="chip" onClick={() => onPick(t)}>
          {t}
        </button>
      ))}
    </div>
  );
}
