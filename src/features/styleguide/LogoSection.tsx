import { Logo, LogoMark } from '@/shared/ui/Logo';
import { Section } from './Section';

/** 로고: 바탕(흰색 · 남색 · 하늘색)마다의 색 조합, 마크의 크기, 랜딩 제목에만 쓰는 글자 워드마크 */
export function LogoSection() {
  return (
    <Section
      title="로고"
      desc="탑승권을 가로지른 길이 화살표로 이어진다. 흰 바탕에서는 남색과 하늘색 두 색, 남색 면에서는 흰색과 하늘색, 사진과 색 면 위에서는 흰색 한 가지로 쓴다. 끝의 가는 글자는 랜딩 첫 화면의 제목에만 쓴다."
    >
      <div className="row g16 wrap">
        <div className="logo-t">
          <Logo size={40} to="#" />
        </div>
        <div className="logo-t on-ink">
          <Logo size={32} variant="duo" to="#" />
        </div>
        <div className="logo-t on-sky">
          <Logo size={32} variant="inv" to="#" />
        </div>
      </div>
      <div className="row g16 wrap">
        <div className="logo-t row g24">
          <LogoMark size={64} />
          <LogoMark size={40} />
          <LogoMark size={24} />
          <LogoMark size={16} />
        </div>
        <div className="logo-t wmk">
          <span className="wm-b">TRUPASS</span>
          <span className="wm-s">AI Travel Search</span>
        </div>
      </div>
    </Section>
  );
}
