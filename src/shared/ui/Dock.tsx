import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router';
import { cx } from '@/shared/lib/cx';
import { Button } from './Button';
import { Icon } from './Icon';

const MAX = 300;

interface DockProps {
  /** 처음부터 올라온 모습으로 둔다 */
  up?: boolean;
  /** 처음부터 적혀 있는 문장 */
  text?: string;
  placeholder: string;
  /** 머리줄의 설명 뒤에 붙는 말 (데스크톱 · 태블릿에서만 보인다) */
  desc?: string;
  hint?: ReactNode;
  /** 눌러서 채우는 예시 문장 */
  examples?: readonly string[];
  /** [다시 검색]을 누르면 갈 곳. 없으면 넘어가지 않는 버튼으로 둔다 (보기용) */
  to?: string;
}

/**
 * 수정 요청 독: 결과 화면 아래에 늘 붙어 있다.
 * - 내림(기본): 머리줄 한 줄만 보인다.
 * - 올림(.up): 머리줄이나 오른쪽 화살표 단추를 누르면 입력 상자가 올라온다. 입력 칸으로 커서를 옮기지는 않는다.
 * - 독 바깥을 누르거나 화살표 단추를 다시 누르면 내려간다. 적던 글은 그대로 남는다.
 */
export function Dock({
  up: startUp = false,
  text: startText = '',
  placeholder,
  desc,
  hint,
  examples,
  to,
}: DockProps) {
  const navigate = useNavigate();
  const [text, setText] = useState(startText);
  // moved: 한 번이라도 올리거나 내렸는가 (그때부터 올라오고 내려가는 움직임 클래스를 붙인다)
  const [state, setState] = useState({ up: startUp, moved: false });
  const root = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLButtonElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const has = text.trim().length > 0;

  const set = (up: boolean) => {
    // 예시를 고르면 올린 바로 다음에 입력 칸에 커서를 두므로 화면에 반영하고 돌아온다
    flushSync(() => setState((now) => (now.up === up ? now : { up, moved: true })));
  };

  // 올라와 있는 동안 독 바깥을 누르면 내려간다
  useEffect(() => {
    if (!state.up) return;
    const outside = (e: globalThis.PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) {
        setState((now) => (now.up ? { up: false, moved: true } : now));
      }
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [state.up]);

  const fill = (value: string) => {
    set(true);
    setText(value.slice(0, MAX));
    area.current?.focus();
  };
  const submit = () => {
    if (has && to) navigate(to);
  };
  const send = {
    kind: has ? 'pri' : undefined,
    after: 'renew',
    'aria-disabled': has ? undefined : true,
  } as const;

  return (
    <div
      ref={root}
      className={cx('dock', state.up && 'up', state.moved && (state.up ? 'lift' : 'drop'))}
    >
      <div className="dock-h">
        <button
          ref={head}
          type="button"
          className="dock-hb"
          aria-expanded={state.up}
          onClick={() => set(true)}
        >
          <Icon name="edit" size={16} className="c2" />
          <span className="t-sm w6 fn">수정 요청</span>
          <span className="dock-ph t-sm grow">{placeholder}</span>
          <span className="dock-de t-sm c2 grow">
            바꾸고 싶은 점을 문장으로 적어 주세요.
            <span className="dt-only">{` ${desc || '조건을 반영해 다시 검색합니다.'}`}</span>
          </span>
        </button>
        <button
          type="button"
          className="dock-tg"
          aria-label={state.up ? '입력 창 접기' : '입력 창 펼치기'}
          aria-expanded={state.up}
          onClick={() => set(!state.up)}
        >
          <Icon name="chevron--up" size={16} className="i-up" />
          <Icon name="chevron--down" size={16} className="i-dn" />
        </button>
      </div>
      <div className="dock-b">
        <div className="pbox">
          <textarea
            ref={area}
            className="pbox-x"
            rows={2}
            maxLength={MAX}
            placeholder={placeholder}
            aria-label="수정 요청"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => set(true)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return; // 한글 조합 중의 엔터는 넘기지 않는다
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              } else if (e.key === 'Escape' && !has) {
                set(false);
                head.current?.focus();
              }
            }}
          />
          <div className={cx('pbox-f', !hint && 'je')}>
            {hint && <span className="hint grow">{hint}</span>}
            <div className="row g12 fn pbox-a">
              <span className="t-xs c3 num">{`${text.length} / ${MAX}`}</span>
              {to ? (
                <Button
                  {...send}
                  to={to}
                  onClick={(e: MouseEvent) => {
                    if (!has) e.preventDefault();
                  }}
                >
                  다시 검색
                </Button>
              ) : (
                <Button {...send}>다시 검색</Button>
              )}
            </div>
          </div>
        </div>
        {examples && (
          <div className="dock-eg">
            <span className="t-xs c3 fn">예시</span>
            {examples.map((t) => (
              <button key={t} type="button" className="tbtn t-xs" onClick={() => fill(t)}>
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** 화면 아래 고정 영역: 수정 요청 독 + (태블릿 · 모바일) 합계와 다음 단계 버튼 */
export function Bottom({ dock, bar }: { dock: ReactNode; bar?: ReactNode }) {
  return (
    <div className="bottom">
      <div className="bottom-in">{dock}</div>
      {bar}
    </div>
  );
}
