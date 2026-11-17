import { useLayoutEffect, useRef } from 'react';
import { routes } from '@/app/routes';
import { reduceMotion, still } from '@/shared/lib/capture';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { Logo } from '@/shared/ui/Logo';

export function Hero({ signedIn, onStart }: { signedIn: boolean; onStart: () => void }) {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const hero = section.current;
    const stickyFrame = frame.current;
    if (still || !hero || !stickyFrame) return;

    let progress: number | undefined;
    let raf = 0;
    const update = () => {
      raf = 0;
      const span = hero.offsetHeight - stickyFrame.offsetHeight;
      if (span <= 0) return;
      const target = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / span));
      const previous = progress ?? target;
      progress =
        Math.abs(target - previous) < 0.0004 ? target : previous + (target - previous) * 0.16;
      hero.style.setProperty('--hero-progress', String(progress));
      if (progress !== target) schedule();
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <section
      ref={section}
      className="landing-hero"
      data-scroll-intro={!still || undefined}
      aria-labelledby="landing-title"
    >
      <div className="landing-hero-frame" ref={frame}>
        <div className="landing-hero-window">
          <div className="lyr landing-hero-sky" aria-hidden="true" />
          <div className="lyr landing-hero-mid" aria-hidden="true" />
          <div className="lyr landing-hero-deck" aria-hidden="true" />
          <div className="lyr landing-hero-haze" aria-hidden="true" />

          <header className="landing-nav">
            <Logo
              size={28}
              variant="inv"
              to={routes.landing}
              onClick={(event) => {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: reduceMotion() || still ? 'auto' : 'smooth' });
              }}
            />
            <nav className="landing-nav-actions" aria-label="랜딩 메뉴">
              <Button size="sm" to={signedIn ? routes.search : routes.login}>
                {signedIn ? '새 검색' : '로그인'}
              </Button>
              <Button
                className="landing-primary"
                size="sm"
                href="#search"
                onClick={(event) => {
                  event.preventDefault();
                  onStart();
                }}
              >
                검색 시작
                <span className="landing-primary-arrow">
                  <Icon name="arrow--up-right" size={16} />
                </span>
              </Button>
            </nav>
          </header>

          <div className="landing-hero-hint" aria-hidden="true">
            <span>스크롤을 내려 여행을 시작하세요</span>
            <i />
          </div>
          <div className="landing-hero-copy">
            <div className="landing-hero-wordmark" aria-hidden="true">
              <span>TRUPASS</span>
              <span>AI Travel Search</span>
            </div>
            <div className="landing-hero-intro">
              <h1 id="landing-title">
                항공권 · 숙소 · 여행 장소를
                <br />
                문장 세 개로 한 번에
              </h1>
              <p>
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
