import type { ComponentProps, ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './icons';

interface InputProps extends Omit<ComponentProps<'input'>, 'className'> {
  /** 칸 앞의 아이콘 */
  icon?: IconName;
  /** 칸 뒤에 붙는 것 (글자 수, 단위 등) */
  after?: ReactNode;
  /** 테두리 상자(.inp)에 더하는 클래스 */
  className?: string;
  /** 도움말이 있으면 그 도움말과 잇는다 (Field 의 hint) */
  hinted?: boolean;
}

/** 입력 칸: 실제 input 을 테두리 상자(.inp)에 담는다. id 는 이름표(label for)와 잇는 자리. */
export function Input({
  icon,
  after,
  className,
  hinted,
  readOnly,
  type = 'text',
  id,
  ...rest
}: InputProps) {
  const cls = ['inp', readOnly && 'ro', className].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      {icon && <Icon name={icon} />}
      <input
        id={id}
        type={type}
        readOnly={readOnly}
        aria-describedby={hinted && id ? `${id}-h` : undefined}
        {...rest}
      />
      {after}
    </div>
  );
}

interface SelectProps extends Omit<ComponentProps<'select'>, 'className' | 'children'> {
  options: readonly string[];
  hinted?: boolean;
  /** 아무것도 고르지 않았을 때 보이는 맨 앞 칸(값은 빈 문자열). required 와 함께 쓰면 고르기 전에는 넘어가지 않는다 */
  placeholder?: string;
}

/** 고르는 칸(select) */
export function Select({ options, hinted, placeholder, id, ...rest }: SelectProps) {
  return (
    <div className="inp">
      <select id={id} aria-describedby={hinted && id ? `${id}-h` : undefined} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
      <Icon name="chevron--down" size={16} />
    </div>
  );
}

interface FieldProps {
  label: string;
  /** 이름표와 잇는 입력 칸의 id. 없으면(여러 칸을 묶는 경우) 묶음 이름으로 쓴다 */
  htmlFor?: string;
  /** 이름표 옆의 보조 글 (선택 · 최대 3개 등) */
  opt?: ReactNode;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** 이름표 + 칸 + 도움말 */
export function Field({ label, htmlFor, opt, hint, className, children }: FieldProps) {
  const groupId = htmlFor ? undefined : `g-${label.replace(/[^0-9A-Za-z가-힣]+/g, '')}`;
  return (
    <div
      className={className ? `fld ${className}` : 'fld'}
      role={htmlFor ? undefined : 'group'}
      aria-labelledby={groupId}
    >
      <div className="fld-l">
        {htmlFor ? (
          <label className="l" htmlFor={htmlFor}>
            {label}
          </label>
        ) : (
          <span className="l" id={groupId}>
            {label}
          </span>
        )}
        {opt && <span className="o">{opt}</span>}
      </div>
      {children}
      {hint && (
        <span className="hint" id={htmlFor ? `${htmlFor}-h` : undefined}>
          {hint}
        </span>
      )}
    </div>
  );
}
