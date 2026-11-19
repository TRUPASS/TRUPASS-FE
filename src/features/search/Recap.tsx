import { Link } from 'react-router';
import { routes } from '@/app/routes';
import { PROMPTS } from '@/shared/sample/data';
import { Icon } from '@/shared/ui/Icon';
import { PromptText } from '@/shared/ui/PromptText';

interface RecapProps {
  className?: string;
  /** [문장 다시 적기] 링크를 보인다 (기본) */
  edit?: boolean;
}

/**
 * 적어 둔 문장 세 개. 앞 화면에서 실제로 적은 문장이 있으면 그 문장으로 바뀐다.
 * 적어 둔 문장 없이 들어온 경우(예: 랜딩에서 바로 [로그인])에는 예시 문장임을 알린다.
 */
export function Recap({ className, edit = true }: RecapProps) {
  return (
    <div className={className ? `rc ${className}` : 'rc'}>
      {PROMPTS.map((p) => (
        <div key={p.k} className="rc-r">
          <Icon name={p.icon} size={18} />
          <div className="g2 grow">
            <span className="l">{p.l}</span>
            <PromptText k={p.k} className="v">
              {p.v}
            </PromptText>
          </div>
        </div>
      ))}
      {edit && (
        <div className="rc-actions">
          <Link className="rc-e" to={`${routes.landing}#search`}>
            <Icon name="arrow--left" size={16} />
            문장 다시 적기
          </Link>
        </div>
      )}
    </div>
  );
}
