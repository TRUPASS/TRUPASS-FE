import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
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
  /** [다시 검색]을 누르면 갈 곳 */
  to: string;
}

/**
 * 수정 요청 독: 결과 화면 아래에 늘 붙어 있다.
 * - 내림(기본): 머리줄 한 줄만 보인다.
 * - 올림(.up): 머리줄을 누르거나 마우스를 올리거나 입력을 시작하면 입력 상자가 올라온다.
 * - 입력 없이 포인터가 벗어난 채 4초가 지나면 다시 내려간다. 글자가 있거나 초점이 안에 있으면 내려가지 않는다.
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
  const live = useRef({ hover: false, pinned: false, timer: 0, text: startText, up: startUp });
  const has = text.trim().length > 0;

  useEffect(() => {
    live.current.text = text;
    live.current.up = state.up;
  }, [text, state.up]);
  useEffect(() => {
    const now = live.current;
    return () => clearTimeout(now.timer);
  }, []);

  const set = (up: boolean) => {
    live.current.up = up;
    if (!up) live.current.pinned = false;
    setState({ up, moved: true });
  };
  const raise = () => {
    clearTimeout(live.current.timer);
    if (!live.current.up) set(true);
  };
  const lower = (force?: boolean) => {
    const now = live.current;
    if (!now.up) return;
    const busy =
      now.text.trim().length > 0 || now.hover || !!root.current?.contains(document.activeElement);
    if (!force && busy) return;
    set(false);
  };
  const arm = () => {
    clearTimeout(live.current.timer);
    live.current.timer = window.setTimeout(() => lower(), 4000);
  };
  const fill = (value: string) => {
    raise();
    live.current.pinned = true;
    setText(value.slice(0, MAX));
    area.current?.focus();
  };
  const submit = () => {
    if (has) navigate(to);
  };

  return (
    <div
      ref={root}
      className={`dock${state.up ? 'up' : ''}${state.moved ? (state.up ? 'lift' : 'drop') : ''}`}
      // 마우스로 가리킬 때만 따라 올라온다 (터치는 누른 것으로만 판단한다)
      onPointerEnter={(e) => {
        if (e.pointerType !== 'mouse') return;
        live.current.hover = true;
        raise();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== 'mouse') return;
        live.current.hover = false;
        arm();
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) arm();
      }}
    >
      <button
        ref={head}
        type="button"
        className="dock-h"
        aria-expanded={state.up}
        onClick={() => {
          const now = live.current;
          if (now.up && now.pinned && !has) {
            now.hover = false;
            lower(true);
          } else {
            raise();
            now.pinned = true;
            area.current?.focus();
          }
        }}
      >
        <Icon name="edit" size={16} className="c2" />
        <span className="t-sm w6 fn">수정 요청</span>
        <span className="dock-ph t-sm grow">{placeholder}</span>
        <span className="dock-de t-sm c2 grow">
          바꾸고 싶은 점을 문장으로 적어 주세요.
          <span className="dt-only"> {desc || '조건을 반영해 다시 검색합니다.'}</span>
        </span>
        <Icon name="chevron--up" size={16} className="c3 i-up" />
        <Icon name="chevron--down" size={16} className="c3 i-dn" />
      </button>
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
            onFocus={() => {
              live.current.pinned = true;
              raise();
            }}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return; // 한글 조합 중의 엔터는 넘기지 않는다
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              } else if (e.key === 'Escape' && !has) {
                lower(true);
                head.current?.focus();
              }
            }}
          />
          <div className={hint ? 'pbox-f' : 'pbox-f je'}>
            {hint && <span className="hint grow">{hint}</span>}
            <div className="row g12 fn pbox-a">
              <span className="t-xs c3 num">
                {text.length} / {MAX}
              </span>
              <Button
                kind={has ? 'pri' : undefined}
                after="renew"
                to={to}
                aria-disabled={has ? undefined : true}
                onClick={(e: MouseEvent) => {
                  if (!has) e.preventDefault();
                }}
              >
                다시 검색
              </Button>
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
