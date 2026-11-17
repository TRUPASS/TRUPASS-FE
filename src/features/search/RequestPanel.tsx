import { Link } from 'react-router';
import { routes } from '@/app/routes';
import { cx } from '@/shared/lib/cx';
import { usePromptText, type PromptKey } from '@/shared/lib/prompts';
import { APPLIED, PROMPTS, type Cond, type Prompt } from '@/shared/sample/data';
import { Icon } from '@/shared/ui/Icon';
import { Tag } from '@/shared/ui/Status';

/** 수정 요청으로 바뀐 조건. 문장마다 같은 이름의 조건을 바꿔 끼운다: { stay: [['위치', '우에노역 도보 5분 이내', '변경']] } */
export type CondChange = Partial<Record<PromptKey, Cond[]>>;

/** 조건 묶음: [이름, 값, 표식]. 이름 칸의 폭을 맞춰 값이 같은 자리에서 시작한다. */
function Conds({ pairs }: { pairs: Cond[] }) {
  return (
    <dl className="rq-d">
      {pairs.map(([name, value, mark]) => (
        <div key={name} className="rq-p">
          <dt>{name}</dt>
          <dd>
            <span>{value}</span>
            {mark && <Tag tone={mark === '변경' ? 'y' : 'b'}>{mark}</Tag>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** 한 줄: 문장의 이름 · 적은 문장 · 그 문장에서 뽑아 적용한 조건 */
function RequestRow({ prompt: p, change = [] }: { prompt: Prompt; change?: Cond[] }) {
  const { text, empty } = usePromptText(p.k, p.v);
  const pairs = APPLIED[p.k].map((c) => change.find((x) => x[0] === c[0]) ?? c);
  return (
    <tr>
      <th scope="row">
        <span className="rq-l">
          <Icon name={p.icon} size={16} />
          <span>{p.l.split(' · ')[0]}</span>
        </span>
      </th>
      <td className={cx('rq-s', empty && 'is-empty')}>{text}</td>
      <td>
        <Conds pairs={pairs} />
      </td>
    </tr>
  );
}

interface RequestPanelProps {
  change?: CondChange;
  /** [문장 다시 적기] 링크를 보인다 (기본) */
  edit?: boolean;
}

/**
 * 적어 둔 문장과, 그 문장에서 뽑아 검색에 적용한 조건을 한 줄씩 짝지어 보여 주는 표.
 * 대략 적은 말이 어떤 범위로 바뀌었는지(넓혀 잡은 날짜, 함께 찾은 공항)를 문장 바로 옆에서 확인할 수 있게 한다.
 */
export function RequestPanel({ change, edit = true }: RequestPanelProps) {
  return (
    <section className="pnl rq">
      <table className="rq-t">
        <thead>
          <tr>
            <th scope="col">
              <span className="vh">구분</span>
            </th>
            <th scope="col">적은 문장</th>
            <th scope="col">
              <div className="row jb g12">
                <span>이렇게 찾았습니다</span>
                {edit && (
                  <Link className="lnk w5" to={routes.search}>
                    문장 다시 적기
                  </Link>
                )}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {PROMPTS.map((p) => (
            <RequestRow key={p.k} prompt={p} change={change?.[p.k]} />
          ))}
        </tbody>
      </table>
      {edit && (
        <Link className="lnk w5 t-sm rq-e m-only" to={routes.search}>
          문장 다시 적기
        </Link>
      )}
    </section>
  );
}
