import { Link } from 'react-router';
import { routes } from '@/app/routes';
import { cx } from '@/shared/lib/cx';
import { usePromptText, type PromptKey } from '@/shared/lib/prompts';
import { APPLIED, PROMPTS, type Cond, type Prompt } from '@/shared/sample/data';
import { Icon } from '@/shared/ui/Icon';

/** 수정 요청으로 바뀐 조건. 문장마다 같은 이름의 조건을 바꿔 끼운다: { stay: [['위치', '우에노역 도보 5분 이내', '변경']] } */
export type CondChange = Partial<Record<PromptKey, Cond[]>>;

/** 조건 한 줄: 이름 · 값 · 표식(넓혀 잡았거나 채워 넣은 설명). changed 면 바뀐 조건으로 표시한다 */
export interface CondRow {
  key: string;
  name: string;
  value: string;
  mark?: string;
  changed?: boolean;
}

/** API 화면의 한 줄: 보낸 문장과 그 문장에서 뽑아 검색에 적용한 조건 */
export interface RequestRowData {
  sentence: string;
  conds: CondRow[];
}

const fromCond = ([name, value, mark]: Cond): CondRow => ({
  key: name,
  name,
  value,
  mark,
  changed: mark === '변경',
});

/** 조건 묶음. 이름 칸의 폭을 맞춰 값이 같은 자리에서 시작한다. 표식은 테두리 없이 글자로만 붙인다. */
function Conds({ rows }: { rows: CondRow[] }) {
  if (!rows.length) return <p className="t-sm c3">해당 조건 없음</p>;
  return (
    <dl className="rq-d">
      {rows.map((r) => (
        <div key={r.key} className="rq-p">
          <dt>{r.name}</dt>
          <dd>
            <span>{r.value}</span>
            {r.mark && <span className={cx('rq-m', r.changed && 'chg')}>{r.mark}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** 한 줄: 문장의 이름 · 적은 문장 · 그 문장에서 뽑아 적용한 조건 */
function Row({
  prompt: p,
  text,
  empty,
  rows,
}: {
  prompt: Prompt;
  text: string;
  empty: boolean;
  rows: CondRow[];
}) {
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
        <Conds rows={rows} />
      </td>
    </tr>
  );
}

/** 예시 화면의 한 줄: 적어 둔 문장(없으면 시안의 문장)과 예시 조건(APPLIED) */
function SampleRow({ prompt: p, change = [] }: { prompt: Prompt; change?: Cond[] }) {
  const { text, empty } = usePromptText(p.k, p.v);
  const rows = APPLIED[p.k].map((c) => fromCond(change.find((x) => x[0] === c[0]) ?? c));
  return <Row prompt={p} text={text} empty={empty} rows={rows} />;
}

interface RequestPanelProps {
  change?: CondChange;
  /** [문장 다시 적기] 링크를 보인다 (기본) */
  edit?: boolean;
  /** API 화면: 검색 조건 API 로 채운 문장과 조건. 주면 예시 대신 이것을 보여 준다 */
  data?: Record<PromptKey, RequestRowData>;
}

/**
 * 적어 둔 문장과, 그 문장에서 뽑아 검색에 적용한 조건을 한 줄씩 짝지어 보여 주는 표.
 * 대략 적은 말이 어떤 범위로 바뀌었는지(넓혀 잡은 날짜, 함께 찾은 공항)를 문장 바로 옆에서 확인할 수 있게 한다.
 */
export function RequestPanel({ change, edit = true, data }: RequestPanelProps) {
  return (
    <section className="pnl rq">
      <table className="rq-t">
        <caption className="vh">적은 문장과 검색에 적용한 조건</caption>
        <tbody>
          {PROMPTS.map((p) =>
            data ? (
              <Row
                key={p.k}
                prompt={p}
                text={data[p.k].sentence}
                empty={!data[p.k].sentence}
                rows={data[p.k].conds}
              />
            ) : (
              <SampleRow key={p.k} prompt={p} change={change?.[p.k]} />
            ),
          )}
        </tbody>
      </table>
      {edit && (
        <Link className="lnk w5 t-sm rq-e" to={routes.search}>
          문장 다시 적기
        </Link>
      )}
    </section>
  );
}
