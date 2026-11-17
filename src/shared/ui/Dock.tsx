import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
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
  // hover: 마우스가 올라와 있어 내리지 않는다, inside: 마우스가 독 위에 있다고 알고 있다, pinned: 누르거나 적어서 올렸다
  const live = useRef({
    hover: false,
    inside: false,
    pinned: false,
    timer: 0,
    text: startText,
    up: startUp,
  });
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
    // 내려가 있는 동안 입력 상자는 화면에 없어 커서를 둘 수 없다. 올린 바로 다음에 커서를 두므로 화면에 반영하고 돌아온다
    flushSync(() => setState({ up, moved: true }));
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
  // 마우스로 가리킬 때만 따라 올라온다 (터치는 누른 것으로만 판단한다)
  const enter = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    live.current.inside = true;
    live.current.hover = true;
    raise();
  };
  const leave = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    live.current.inside = false;
    live.current.hover = false;
    arm();
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
      onPointerEnter={enter}
      // 화면이 바뀌면서 독이 마우스 밑에서 새로 그려지면 들어왔다는 신호가 오지 않는다. 그때는 첫 움직임을 들어온 것으로 본다
      onPointerMove={(e) => {
        if (!live.current.inside) enter(e);
      }}
      onPointerLeave={leave}
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
          <span className="dt-only">{` ${desc || '조건을 반영해 다시 검색합니다.'}`}</span>
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
