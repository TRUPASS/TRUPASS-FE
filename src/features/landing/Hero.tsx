import { routes } from '@/app/routes';
import { Logo } from '@/shared/ui/Logo';

/** 하늘 구간: 스크롤을 내리면 구름이 가까워지며 서비스 소개가 크게 나온다. */
export function Hero({ onLogo }: { onLogo: () => void }) {
  return (
    <section className="lp-hero" data-sec="hero">
      <div className="hold">
        <div className="win">
          <div className="lyr sky" />
          <div className="lyr mid" />
          <div className="lyr deck" />
          <div className="lyr haze" />
          <div className="hero-logo">
            <Logo
              size={28}
              variant="inv"
              to={routes.landing}
              onClick={(e) => {
                e.preventDefault();
                onLogo();
              }}
            />
          </div>
          <div className="hero-hint" aria-hidden="true">
            <span>스크롤을 내려 여행을 시작하세요</span>
            <i />
          </div>
          <div className="hero-t">
            <div className="hero-wm">
              <span className="wm-b">TRUPASS</span>
              <span className="wm-s">AI Travel Search</span>
            </div>
            <div className="hero-cp">
              <h1 className="hero-h">
                항공권 · 숙소 · 여행 장소를
                <br />
                문장 세 개로 한 번에
              </h1>
              <p className="hero-d">
                여행 조건을 평소 말하듯 적으면 AI가 항공권과 숙소, 주변 장소를 함께 찾아 한 화면에
                정리합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
