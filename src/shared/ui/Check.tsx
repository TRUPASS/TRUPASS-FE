import type { ComponentProps, ReactNode } from 'react';
import { Icon } from './Icon';

type BoxInput = Omit<ComponentProps<'input'>, 'type' | 'className' | 'children'>;

interface CheckboxProps extends BoxInput {
  /** 이름표(.chk)에 더하는 클래스 */
  className?: string;
  /** 글자에 더하는 클래스 */
  textClassName?: string;
  /** 글자 뒤에 붙는 것 (약관 보기 링크 등) */
  after?: ReactNode;
  children: ReactNode;
}

/** 체크박스: 실제 input 은 화면에서 숨기고(.vh) 상태를 보여 주는 상자를 그린다 */
export function Checkbox({ className, textClassName, after, children, ...input }: CheckboxProps) {
  return (
    <label className={className ? `chk ${className}` : 'chk'}>
      <input className="vh" type="checkbox" {...input} />
      <span className="box">
        <Icon name="checkmark" size={14} />
      </span>
      <span className={textClassName}>{children}</span>
      {after}
    </label>
  );
}

interface RadioProps extends BoxInput {
  className?: string;
  children: ReactNode;
}

/** 라디오 */
export function Radio({ className, children, ...input }: RadioProps) {
  return (
    <label className={className ? `chk ${className}` : 'chk'}>
      <input className="vh" type="radio" {...input} />
      <span className="rad" />
      <span>{children}</span>
    </label>
  );
}

/** 선택 타일: 여러 개 가운데 고르는 체크박스 (관심사 등) */
export function OptionTile({ children, ...input }: BoxInput & { children: ReactNode }) {
  return (
    <label className="opt">
      <input className="vh" type="checkbox" {...input} />
      <span className="box">
        <Icon name="checkmark" size={14} />
      </span>
      <span>{children}</span>
    </label>
  );
}
