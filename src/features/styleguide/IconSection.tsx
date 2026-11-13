import { Icon } from '@/shared/ui/Icon';
import { ICONS, type IconName } from '@/shared/ui/icons';
import { Section } from './Section';

// 아이콘 목록의 앞 60개를 보여 준다
const SHOWN = (Object.keys(ICONS) as IconName[]).slice(0, 60);
// 이름이 13자를 넘으면 12자까지만 적고 말줄임표를 붙인다
const short = (name: string) => (name.length > 13 ? `${name.slice(0, 12)}…` : name);

/** 아이콘: 쓰는 아이콘을 이름과 함께 늘어놓는다 */
export function IconSection() {
  return (
    <Section
      title="아이콘"
      desc="IBM Carbon Icons (Apache-2.0) · 32 그리드를 16 / 20 / 24로 축소해 쓴다"
    >
      <div className="ics">
        {SHOWN.map((name) => (
          <div key={name} className="ici">
            <Icon name={name} size={20} />
            <span className="t-xs c3">{short(name)}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
